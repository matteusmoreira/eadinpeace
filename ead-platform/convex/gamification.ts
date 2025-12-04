import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all achievements
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("achievements").collect();
    },
});

// Get user achievements
export const getUserAchievements = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const userAchievements = await ctx.db
            .query("userAchievements")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        // Enrich with achievement data
        const enriched = await Promise.all(
            userAchievements.map(async (ua) => {
                const achievement = await ctx.db.get(ua.achievementId);
                return {
                    ...ua,
                    achievement,
                };
            })
        );

        return enriched;
    },
});

// Check and award achievements
export const checkAndAward = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const now = Date.now();
        const awardedAchievements = [];

        // Get all achievements
        const achievements = await ctx.db.query("achievements").collect();

        // Get user's current achievements
        const userAchievements = await ctx.db
            .query("userAchievements")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const alreadyAwarded = new Set(userAchievements.map(ua => ua.achievementId));

        // Get user stats
        const enrollments = await ctx.db
            .query("enrollments")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const completedCourses = enrollments.filter(e => e.completedAt).length;

        const streak = await ctx.db
            .query("studyStreaks")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        const currentStreak = streak?.currentStreak || 0;

        // Check each achievement
        for (const achievement of achievements) {
            if (alreadyAwarded.has(achievement._id)) continue;

            let qualified = false;

            switch (achievement.type) {
                case "course_complete":
                    qualified = completedCourses >= achievement.requirement;
                    break;
                case "streak":
                    qualified = currentStreak >= achievement.requirement;
                    break;
                case "first_lesson":
                    const lessonProgress = await ctx.db
                        .query("lessonProgress")
                        .withIndex("by_user", (q) => q.eq("userId", args.userId))
                        .first();
                    qualified = !!lessonProgress;
                    break;
            }

            if (qualified) {
                await ctx.db.insert("userAchievements", {
                    userId: args.userId,
                    achievementId: achievement._id,
                    unlockedAt: now,
                });

                // Create notification
                await ctx.db.insert("notifications", {
                    userId: args.userId,
                    title: "Nova Conquista! 🏆",
                    message: `Você desbloqueou: ${achievement.name}`,
                    type: "achievement",
                    isRead: false,
                    createdAt: now,
                });

                awardedAchievements.push(achievement);
            }
        }

        return awardedAchievements;
    },
});

// Initialize default achievements
export const initializeDefaults = mutation({
    args: {},
    handler: async (ctx) => {
        const existing = await ctx.db.query("achievements").first();
        if (existing) return; // Already initialized

        const now = Date.now();
        const defaults = [
            {
                name: "Primeira Aula",
                description: "Assista sua primeira aula",
                icon: "play",
                type: "first_lesson" as const,
                requirement: 1,
                points: 10,
            },
            {
                name: "Primeiro Curso",
                description: "Complete seu primeiro curso",
                icon: "trophy",
                type: "course_complete" as const,
                requirement: 1,
                points: 100,
            },
            {
                name: "Estudante Dedicado",
                description: "Complete 5 cursos",
                icon: "star",
                type: "course_complete" as const,
                requirement: 5,
                points: 500,
            },
            {
                name: "Mestre do Conhecimento",
                description: "Complete 10 cursos",
                icon: "crown",
                type: "course_complete" as const,
                requirement: 10,
                points: 1000,
            },
            {
                name: "Streak de 7 Dias",
                description: "Estude por 7 dias consecutivos",
                icon: "flame",
                type: "streak" as const,
                requirement: 7,
                points: 70,
            },
            {
                name: "Streak de 30 Dias",
                description: "Estude por 30 dias consecutivos",
                icon: "fire",
                type: "streak" as const,
                requirement: 30,
                points: 300,
            },
        ];

        for (const achievement of defaults) {
            await ctx.db.insert("achievements", {
                ...achievement,
                createdAt: now,
            });
        }
    },
});

// Get leaderboard
export const getLeaderboard = query({
    args: { organizationId: v.optional(v.id("organizations")), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        // Get all users (optionally filter by org)
        let users = await ctx.db.query("users").collect();

        if (args.organizationId) {
            users = users.filter(u => u.organizationId === args.organizationId);
        }

        // Calculate points for each user
        const leaderboard = await Promise.all(
            users.map(async (user) => {
                // Get completed courses
                const enrollments = await ctx.db
                    .query("enrollments")
                    .withIndex("by_user", (q) => q.eq("userId", user._id))
                    .collect();

                const completedCourses = enrollments.filter(e => e.completedAt).length;

                // Get achievements
                const userAchievements = await ctx.db
                    .query("userAchievements")
                    .withIndex("by_user", (q) => q.eq("userId", user._id))
                    .collect();

                // Get streak
                const streak = await ctx.db
                    .query("studyStreaks")
                    .withIndex("by_user", (q) => q.eq("userId", user._id))
                    .first();

                // Calculate total points
                let totalPoints = 0;
                for (const ua of userAchievements) {
                    const achievement = await ctx.db.get(ua.achievementId);
                    if (achievement) {
                        totalPoints += achievement.points;
                    }
                }

                // Add bonus points for courses (50 per course)
                totalPoints += completedCourses * 50;

                return {
                    user: {
                        _id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        imageUrl: user.imageUrl,
                    },
                    completedCourses,
                    currentStreak: streak?.currentStreak || 0,
                    achievementCount: userAchievements.length,
                    totalPoints,
                };
            })
        );

        // Sort by points and limit
        const sorted = leaderboard
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, args.limit || 10);

        return sorted;
    },
});

// Get user rank
export const getUserRank = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return null;

        // Get all users from same org
        const users = await ctx.db
            .query("users")
            .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
            .collect();

        // Calculate points for all
        const scores = await Promise.all(
            users.map(async (u) => {
                const userAchievements = await ctx.db
                    .query("userAchievements")
                    .withIndex("by_user", (q) => q.eq("userId", u._id))
                    .collect();

                let totalPoints = 0;
                for (const ua of userAchievements) {
                    const achievement = await ctx.db.get(ua.achievementId);
                    if (achievement) {
                        totalPoints += achievement.points;
                    }
                }

                const enrollments = await ctx.db
                    .query("enrollments")
                    .withIndex("by_user", (q) => q.eq("userId", u._id))
                    .collect();
                const completedCourses = enrollments.filter(e => e.completedAt).length;
                totalPoints += completedCourses * 50;

                return { userId: u._id, points: totalPoints };
            })
        );

        // Sort and find rank
        scores.sort((a, b) => b.points - a.points);
        const rank = scores.findIndex(s => s.userId === args.userId) + 1;
        const userScore = scores.find(s => s.userId === args.userId);

        return {
            rank,
            totalUsers: users.length,
            points: userScore?.points || 0,
        };
    },
});
