import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Buscar comentários de uma aula
export const getByLesson = query({
    args: {
        lessonId: v.id("lessons"),
    },
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query("lessonComments")
            .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
            .collect();

        // Filtrar apenas comentários raiz (sem parentId)
        const rootComments = comments.filter(c => !c.parentId);

        // Buscar informações dos usuários e respostas
        const commentsWithUsers = await Promise.all(
            rootComments.map(async (comment) => {
                const user = await ctx.db.get(comment.userId);
                const replies = comments
                    .filter(c => c.parentId === comment._id)
                    .sort((a, b) => a.createdAt - b.createdAt);

                const repliesWithUsers = await Promise.all(
                    replies.map(async (reply) => {
                        const replyUser = await ctx.db.get(reply.userId);
                        return {
                            ...reply,
                            user: replyUser ? {
                                _id: replyUser._id,
                                name: `${replyUser.firstName} ${replyUser.lastName}`,
                                imageUrl: replyUser.imageUrl,
                                role: replyUser.role,
                            } : null,
                        };
                    })
                );

                return {
                    ...comment,
                    user: user ? {
                        _id: user._id,
                        name: `${user.firstName} ${user.lastName}`,
                        imageUrl: user.imageUrl,
                        role: user.role,
                    } : null,
                    replies: repliesWithUsers,
                };
            })
        );

        // Ordenar: fixados primeiro, depois por data (mais recentes primeiro)
        return commentsWithUsers.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.createdAt - a.createdAt;
        });
    },
});

// Criar comentário
export const create = mutation({
    args: {
        lessonId: v.id("lessons"),
        userId: v.id("users"),
        content: v.string(),
        parentId: v.optional(v.id("lessonComments")),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        const commentId = await ctx.db.insert("lessonComments", {
            lessonId: args.lessonId,
            userId: args.userId,
            content: args.content,
            parentId: args.parentId,
            isResolved: false,
            isPinned: false,
            likesCount: 0,
            createdAt: now,
            updatedAt: now,
        });

        // Se for uma resposta, criar notificação para o autor do comentário pai
        if (args.parentId) {
            const parentComment = await ctx.db.get(args.parentId);
            if (parentComment && parentComment.userId !== args.userId) {
                const replier = await ctx.db.get(args.userId);
                const lesson = await ctx.db.get(args.lessonId);

                await ctx.db.insert("notifications", {
                    userId: parentComment.userId,
                    type: "comment_reply",
                    title: "Nova resposta ao seu comentário",
                    message: `${replier?.firstName || "Alguém"} respondeu ao seu comentário na aula "${lesson?.title || ""}"`,
                    link: `/student/courses/${lesson?.courseId}/learn`,
                    isRead: false,
                    metadata: { lessonId: args.lessonId, commentId },
                    createdAt: now,
                });
            }
        }

        return commentId;
    },
});

// Editar comentário
export const update = mutation({
    args: {
        commentId: v.id("lessonComments"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.commentId, {
            content: args.content,
            updatedAt: Date.now(),
        });
    },
});

// Excluir comentário
export const remove = mutation({
    args: {
        commentId: v.id("lessonComments"),
    },
    handler: async (ctx, args) => {
        // Excluir respostas primeiro
        const replies = await ctx.db
            .query("lessonComments")
            .withIndex("by_parent", (q) => q.eq("parentId", args.commentId))
            .collect();

        for (const reply of replies) {
            await ctx.db.delete(reply._id);
        }

        // Excluir likes
        const likes = await ctx.db
            .query("commentLikes")
            .withIndex("by_comment", (q) => q.eq("commentId", args.commentId))
            .collect();

        for (const like of likes) {
            await ctx.db.delete(like._id);
        }

        await ctx.db.delete(args.commentId);
    },
});

// Toggle like em um comentário
export const toggleLike = mutation({
    args: {
        commentId: v.id("lessonComments"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const existingLike = await ctx.db
            .query("commentLikes")
            .withIndex("by_comment", (q) => q.eq("commentId", args.commentId))
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .first();

        const comment = await ctx.db.get(args.commentId);
        if (!comment) throw new Error("Comentário não encontrado");

        if (existingLike) {
            // Descurtir
            await ctx.db.delete(existingLike._id);
            await ctx.db.patch(args.commentId, {
                likesCount: Math.max(0, comment.likesCount - 1),
            });
            return { liked: false };
        } else {
            // Curtir
            await ctx.db.insert("commentLikes", {
                commentId: args.commentId,
                userId: args.userId,
                createdAt: Date.now(),
            });
            await ctx.db.patch(args.commentId, {
                likesCount: comment.likesCount + 1,
            });
            return { liked: true };
        }
    },
});

// Marcar como resolvido (para professores)
export const toggleResolved = mutation({
    args: {
        commentId: v.id("lessonComments"),
    },
    handler: async (ctx, args) => {
        const comment = await ctx.db.get(args.commentId);
        if (!comment) return;

        await ctx.db.patch(args.commentId, {
            isResolved: !comment.isResolved,
            updatedAt: Date.now(),
        });
    },
});

// Fixar comentário (para professores)
export const togglePinned = mutation({
    args: {
        commentId: v.id("lessonComments"),
    },
    handler: async (ctx, args) => {
        const comment = await ctx.db.get(args.commentId);
        if (!comment) return;

        await ctx.db.patch(args.commentId, {
            isPinned: !comment.isPinned,
            updatedAt: Date.now(),
        });
    },
});

// Buscar total de comentários por aula
export const getCountByLesson = query({
    args: {
        lessonId: v.id("lessons"),
    },
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query("lessonComments")
            .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
            .collect();

        return comments.length;
    },
});

// Buscar comentários não resolvidos de um curso (para professor)
export const getUnresolvedByCourse = query({
    args: {
        courseId: v.id("courses"),
    },
    handler: async (ctx, args) => {
        const lessons = await ctx.db
            .query("lessons")
            .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
            .collect();

        let unresolvedComments: any[] = [];
        for (const lesson of lessons) {
            const comments = await ctx.db
                .query("lessonComments")
                .withIndex("by_lesson", (q) => q.eq("lessonId", lesson._id))
                .collect();

            const unresolved = comments.filter(c => !c.isResolved && !c.parentId);
            for (const comment of unresolved) {
                unresolvedComments.push({
                    ...comment,
                    lessonTitle: lesson.title,
                    lessonId: lesson._id,
                });
            }
        }

        // Adicionar informações do usuário
        return await Promise.all(
            unresolvedComments.map(async (comment) => {
                const user = await ctx.db.get(comment.userId);
                return {
                    ...comment,
                    user: user ? {
                        _id: user._id,
                        name: `${user.firstName} ${user.lastName}`,
                        imageUrl: user.imageUrl,
                    } : null,
                };
            })
        );
    },
});
