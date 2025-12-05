import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ================================
// CATEGORIES
// ================================

// Get all categories for an organization
export const getCategories = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const categories = await ctx.db
            .query("forumCategories")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        // Get topic count for each category
        const enriched = await Promise.all(
            categories.map(async (category) => {
                const topics = await ctx.db
                    .query("forumTopics")
                    .withIndex("by_category", (q) => q.eq("categoryId", category._id))
                    .collect();

                return {
                    ...category,
                    topicCount: topics.length,
                    replyCount: topics.reduce((sum, t) => sum + t.replyCount, 0),
                };
            })
        );

        return enriched.filter(c => c.isActive).sort((a, b) => a.order - b.order);
    },
});

// Create category (admin only)
export const createCategory = mutation({
    args: {
        organizationId: v.id("organizations"),
        name: v.string(),
        description: v.string(),
        icon: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("forumCategories")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        return await ctx.db.insert("forumCategories", {
            ...args,
            order: existing.length,
            isActive: true,
            createdAt: Date.now(),
        });
    },
});

// ================================
// TOPICS
// ================================

// Get topics for a category
export const getTopics = query({
    args: {
        categoryId: v.id("forumCategories"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const topics = await ctx.db
            .query("forumTopics")
            .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
            .order("desc")
            .take(args.limit || 50);

        // Enrich with author data
        const enriched = await Promise.all(
            topics.map(async (topic) => {
                const author = await ctx.db.get(topic.authorId);
                let lastReplyUser = null;
                if (topic.lastReplyBy) {
                    lastReplyUser = await ctx.db.get(topic.lastReplyBy);
                }

                return {
                    ...topic,
                    author: author ? {
                        _id: author._id,
                        firstName: author.firstName,
                        lastName: author.lastName,
                        imageUrl: author.imageUrl,
                        role: author.role,
                    } : null,
                    lastReplyUser: lastReplyUser ? {
                        _id: lastReplyUser._id,
                        firstName: lastReplyUser.firstName,
                        lastName: lastReplyUser.lastName,
                    } : null,
                };
            })
        );

        // Sort: pinned first, then by last activity
        return enriched.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            const aTime = a.lastReplyAt || a.createdAt;
            const bTime = b.lastReplyAt || b.createdAt;
            return bTime - aTime;
        });
    },
});

// Get recent topics across all categories
export const getRecentTopics = query({
    args: {
        organizationId: v.id("organizations"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const topics = await ctx.db
            .query("forumTopics")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .order("desc")
            .take(args.limit || 20);

        const enriched = await Promise.all(
            topics.map(async (topic) => {
                const author = await ctx.db.get(topic.authorId);
                const category = await ctx.db.get(topic.categoryId);

                return {
                    ...topic,
                    author: author ? {
                        _id: author._id,
                        firstName: author.firstName,
                        lastName: author.lastName,
                        imageUrl: author.imageUrl,
                    } : null,
                    categoryName: category?.name || "Geral",
                };
            })
        );

        return enriched;
    },
});

// Get single topic with details
export const getTopic = query({
    args: { topicId: v.id("forumTopics") },
    handler: async (ctx, args) => {
        const topic = await ctx.db.get(args.topicId);
        if (!topic) return null;

        const author = await ctx.db.get(topic.authorId);
        const category = await ctx.db.get(topic.categoryId);

        return {
            ...topic,
            author: author ? {
                _id: author._id,
                firstName: author.firstName,
                lastName: author.lastName,
                imageUrl: author.imageUrl,
                role: author.role,
            } : null,
            categoryName: category?.name || "Geral",
        };
    },
});

// Create topic
export const createTopic = mutation({
    args: {
        categoryId: v.id("forumCategories"),
        organizationId: v.id("organizations"),
        authorId: v.id("users"),
        title: v.string(),
        content: v.string(),
        tags: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        const topicId = await ctx.db.insert("forumTopics", {
            categoryId: args.categoryId,
            organizationId: args.organizationId,
            authorId: args.authorId,
            title: args.title,
            content: args.content,
            isPinned: false,
            isLocked: false,
            isSolved: false,
            viewCount: 0,
            replyCount: 0,
            tags: args.tags || [],
            createdAt: now,
            updatedAt: now,
        });

        // Award points for participation
        const userPoints = await ctx.db
            .query("userPoints")
            .withIndex("by_user", (q) => q.eq("userId", args.authorId))
            .first();

        if (userPoints) {
            await ctx.db.patch(userPoints._id, {
                totalPoints: userPoints.totalPoints + 5,
                updatedAt: now,
            });

            await ctx.db.insert("pointTransactions", {
                userId: args.authorId,
                points: 5,
                type: "forum_participation",
                description: "Novo tópico criado no fórum",
                metadata: { topicId },
                createdAt: now,
            });
        }

        return topicId;
    },
});

// Increment view count
export const incrementViewCount = mutation({
    args: { topicId: v.id("forumTopics") },
    handler: async (ctx, args) => {
        const topic = await ctx.db.get(args.topicId);
        if (!topic) return;

        await ctx.db.patch(args.topicId, {
            viewCount: topic.viewCount + 1,
        });
    },
});

// Toggle topic solved
export const toggleSolved = mutation({
    args: { topicId: v.id("forumTopics") },
    handler: async (ctx, args) => {
        const topic = await ctx.db.get(args.topicId);
        if (!topic) return;

        await ctx.db.patch(args.topicId, {
            isSolved: !topic.isSolved,
            updatedAt: Date.now(),
        });
    },
});

// Toggle topic locked
export const toggleLocked = mutation({
    args: { topicId: v.id("forumTopics") },
    handler: async (ctx, args) => {
        const topic = await ctx.db.get(args.topicId);
        if (!topic) return;

        await ctx.db.patch(args.topicId, {
            isLocked: !topic.isLocked,
            updatedAt: Date.now(),
        });
    },
});

// Toggle topic pinned
export const togglePinned = mutation({
    args: { topicId: v.id("forumTopics") },
    handler: async (ctx, args) => {
        const topic = await ctx.db.get(args.topicId);
        if (!topic) return;

        await ctx.db.patch(args.topicId, {
            isPinned: !topic.isPinned,
            updatedAt: Date.now(),
        });
    },
});

// Delete topic
export const deleteTopic = mutation({
    args: { topicId: v.id("forumTopics") },
    handler: async (ctx, args) => {
        // Delete all replies first
        const replies = await ctx.db
            .query("forumReplies")
            .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
            .collect();

        for (const reply of replies) {
            // Delete likes
            const likes = await ctx.db
                .query("forumReplyLikes")
                .withIndex("by_reply", (q) => q.eq("replyId", reply._id))
                .collect();
            for (const like of likes) {
                await ctx.db.delete(like._id);
            }
            await ctx.db.delete(reply._id);
        }

        await ctx.db.delete(args.topicId);
    },
});

// ================================
// REPLIES
// ================================

// Get replies for a topic
export const getReplies = query({
    args: { topicId: v.id("forumTopics") },
    handler: async (ctx, args) => {
        const replies = await ctx.db
            .query("forumReplies")
            .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
            .collect();

        const enriched = await Promise.all(
            replies.map(async (reply) => {
                const author = await ctx.db.get(reply.authorId);
                return {
                    ...reply,
                    author: author ? {
                        _id: author._id,
                        firstName: author.firstName,
                        lastName: author.lastName,
                        imageUrl: author.imageUrl,
                        role: author.role,
                    } : null,
                };
            })
        );

        // Sort: accepted answer first, then by date
        return enriched.sort((a, b) => {
            if (a.isAcceptedAnswer && !b.isAcceptedAnswer) return -1;
            if (!a.isAcceptedAnswer && b.isAcceptedAnswer) return 1;
            return a.createdAt - b.createdAt;
        });
    },
});

// Create reply
export const createReply = mutation({
    args: {
        topicId: v.id("forumTopics"),
        authorId: v.id("users"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const topic = await ctx.db.get(args.topicId);
        if (!topic || topic.isLocked) throw new Error("Tópico não encontrado ou bloqueado");

        const replyId = await ctx.db.insert("forumReplies", {
            topicId: args.topicId,
            authorId: args.authorId,
            content: args.content,
            isAcceptedAnswer: false,
            likesCount: 0,
            createdAt: now,
            updatedAt: now,
        });

        // Update topic reply count and last reply
        await ctx.db.patch(args.topicId, {
            replyCount: topic.replyCount + 1,
            lastReplyAt: now,
            lastReplyBy: args.authorId,
            updatedAt: now,
        });

        // Award points
        const userPoints = await ctx.db
            .query("userPoints")
            .withIndex("by_user", (q) => q.eq("userId", args.authorId))
            .first();

        if (userPoints) {
            await ctx.db.patch(userPoints._id, {
                totalPoints: userPoints.totalPoints + 5,
                updatedAt: now,
            });

            await ctx.db.insert("pointTransactions", {
                userId: args.authorId,
                points: 5,
                type: "forum_participation",
                description: "Resposta no fórum",
                metadata: { topicId: args.topicId, replyId },
                createdAt: now,
            });
        }

        // Notify topic author
        if (topic.authorId !== args.authorId) {
            const replier = await ctx.db.get(args.authorId);
            await ctx.db.insert("notifications", {
                userId: topic.authorId,
                type: "comment_reply",
                title: "Nova resposta no seu tópico",
                message: `${replier?.firstName || "Alguém"} respondeu ao seu tópico "${topic.title}"`,
                link: `/student/community/topic/${args.topicId}`,
                isRead: false,
                metadata: { topicId: args.topicId, replyId },
                createdAt: now,
            });
        }

        return replyId;
    },
});

// Toggle accepted answer
export const toggleAcceptedAnswer = mutation({
    args: { replyId: v.id("forumReplies") },
    handler: async (ctx, args) => {
        const reply = await ctx.db.get(args.replyId);
        if (!reply) return;

        const now = Date.now();
        const wasAccepted = reply.isAcceptedAnswer;

        // If accepting, unaccept any other replies first
        if (!wasAccepted) {
            const otherReplies = await ctx.db
                .query("forumReplies")
                .withIndex("by_topic", (q) => q.eq("topicId", reply.topicId))
                .collect();

            for (const r of otherReplies) {
                if (r.isAcceptedAnswer) {
                    await ctx.db.patch(r._id, { isAcceptedAnswer: false });
                }
            }
        }

        await ctx.db.patch(args.replyId, {
            isAcceptedAnswer: !wasAccepted,
            updatedAt: now,
        });

        // Award bonus points for helpful answer
        if (!wasAccepted) {
            const userPoints = await ctx.db
                .query("userPoints")
                .withIndex("by_user", (q) => q.eq("userId", reply.authorId))
                .first();

            if (userPoints) {
                await ctx.db.patch(userPoints._id, {
                    totalPoints: userPoints.totalPoints + 15,
                    updatedAt: now,
                });

                await ctx.db.insert("pointTransactions", {
                    userId: reply.authorId,
                    points: 15,
                    type: "helpful_answer",
                    description: "Resposta aceita como solução",
                    metadata: { replyId: args.replyId },
                    createdAt: now,
                });
            }

            // Mark topic as solved
            await ctx.db.patch(reply.topicId, {
                isSolved: true,
                updatedAt: now,
            });
        }
    },
});

// Toggle like on reply
export const toggleReplyLike = mutation({
    args: {
        replyId: v.id("forumReplies"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const existingLike = await ctx.db
            .query("forumReplyLikes")
            .withIndex("by_reply", (q) => q.eq("replyId", args.replyId))
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .first();

        const reply = await ctx.db.get(args.replyId);
        if (!reply) throw new Error("Resposta não encontrada");

        if (existingLike) {
            await ctx.db.delete(existingLike._id);
            await ctx.db.patch(args.replyId, {
                likesCount: Math.max(0, reply.likesCount - 1),
            });
            return { liked: false };
        } else {
            await ctx.db.insert("forumReplyLikes", {
                replyId: args.replyId,
                userId: args.userId,
                createdAt: Date.now(),
            });
            await ctx.db.patch(args.replyId, {
                likesCount: reply.likesCount + 1,
            });
            return { liked: true };
        }
    },
});

// Delete reply
export const deleteReply = mutation({
    args: { replyId: v.id("forumReplies") },
    handler: async (ctx, args) => {
        const reply = await ctx.db.get(args.replyId);
        if (!reply) return;

        // Delete likes
        const likes = await ctx.db
            .query("forumReplyLikes")
            .withIndex("by_reply", (q) => q.eq("replyId", args.replyId))
            .collect();

        for (const like of likes) {
            await ctx.db.delete(like._id);
        }

        // Update topic reply count
        const topic = await ctx.db.get(reply.topicId);
        if (topic) {
            await ctx.db.patch(reply.topicId, {
                replyCount: Math.max(0, topic.replyCount - 1),
                updatedAt: Date.now(),
            });
        }

        await ctx.db.delete(args.replyId);
    },
});
