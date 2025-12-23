import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAuth, requireOwnerOrAdmin } from "./authHelpers";

// Point values for different actions
const POINT_VALUES = {
    lesson_complete: 10,
    course_complete: 100,
    certificate_earned: 50,
};

// Get all enrollments (for admin/professor views)
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        // Verificar autenticação e obter usuário
        const auth = await requireAuth(ctx);

        // Se não for superadmin, filtrar por organização
        let enrollments;
        if (auth.user.role === "superadmin") {
            enrollments = await ctx.db.query("enrollments").collect();
        } else {
            // Buscar cursos da organização do usuário
            const courses = await ctx.db
                .query("courses")
                .withIndex("by_organization", (q) => q.eq("organizationId", auth.user.organizationId!))
                .collect();
            const courseIds = new Set(courses.map(c => c._id));

            // Filtrar matrículas por cursos da organização
            const allEnrollments = await ctx.db.query("enrollments").collect();
            enrollments = allEnrollments.filter(e => courseIds.has(e.courseId));
        }

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
    args: { userId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        try {
            if (!args.userId) {
                return [];
            }

            const userId = args.userId;
            await requireOwnerOrAdmin(ctx, userId);

            const enrollments = await ctx.db
                .query("enrollments")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .collect();

            // Get course details for each enrollment (with instructor and lesson count)
            const enrollmentsWithCourses = await Promise.all(
                enrollments.map(async (enrollment) => {
                    const course = await ctx.db.get(enrollment.courseId);
                    if (!course) {
                        return {
                            ...enrollment,
                            course: null,
                        };
                    }

                    // Get instructor
                    const instructor = course.instructorId
                        ? await ctx.db.get(course.instructorId)
                        : null;

                    // Get lesson count
                    const lessons = await ctx.db
                        .query("lessons")
                        .withIndex("by_course", (q) => q.eq("courseId", enrollment.courseId))
                        .collect();

                    return {
                        ...enrollment,
                        course: {
                            ...course,
                            instructor: instructor ? {
                                firstName: instructor.firstName,
                                lastName: instructor.lastName,
                            } : null,
                            lessonCount: lessons.length,
                        },
                    };
                })
            );

            return enrollmentsWithCourses;
        } catch (error) {
            return [];
        }
    },
});


// Get enrollment for user and course
export const getByUserAndCourse = query({
    args: {
        userId: v.id("users"),
        courseId: v.id("courses"),
    },
    handler: async (ctx, args) => {
        // Verificar se pode acessar as matrículas deste usuário
        await requireOwnerOrAdmin(ctx, args.userId);

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
        // Verificar autenticação e permissão para matricular
        const auth = await requireOwnerOrAdmin(ctx, args.userId);

        // Verificar se o curso existe e pertence à organização do usuário
        const course = await ctx.db.get(args.courseId);
        if (!course) {
            throw new Error("Curso não encontrado");
        }

        // Verificar se o usuário pertence à mesma organização do curso (exceto superadmin)
        if (auth.user.role !== "superadmin" && auth.user.organizationId !== course.organizationId) {
            throw new Error("Você não pode se matricular em cursos de outra organização");
        }

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
        const auth = await requireOwnerOrAdmin(ctx, args.userId);

        const now = Date.now();

        const user = await ctx.db.get(args.userId);
        if (!user || !user.organizationId) {
            throw new Error("User or organization not found");
        }
        if (auth.user.role !== "superadmin" && user.organizationId !== auth.user.organizationId) {
            throw new Error("Acesso negado");
        }

        const course = await ctx.db.get(args.courseId);
        if (!course) throw new Error("Curso não encontrado");
        if (auth.user.role !== "superadmin" && course.organizationId !== user.organizationId) {
            throw new Error("Acesso negado");
        }

        const lesson = await ctx.db.get(args.lessonId);
        if (!lesson) throw new Error("Aula não encontrada");
        if (lesson.courseId !== args.courseId) throw new Error("Acesso negado");

        // Update or create lesson progress
        const existingProgress = await ctx.db
            .query("lessonProgress")
            .withIndex("by_user_lesson", (q) =>
                q.eq("userId", args.userId).eq("lessonId", args.lessonId)
            )
            .first();

        const wasAlreadyCompleted = existingProgress?.isCompleted ?? false;
        const isNewlyCompleted = args.isCompleted && !wasAlreadyCompleted;

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

        // Award points for completing a lesson (only if newly completed)
        if (isNewlyCompleted) {
            await addPointsToUser(ctx, {
                userId: args.userId,
                organizationId: user.organizationId,
                points: POINT_VALUES.lesson_complete,
                type: "lesson_complete",
                description: "Aula concluída",
                metadata: { lessonId: args.lessonId, courseId: args.courseId },
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

            const progress =
                allLessons.length > 0
                    ? Math.round((completedLessons.length / allLessons.length) * 100)
                    : 0;
            const isComplete = progress === 100;
            const wasAlreadyComplete = enrollment.completedAt !== undefined;

            await ctx.db.patch(enrollment._id, {
                completedLessons,
                progress,
                completedAt: isComplete ? now : undefined,
                lastAccessedAt: now,
            });

            // If course completed (newly), create certificate and award points
            if (isComplete && !wasAlreadyComplete) {
                // Award points for completing the course
                await addPointsToUser(ctx, {
                    userId: args.userId,
                    organizationId: user.organizationId,
                    points: POINT_VALUES.course_complete,
                    type: "course_complete",
                    description: "Curso concluído",
                    metadata: { courseId: args.courseId },
                });

                // Create certificate
                const code = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                await ctx.db.insert("certificates", {
                    userId: args.userId,
                    courseId: args.courseId,
                    code,
                    issuedAt: now,
                });

                // Award points for earning the certificate
                await addPointsToUser(ctx, {
                    userId: args.userId,
                    organizationId: user.organizationId,
                    points: POINT_VALUES.certificate_earned,
                    type: "certificate_earned",
                    description: "Certificado obtido",
                    metadata: { courseId: args.courseId, certificateCode: code },
                });
            }
        }
    },
});

// Helper function to add points to a user
async function addPointsToUser(
    ctx: any,
    args: {
        userId: any;
        organizationId: any;
        points: number;
        type: "lesson_complete" | "course_complete" | "quiz_pass" | "certificate_earned" | "streak_bonus" | "forum_participation" | "helpful_answer" | "admin_adjustment";
        description: string;
        metadata?: any;
    }
) {
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
        .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
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
}


// Get course progress for user
export const getCourseProgress = query({
    args: {
        userId: v.id("users"),
        courseId: v.id("courses"),
    },
    handler: async (ctx, args) => {
        // Verificar autenticação - retorna null se não autenticado
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        try {
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
        } catch (error) {
            console.error("[enrollments:getCourseProgress] Erro:", error);
            return null;
        }
    },
});

// Update study streak
export const updateStreak = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

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

// Get study streak
export const getStreak = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        // Verificar autenticação - retorna null se não autenticado
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        try {
            return await ctx.db
                .query("studyStreaks")
                .withIndex("by_user", (q) => q.eq("userId", args.userId))
                .first();
        } catch (error) {
            console.error("[enrollments:getStreak] Erro:", error);
            return null;
        }
    },
});
