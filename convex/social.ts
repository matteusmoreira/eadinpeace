import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAuth, requireAuthWithOrg, requireOwnerOrAdmin } from "./authHelpers";

// Social Network Module - Created December 2025

// ================================
// POSTS
// ================================

// Criar novo post
export const createPost = mutation({
    args: {
        authorId: v.id("users"),
        organizationId: v.id("organizations"),
        content: v.string(),
        imageUrl: v.optional(v.string()),
        imageStorageId: v.optional(v.id("_storage")),
        videoUrl: v.optional(v.string()), // URL de vídeo (YouTube, Vimeo, etc)
        visibility: v.union(
            v.literal("public"),
            v.literal("followers"),
            v.literal("private")
        ),
    },
    handler: async (ctx, args) => {
        // Verificar autenticação e validar organização
        const auth = await requireAuthWithOrg(ctx, args.organizationId);

        // Verificar que o autor é o próprio usuário autenticado (ou admin)
        if (auth.user.role !== "superadmin" && auth.user.role !== "admin" && auth.user._id !== args.authorId) {
            throw new Error("Você só pode criar posts em seu próprio nome");
        }

        const now = Date.now();
        const postId = await ctx.db.insert("socialPosts", {
            authorId: args.authorId,
            organizationId: args.organizationId,
            content: args.content,
            imageUrl: args.imageUrl,
            imageStorageId: args.imageStorageId,
            videoUrl: args.videoUrl,
            visibility: args.visibility,
            likesCount: 0,
            commentsCount: 0,
            sharesCount: 0,
            isShared: false,
            createdAt: now,
            updatedAt: now,
        });
        return postId;
    },
});

// Compartilhar post
export const sharePost = mutation({
    args: {
        originalPostId: v.id("socialPosts"),
        authorId: v.id("users"),
        organizationId: v.id("organizations"),
        shareComment: v.optional(v.string()),
        visibility: v.union(
            v.literal("public"),
            v.literal("followers"),
            v.literal("private")
        ),
    },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const originalPost = await ctx.db.get(args.originalPostId);
        if (!originalPost) {
            throw new Error("Post original não encontrado");
        }

        const now = Date.now();

        // Criar post compartilhado
        const sharedPostId = await ctx.db.insert("socialPosts", {
            authorId: args.authorId,
            organizationId: args.organizationId,
            content: originalPost.content,
            imageUrl: originalPost.imageUrl,
            imageStorageId: originalPost.imageStorageId,
            videoUrl: originalPost.videoUrl,
            visibility: args.visibility,
            likesCount: 0,
            commentsCount: 0,
            sharesCount: 0,
            isShared: true,
            originalPostId: args.originalPostId,
            shareComment: args.shareComment,
            createdAt: now,
            updatedAt: now,
        });

        // Incrementar contador de compartilhamentos no post original
        await ctx.db.patch(args.originalPostId, {
            sharesCount: (originalPost.sharesCount || 0) + 1,
            updatedAt: now,
        });

        return sharedPostId;
    },
});

// Buscar feed
export const getFeed = query({
    args: {
        organizationId: v.id("organizations"),
        userId: v.id("users"),
        limit: v.optional(v.number()),
        cursor: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 20;

        // Buscar quem o usuário segue
        const following = await ctx.db
            .query("userFollows")
            .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
            .collect();

        const followingIds = new Set(following.map((f) => f.followingId));

        // Buscar posts da organização
        const postsQuery = ctx.db
            .query("socialPosts")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .order("desc");

        const allPosts = await postsQuery.collect();

        // Filtrar por visibilidade
        const visiblePosts = allPosts.filter((post) => {
            // Posts do próprio usuário sempre visíveis
            if (post.authorId === args.userId) return true;

            // Posts públicos
            if (post.visibility === "public") return true;

            // Posts de seguidores - só se o usuário segue o autor
            if (post.visibility === "followers" && followingIds.has(post.authorId)) {
                return true;
            }

            return false;
        });

        // Aplicar cursor e limit
        let startIndex = 0;
        if (args.cursor) {
            const cursorIndex = visiblePosts.findIndex((p) => p.createdAt < args.cursor!);
            if (cursorIndex > -1) startIndex = cursorIndex;
        }

        const paginatedPosts = visiblePosts.slice(startIndex, startIndex + limit);

        // Enriquecer posts com dados do autor
        const postsWithAuthors = await Promise.all(
            paginatedPosts.map(async (post) => {
                const author = await ctx.db.get(post.authorId);

                // Se for compartilhamento, buscar post original e seu autor
                let originalPost = null;
                let originalAuthor = null;
                if (post.isShared && post.originalPostId) {
                    originalPost = await ctx.db.get(post.originalPostId);
                    if (originalPost) {
                        originalAuthor = await ctx.db.get(originalPost.authorId);
                    }
                }

                // Verificar se o usuário atual curtiu o post
                const userLike = await ctx.db
                    .query("postLikes")
                    .withIndex("by_post_user", (q) =>
                        q.eq("postId", post._id).eq("userId", args.userId)
                    )
                    .first();

                return {
                    ...post,
                    author: author
                        ? {
                            _id: author._id,
                            firstName: author.firstName,
                            lastName: author.lastName,
                            imageUrl: author.imageUrl,
                            role: author.role,
                        }
                        : null,
                    originalPost: originalPost
                        ? {
                            ...originalPost,
                            author: originalAuthor
                                ? {
                                    _id: originalAuthor._id,
                                    firstName: originalAuthor.firstName,
                                    lastName: originalAuthor.lastName,
                                    imageUrl: originalAuthor.imageUrl,
                                    role: originalAuthor.role,
                                }
                                : null,
                        }
                        : null,
                    isLikedByUser: !!userLike,
                };
            })
        );

        const nextCursor =
            paginatedPosts.length === limit
                ? paginatedPosts[paginatedPosts.length - 1].createdAt
                : null;

        return {
            posts: postsWithAuthors,
            nextCursor,
        };
    },
});

// Buscar posts de um usuário específico
export const getUserPosts = query({
    args: {
        userId: v.id("users"),
        viewerId: v.id("users"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 20;

        // Verificar se o viewer segue o usuário
        const isFollowing = await ctx.db
            .query("userFollows")
            .withIndex("by_pair", (q) =>
                q.eq("followerId", args.viewerId).eq("followingId", args.userId)
            )
            .first();

        const posts = await ctx.db
            .query("socialPosts")
            .withIndex("by_author", (q) => q.eq("authorId", args.userId))
            .order("desc")
            .collect();

        // Filtrar por visibilidade
        const visiblePosts = posts.filter((post) => {
            if (args.userId === args.viewerId) return true;
            if (post.visibility === "public") return true;
            if (post.visibility === "followers" && isFollowing) return true;
            return false;
        });

        const author = await ctx.db.get(args.userId);

        return visiblePosts.slice(0, limit).map((post) => ({
            ...post,
            author: author
                ? {
                    _id: author._id,
                    firstName: author.firstName,
                    lastName: author.lastName,
                    imageUrl: author.imageUrl,
                    role: author.role,
                }
                : null,
        }));
    },
});

// Deletar post
export const deletePost = mutation({
    args: {
        postId: v.id("socialPosts"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const post = await ctx.db.get(args.postId);
        if (!post) throw new Error("Post não encontrado");
        if (post.authorId !== args.userId) {
            throw new Error("Você não pode deletar este post");
        }

        // Deletar likes do post
        const likes = await ctx.db
            .query("postLikes")
            .withIndex("by_post", (q) => q.eq("postId", args.postId))
            .collect();
        for (const like of likes) {
            await ctx.db.delete(like._id);
        }

        // Deletar comentários do post
        const comments = await ctx.db
            .query("postComments")
            .withIndex("by_post", (q) => q.eq("postId", args.postId))
            .collect();
        for (const comment of comments) {
            // Deletar likes dos comentários
            const commentLikes = await ctx.db
                .query("commentLikesOnPosts")
                .withIndex("by_comment", (q) => q.eq("commentId", comment._id))
                .collect();
            for (const cl of commentLikes) {
                await ctx.db.delete(cl._id);
            }
            await ctx.db.delete(comment._id);
        }

        await ctx.db.delete(args.postId);
    },
});

// ================================
// LIKES
// ================================

// Curtir/Descurtir post
export const toggleLike = mutation({
    args: {
        postId: v.id("socialPosts"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const post = await ctx.db.get(args.postId);
        if (!post) throw new Error("Post não encontrado");

        const existingLike = await ctx.db
            .query("postLikes")
            .withIndex("by_post_user", (q) =>
                q.eq("postId", args.postId).eq("userId", args.userId)
            )
            .first();

        if (existingLike) {
            // Remover like
            await ctx.db.delete(existingLike._id);
            await ctx.db.patch(args.postId, {
                likesCount: Math.max(0, post.likesCount - 1),
                updatedAt: Date.now(),
            });
            return { liked: false };
        } else {
            // Adicionar like
            await ctx.db.insert("postLikes", {
                postId: args.postId,
                userId: args.userId,
                createdAt: Date.now(),
            });
            await ctx.db.patch(args.postId, {
                likesCount: post.likesCount + 1,
                updatedAt: Date.now(),
            });
            return { liked: true };
        }
    },
});

// Buscar quem curtiu um post
export const getPostLikes = query({
    args: {
        postId: v.id("socialPosts"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;
        const likes = await ctx.db
            .query("postLikes")
            .withIndex("by_post", (q) => q.eq("postId", args.postId))
            .order("desc")
            .take(limit);

        const likesWithUsers = await Promise.all(
            likes.map(async (like) => {
                const user = await ctx.db.get(like.userId);
                return {
                    ...like,
                    user: user
                        ? {
                            _id: user._id,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            imageUrl: user.imageUrl,
                        }
                        : null,
                };
            })
        );

        return likesWithUsers;
    },
});

// ================================
// COMMENTS
// ================================

// Adicionar comentário
export const addComment = mutation({
    args: {
        postId: v.id("socialPosts"),
        authorId: v.id("users"),
        content: v.string(),
        parentId: v.optional(v.id("postComments")),
    },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const post = await ctx.db.get(args.postId);
        if (!post) throw new Error("Post não encontrado");

        const now = Date.now();
        const commentId = await ctx.db.insert("postComments", {
            postId: args.postId,
            authorId: args.authorId,
            content: args.content,
            parentId: args.parentId,
            likesCount: 0,
            createdAt: now,
            updatedAt: now,
        });

        // Incrementar contador de comentários
        await ctx.db.patch(args.postId, {
            commentsCount: post.commentsCount + 1,
            updatedAt: now,
        });

        return commentId;
    },
});

// Buscar comentários de um post
export const getComments = query({
    args: {
        postId: v.id("socialPosts"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query("postComments")
            .withIndex("by_post", (q) => q.eq("postId", args.postId))
            .order("desc")
            .collect();

        // Separar comentários principais e respostas
        const mainComments = comments.filter((c) => !c.parentId);
        const replies = comments.filter((c) => c.parentId);

        const commentsWithAuthors = await Promise.all(
            mainComments.map(async (comment) => {
                const author = await ctx.db.get(comment.authorId);

                // Verificar se o usuário atual curtiu o comentário
                const userLike = await ctx.db
                    .query("commentLikesOnPosts")
                    .withIndex("by_comment_user", (q) =>
                        q.eq("commentId", comment._id).eq("userId", args.userId)
                    )
                    .first();

                // Buscar respostas deste comentário
                const commentReplies = replies.filter(
                    (r) => r.parentId === comment._id
                );
                const repliesWithAuthors = await Promise.all(
                    commentReplies.map(async (reply) => {
                        const replyAuthor = await ctx.db.get(reply.authorId);
                        const replyUserLike = await ctx.db
                            .query("commentLikesOnPosts")
                            .withIndex("by_comment_user", (q) =>
                                q.eq("commentId", reply._id).eq("userId", args.userId)
                            )
                            .first();
                        return {
                            ...reply,
                            author: replyAuthor
                                ? {
                                    _id: replyAuthor._id,
                                    firstName: replyAuthor.firstName,
                                    lastName: replyAuthor.lastName,
                                    imageUrl: replyAuthor.imageUrl,
                                }
                                : null,
                            isLikedByUser: !!replyUserLike,
                        };
                    })
                );

                return {
                    ...comment,
                    author: author
                        ? {
                            _id: author._id,
                            firstName: author.firstName,
                            lastName: author.lastName,
                            imageUrl: author.imageUrl,
                        }
                        : null,
                    isLikedByUser: !!userLike,
                    replies: repliesWithAuthors,
                };
            })
        );

        return commentsWithAuthors;
    },
});

// Curtir comentário
export const toggleCommentLike = mutation({
    args: {
        commentId: v.id("postComments"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const comment = await ctx.db.get(args.commentId);
        if (!comment) throw new Error("Comentário não encontrado");

        const existingLike = await ctx.db
            .query("commentLikesOnPosts")
            .withIndex("by_comment_user", (q) =>
                q.eq("commentId", args.commentId).eq("userId", args.userId)
            )
            .first();

        if (existingLike) {
            await ctx.db.delete(existingLike._id);
            await ctx.db.patch(args.commentId, {
                likesCount: Math.max(0, comment.likesCount - 1),
            });
            return { liked: false };
        } else {
            await ctx.db.insert("commentLikesOnPosts", {
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

// Deletar comentário
export const deleteComment = mutation({
    args: {
        commentId: v.id("postComments"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const comment = await ctx.db.get(args.commentId);
        if (!comment) throw new Error("Comentário não encontrado");
        if (comment.authorId !== args.userId) {
            throw new Error("Você não pode deletar este comentário");
        }

        const post = await ctx.db.get(comment.postId);
        if (post) {
            await ctx.db.patch(comment.postId, {
                commentsCount: Math.max(0, post.commentsCount - 1),
            });
        }

        // Deletar likes do comentário
        const likes = await ctx.db
            .query("commentLikesOnPosts")
            .withIndex("by_comment", (q) => q.eq("commentId", args.commentId))
            .collect();
        for (const like of likes) {
            await ctx.db.delete(like._id);
        }

        // Deletar respostas
        const replies = await ctx.db
            .query("postComments")
            .withIndex("by_parent", (q) => q.eq("parentId", args.commentId))
            .collect();
        for (const reply of replies) {
            await ctx.db.delete(reply._id);
            if (post) {
                await ctx.db.patch(comment.postId, {
                    commentsCount: Math.max(0, (post.commentsCount || 0) - 1),
                });
            }
        }

        await ctx.db.delete(args.commentId);
    },
});

// ================================
// FOLLOWS
// ================================

// Seguir/Deixar de seguir
export const toggleFollow = mutation({
    args: {
        followerId: v.id("users"),
        followingId: v.id("users"),
    },
    handler: async (ctx, args) => {
        if (args.followerId === args.followingId) {
            throw new Error("Você não pode seguir a si mesmo");
        }

        const existingFollow = await ctx.db
            .query("userFollows")
            .withIndex("by_pair", (q) =>
                q.eq("followerId", args.followerId).eq("followingId", args.followingId)
            )
            .first();

        if (existingFollow) {
            await ctx.db.delete(existingFollow._id);
            return { following: false };
        } else {
            await ctx.db.insert("userFollows", {
                followerId: args.followerId,
                followingId: args.followingId,
                createdAt: Date.now(),
            });
            return { following: true };
        }
    },
});

// Verificar se segue
export const isFollowing = query({
    args: {
        followerId: v.id("users"),
        followingId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const follow = await ctx.db
            .query("userFollows")
            .withIndex("by_pair", (q) =>
                q.eq("followerId", args.followerId).eq("followingId", args.followingId)
            )
            .first();
        return !!follow;
    },
});

// Buscar seguidores
export const getFollowers = query({
    args: {
        userId: v.id("users"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;
        const followers = await ctx.db
            .query("userFollows")
            .withIndex("by_following", (q) => q.eq("followingId", args.userId))
            .order("desc")
            .take(limit);

        const followersWithUsers = await Promise.all(
            followers.map(async (f) => {
                const user = await ctx.db.get(f.followerId);
                return user
                    ? {
                        _id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        imageUrl: user.imageUrl,
                        role: user.role,
                    }
                    : null;
            })
        );

        return followersWithUsers.filter(Boolean);
    },
});

// Buscar quem está seguindo
export const getFollowing = query({
    args: {
        userId: v.id("users"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;
        const following = await ctx.db
            .query("userFollows")
            .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
            .order("desc")
            .take(limit);

        const followingWithUsers = await Promise.all(
            following.map(async (f) => {
                const user = await ctx.db.get(f.followingId);
                return user
                    ? {
                        _id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        imageUrl: user.imageUrl,
                        role: user.role,
                    }
                    : null;
            })
        );

        return followingWithUsers.filter(Boolean);
    },
});

// Estatísticas de seguidores
export const getFollowStats = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const followers = await ctx.db
            .query("userFollows")
            .withIndex("by_following", (q) => q.eq("followingId", args.userId))
            .collect();

        const following = await ctx.db
            .query("userFollows")
            .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
            .collect();

        return {
            followersCount: followers.length,
            followingCount: following.length,
        };
    },
});

// Sugestões de pessoas para seguir
export const getSuggestedUsers = query({
    args: {
        userId: v.id("users"),
        organizationId: v.id("organizations"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 5;

        // Buscar quem o usuário já segue
        const following = await ctx.db
            .query("userFollows")
            .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
            .collect();
        const followingIds = new Set(following.map((f) => f.followingId));

        // Buscar usuários da organização
        const users = await ctx.db
            .query("users")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        // Filtrar: remover o próprio usuário e quem já segue
        const suggestions = users
            .filter((u) => u._id !== args.userId && !followingIds.has(u._id))
            .slice(0, limit);

        return suggestions.map((u) => ({
            _id: u._id,
            firstName: u.firstName,
            lastName: u.lastName,
            imageUrl: u.imageUrl,
            role: u.role,
        }));
    },
});

// ================================
// DIRECT MESSAGES
// ================================

// Criar ou buscar conversa existente
export const getOrCreateConversation = mutation({
    args: {
        organizationId: v.id("organizations"),
        participantIds: v.array(v.id("users")),
    },
    handler: async (ctx, args) => {
        if (args.participantIds.length !== 2) {
            throw new Error("Conversa deve ter exatamente 2 participantes");
        }

        // Ordenar IDs para consistência
        const sortedIds = [...args.participantIds].sort();

        // Buscar conversa existente
        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const existing = conversations.find((c) => {
            const sorted = [...c.participantIds].sort();
            return sorted[0] === sortedIds[0] && sorted[1] === sortedIds[1];
        });

        if (existing) {
            return existing._id;
        }

        // Criar nova conversa
        const now = Date.now();
        const conversationId = await ctx.db.insert("conversations", {
            organizationId: args.organizationId,
            participantIds: sortedIds as [Id<"users">, Id<"users">],
            lastMessageAt: now,
            createdAt: now,
        });

        return conversationId;
    },
});

// Enviar mensagem
export const sendMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) {
            throw new Error("Conversa não encontrada");
        }

        if (!conversation.participantIds.includes(args.senderId)) {
            throw new Error("Você não faz parte desta conversa");
        }

        const now = Date.now();

        // Criar mensagem
        const messageId = await ctx.db.insert("directMessages", {
            conversationId: args.conversationId,
            senderId: args.senderId,
            content: args.content,
            isRead: false,
            createdAt: now,
        });

        // Atualizar conversa
        await ctx.db.patch(args.conversationId, {
            lastMessageAt: now,
            lastMessagePreview: args.content.substring(0, 100),
            lastMessageSenderId: args.senderId,
        });

        return messageId;
    },
});

// Buscar conversas de um usuário
export const getConversations = query({
    args: {
        userId: v.id("users"),
        organizationId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .order("desc")
            .collect();

        // Filtrar conversas do usuário
        const userConversations = conversations.filter((c) =>
            c.participantIds.includes(args.userId)
        );

        // Enriquecer com dados do outro participante e contagem de não lidas
        const enrichedConversations = await Promise.all(
            userConversations.map(async (conv) => {
                const otherUserId = conv.participantIds.find((id) => id !== args.userId);
                const otherUser = otherUserId ? await ctx.db.get(otherUserId) : null;

                // Contar mensagens não lidas
                const unreadMessages = await ctx.db
                    .query("directMessages")
                    .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
                    .filter((q) =>
                        q.and(
                            q.eq(q.field("isRead"), false),
                            q.neq(q.field("senderId"), args.userId)
                        )
                    )
                    .collect();

                return {
                    ...conv,
                    otherUser: otherUser
                        ? {
                            _id: otherUser._id,
                            firstName: otherUser.firstName,
                            lastName: otherUser.lastName,
                            imageUrl: otherUser.imageUrl,
                        }
                        : null,
                    unreadCount: unreadMessages.length,
                };
            })
        );

        return enrichedConversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    },
});

// Buscar mensagens de uma conversa
export const getMessages = query({
    args: {
        conversationId: v.id("conversations"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;

        const messages = await ctx.db
            .query("directMessages")
            .withIndex("by_conversation_created", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .order("desc")
            .take(limit);

        const messagesWithSenders = await Promise.all(
            messages.map(async (msg) => {
                const sender = await ctx.db.get(msg.senderId);
                return {
                    ...msg,
                    sender: sender
                        ? {
                            _id: sender._id,
                            firstName: sender.firstName,
                            lastName: sender.lastName,
                            imageUrl: sender.imageUrl,
                        }
                        : null,
                };
            })
        );

        // Retornar em ordem cronológica
        return messagesWithSenders.reverse();
    },
});

// Marcar mensagens como lidas
export const markMessagesAsRead = mutation({
    args: {
        conversationId: v.id("conversations"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        const unreadMessages = await ctx.db
            .query("directMessages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("isRead"), false),
                    q.neq(q.field("senderId"), args.userId)
                )
            )
            .collect();

        for (const msg of unreadMessages) {
            await ctx.db.patch(msg._id, {
                isRead: true,
                readAt: now,
            });
        }

        return { markedCount: unreadMessages.length };
    },
});

// Contagem total de mensagens não lidas
export const getUnreadCount = query({
    args: {
        userId: v.id("users"),
        organizationId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const userConversations = conversations.filter((c) =>
            c.participantIds.includes(args.userId)
        );

        let totalUnread = 0;

        for (const conv of userConversations) {
            const unreadMessages = await ctx.db
                .query("directMessages")
                .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("isRead"), false),
                        q.neq(q.field("senderId"), args.userId)
                    )
                )
                .collect();
            totalUnread += unreadMessages.length;
        }

        return totalUnread;
    },
});

// Buscar perfil de usuário para a rede social
export const getUserProfile = query({
    args: {
        userId: v.id("users"),
        viewerId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return null;

        // Estatísticas
        const followers = await ctx.db
            .query("userFollows")
            .withIndex("by_following", (q) => q.eq("followingId", args.userId))
            .collect();

        const following = await ctx.db
            .query("userFollows")
            .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
            .collect();

        const posts = await ctx.db
            .query("socialPosts")
            .withIndex("by_author", (q) => q.eq("authorId", args.userId))
            .collect();

        // Verificar se o viewer segue o usuário
        const isFollowingUser = await ctx.db
            .query("userFollows")
            .withIndex("by_pair", (q) =>
                q.eq("followerId", args.viewerId).eq("followingId", args.userId)
            )
            .first();

        return {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            role: user.role,
            followersCount: followers.length,
            followingCount: following.length,
            postsCount: posts.length,
            isFollowing: !!isFollowingUser,
            isOwnProfile: args.userId === args.viewerId,
        };
    },
});
