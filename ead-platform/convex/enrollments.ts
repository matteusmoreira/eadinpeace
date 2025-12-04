import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all enrollments (for admin/professor views)
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        const enrollments = await ctx.db.query("enrollments").collect();

        // Enrich with user and course data
        const enriched = await Promise.all(
            enrollments.map(async (enrollment) => {
                const [user, course] = await Promise.all([
                    ctx.db.get(enrollment.userId),
                    ctx.db.get(enrollment.courseId),
                ]);
                return {
                    ...enrollment,
                    user,
                    course,
                };
            })
        );

        return enriched;
    },
});


// Get user enrollments
export const getByUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const enrollments = await ctx.db
            .query("enrollments")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        // Get course details for each enrollment
        const enrollmentsWithCourses = await Promise.all(
            enrollments.map(async (enrollment) => {
                const course = await ctx.db.get(enrollment.courseId);
                return {
                    ...enrollment,
                    course,
                };
            })
        );

        return enrollmentsWithCourses;
    },
});

// Get enrollment for user and course
export const getByUserAndCourse = query({
    args: {
        userId: v.id("users"),
        courseId: v.id("courses"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("enrollments")
            .withIndex("by_user_course", (q) =>
                q.eq("userId", args.userId).eq("courseId", args.courseId)
            )
            .first();
    },
});

// Enroll user in course
export const enroll = mutation({
    args: {
        userId: v.id("users"),
        courseId: v.id("courses"),
    },
    handler: async (ctx, args) => {
        // Check if already enrolled
        const existing = await ctx.db
            .query("enrollments")
            .withIndex("by_user_course", (q) =>
                q.eq("userId", args.userId).eq("courseId", args.courseId)
            )
            .first();

        if (existing) {
            return existing._id;
        }

        const now = Date.now();
        return await ctx.db.insert("enrollments", {
            userId: args.userId,
            courseId: args.courseId,
            progress: 0,
            completedLessons: [],
            startedAt: now,
            lastAccessedAt: now,
        });
    },
});

// Update lesson progress
export const updateLessonProgress = mutation({
    args: {
        userId: v.id("users"),
        lessonId: v.id("lessons"),
        courseId: v.id("courses"),
        watchedSeconds: v.number(),
        isCompleted: v.boolean(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Update or create lesson progress
        const existingProgress = await ctx.db
            .query("lessonProgress")
            .withIndex("by_user_lesson", (q) =>
                q.eq("userId", args.userId).eq("lessonId", args.lessonId)
            )
            .first();

        if (existingProgress) {
            await ctx.db.patch(existingProgress._id, {
                watchedSeconds: args.watchedSeconds,
                isCompleted: args.isCompleted,
                completedAt: args.isCompleted ? now : existingProgress.completedAt,
                lastWatchedAt: now,
            });
        } else {
            await ctx.db.insert("lessonProgress", {
                userId: args.userId,
                lessonId: args.lessonId,
                courseId: args.courseId,
                watchedSeconds: args.watchedSeconds,
                isCompleted: args.isCompleted,
                completedAt: args.isCompleted ? now : undefined,
                lastWatchedAt: now,
            });
        }

        // Update enrollment progress
        const enrollment = await ctx.db
            .query("enrollments")
            .withIndex("by_user_course", (q) =>
                q.eq("userId", args.userId).eq("courseId", args.courseId)
            )
            .first();

        if (enrollment && args.isCompleted) {
            const completedLessons = [...enrollment.completedLessons];
            if (!completedLessons.includes(args.lessonId)) {
                completedLessons.push(args.lessonId);
            }

            // Calculate progress
            const allLessons = await ctx.db
                .query("lessons")
                .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
                .collect();

            const progress = Math.round((completedLessons.length / allLessons.length) * 100);
            const isComplete = progress === 100;

            await ctx.db.patch(enrollment._id, {
                completedLessons,
                progress,
                completedAt: isComplete ? now : undefined,
                lastAccessedAt: now,
            });

            // If course completed, create certificate
            if (isComplete && !enrollment.completedAt) {
                const code = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                await ctx.db.insert("certificates", {
                    userId: args.userId,
                    courseId: args.courseId,
                    code,
                    issuedAt: now,
                });
            }
        }
    },
});

// Get course progress for user
export const getCourseProgress = query({
    args: {
        userId: v.id("users"),
        courseId: v.id("courses"),
    },
    handler: async (ctx, args) => {
        const enrollment = await ctx.db
            .query("enrollments")
            .withIndex("by_user_course", (q) =>
                q.eq("userId", args.userId).eq("courseId", args.courseId)
            )
            .first();

        if (!enrollment) return null;

        const lessonsProgress = await ctx.db
            .query("lessonProgress")
            .filter((q) =>
                q.and(
                    q.eq(q.field("userId"), args.userId),
                    q.eq(q.field("courseId"), args.courseId)
                )
            )
            .collect();

        return {
            ...enrollment,
            lessonsProgress,
        };
    },
});

// Update study streak
export const updateStreak = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const today = new Date().toISOString().split("T")[0];
        const now = Date.now();

        const streak = await ctx.db
            .query("studyStreaks")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        if (streak) {
            const lastDate = new Date(streak.lastStudyDate);
            const todayDate = new Date(today);
            const diffDays = Math.floor(
                (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            let newStreak = streak.currentStreak;
            if (diffDays === 0) {
                // Same day, no change
                return;
            } else if (diffDays === 1) {
                // Consecutive day
                newStreak += 1;
            } else {
                // Streak broken
                newStreak = 1;
            }

            await ctx.db.patch(streak._id, {
                currentStreak: newStreak,
                longestStreak: Math.max(streak.longestStreak, newStreak),
                lastStudyDate: today,
                updatedAt: now,
            });
        } else {
            await ctx.db.insert("studyStreaks", {
                userId: args.userId,
                currentStreak: 1,
                longestStreak: 1,
                lastStudyDate: today,
                updatedAt: now,
            });
        }
    },
});
