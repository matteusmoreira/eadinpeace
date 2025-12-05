import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Point values for different actions
const POINT_VALUES = {
    lesson_complete: 10,
    course_complete: 100,
    quiz_pass: 25,
    certificate_earned: 50,
    streak_bonus: 5, // per day
    forum_participation: 5,
    helpful_answer: 15,
};

// Get leaderboard for organization
export const getLeaderboard = query({
    args: {
        organizationId: v.id("organizations"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;

        const userPoints = await ctx.db
            .query("userPoints")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        // Sort by total points (descending)
        const sorted = userPoints.sort((a, b) => b.totalPoints - a.totalPoints);
        const top = sorted.slice(0, limit);

        // Enrich with user data
        const enriched = await Promise.all(
            top.map(async (point, index) => {
                const user = await ctx.db.get(point.userId);
                return {
                    rank: index + 1,
                    ...point,
                    user: user ? {
                        _id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        imageUrl: user.imageUrl,
                    } : null,
                };
            })
        );

        return enriched;
    },
});

// Get user rank and stats
export const getUserStats = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const userPoint = await ctx.db
            .query("userPoints")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        if (!userPoint) {
            return {
                totalPoints: 0,
                rank: null,
                coursesCompleted: 0,
                lessonsCompleted: 0,
                quizzesPassed: 0,
                certificatesEarned: 0,
                currentStreak: 0,
                longestStreak: 0,
            };
        }

        // Calculate rank
        const allPoints = await ctx.db
            .query("userPoints")
            .withIndex("by_organization", (q) => q.eq("organizationId", userPoint.organizationId))
            .collect();

        const sorted = allPoints.sort((a, b) => b.totalPoints - a.totalPoints);
        const rank = sorted.findIndex((p) => p.userId === args.userId) + 1;

        return {
            ...userPoint,
            rank,
            totalUsers: allPoints.length,
        };
    },
});

// Get user point history
export const getPointHistory = query({
    args: {
        userId: v.id("users"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const transactions = await ctx.db
            .query("pointTransactions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(args.limit || 50);

        return transactions;
    },
});

// Add points to user (internal use)
export const addPoints = mutation({
    args: {
        userId: v.id("users"),
        organizationId: v.id("organizations"),
        points: v.number(),
        type: v.union(
            v.literal("lesson_complete"),
            v.literal("course_complete"),
            v.literal("quiz_pass"),
            v.literal("certificate_earned"),
            v.literal("streak_bonus"),
            v.literal("forum_participation"),
            v.literal("helpful_answer"),
            v.literal("admin_adjustment")
        ),
        description: v.string(),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Create transaction record
        await ctx.db.insert("pointTransactions", {
            userId: args.userId,
            points: args.points,
            type: args.type,
            description: args.description,
            metadata: args.metadata,
            createdAt: now,
        });

        // Update or create user points
        const existingPoints = await ctx.db
            .query("userPoints")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        if (existingPoints) {
            // Update counters based on type
            const updates: any = {
                totalPoints: existingPoints.totalPoints + args.points,
                lastActivityAt: now,
                updatedAt: now,
            };

            if (args.type === "lesson_complete") {
                updates.lessonsCompleted = existingPoints.lessonsCompleted + 1;
            } else if (args.type === "course_complete") {
                updates.coursesCompleted = existingPoints.coursesCompleted + 1;
            } else if (args.type === "quiz_pass") {
                updates.quizzesPassed = existingPoints.quizzesPassed + 1;
            } else if (args.type === "certificate_earned") {
                updates.certificatesEarned = existingPoints.certificatesEarned + 1;
            }

            await ctx.db.patch(existingPoints._id, updates);
        } else {
            // Create new record
            await ctx.db.insert("userPoints", {
                userId: args.userId,
                organizationId: args.organizationId,
                totalPoints: args.points,
                coursesCompleted: args.type === "course_complete" ? 1 : 0,
                lessonsCompleted: args.type === "lesson_complete" ? 1 : 0,
                quizzesPassed: args.type === "quiz_pass" ? 1 : 0,
                certificatesEarned: args.type === "certificate_earned" ? 1 : 0,
                currentStreak: 0,
                longestStreak: 0,
                lastActivityAt: now,
                updatedAt: now,
            });
        }

        return { added: args.points };
    },
});

// Update streak
export const updateStreak = mutation({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const today = new Date(now).setHours(0, 0, 0, 0);
        const yesterday = today - 24 * 60 * 60 * 1000;

        const userPoint = await ctx.db
            .query("userPoints")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        if (!userPoint) return { streak: 0 };

        const lastActivity = new Date(userPoint.lastActivityAt).setHours(0, 0, 0, 0);

        let newStreak = userPoint.currentStreak;
        let bonusPoints = 0;

        if (lastActivity === today) {
            // Already active today, no streak change
        } else if (lastActivity === yesterday) {
            // Continue streak
            newStreak = userPoint.currentStreak + 1;
            bonusPoints = POINT_VALUES.streak_bonus * newStreak;
        } else if (lastActivity < yesterday) {
            // Break streak
            newStreak = 1;
        }

        const longestStreak = Math.max(newStreak, userPoint.longestStreak);

        await ctx.db.patch(userPoint._id, {
            currentStreak: newStreak,
            longestStreak,
            lastActivityAt: now,
            totalPoints: userPoint.totalPoints + bonusPoints,
            updatedAt: now,
        });

        // Add bonus points transaction if earned
        if (bonusPoints > 0) {
            await ctx.db.insert("pointTransactions", {
                userId: args.userId,
                points: bonusPoints,
                type: "streak_bonus",
                description: `Bônus de streak: ${newStreak} dias consecutivos`,
                createdAt: now,
            });
        }

        return {
            streak: newStreak,
            longestStreak,
            bonusPoints,
        };
    },
});

// Get weekly leaders (top 3)
export const getWeeklyLeaders = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        // Get all point transactions in the last week
        const allTransactions: any[] = [];
        const userPoints = await ctx.db
            .query("userPoints")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        for (const up of userPoints) {
            const transactions = await ctx.db
                .query("pointTransactions")
                .withIndex("by_user", (q) => q.eq("userId", up.userId))
                .collect();

            const weekTransactions = transactions.filter(t => t.createdAt > weekAgo);
            const weekPoints = weekTransactions.reduce((sum, t) => sum + t.points, 0);

            if (weekPoints > 0) {
                const user = await ctx.db.get(up.userId);
                allTransactions.push({
                    userId: up.userId,
                    weekPoints,
                    user: user ? {
                        _id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        imageUrl: user.imageUrl,
                    } : null,
                });
            }
        }

        return allTransactions
            .sort((a, b) => b.weekPoints - a.weekPoints)
            .slice(0, 3);
    },
});
