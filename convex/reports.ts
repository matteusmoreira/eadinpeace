import { v } from "convex/values";
import { query } from "./_generated/server";

// Relatório de progresso por curso
export const getCourseProgressReport = query({
    args: {
        courseId: v.id("courses"),
    },
    handler: async (ctx, args) => {
        const enrollments = await ctx.db
            .query("enrollments")
            .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
            .collect();

        const course = await ctx.db.get(args.courseId);
        if (!course) return null;

        const lessons = await ctx.db
            .query("lessons")
            .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
            .collect();

        const enrollmentDetails = await Promise.all(
            enrollments.map(async (enrollment) => {
                const user = await ctx.db.get(enrollment.userId);
                return {
                    id: enrollment._id,
                    studentName: user ? `${user.firstName} ${user.lastName}` : "Usuário Desconhecido",
                    studentEmail: user?.email || "",
                    progress: enrollment.progress,
                    completedLessons: enrollment.completedLessons.length,
                    totalLessons: lessons.length,
                    startedAt: enrollment.startedAt,
                    completedAt: enrollment.completedAt,
                    lastAccessedAt: enrollment.lastAccessedAt,
                };
            })
        );

        const avgProgress = enrollments.length > 0
            ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
            : 0;

        const completedCount = enrollments.filter(e => e.completedAt).length;
        const inProgressCount = enrollments.filter(e => !e.completedAt && e.progress > 0).length;
        const notStartedCount = enrollments.filter(e => e.progress === 0).length;

        return {
            course: {
                id: course._id,
                title: course.title,
                totalLessons: lessons.length,
            },
            summary: {
                totalEnrollments: enrollments.length,
                avgProgress: Math.round(avgProgress),
                completedCount,
                inProgressCount,
                notStartedCount,
                completionRate: enrollments.length > 0
                    ? Math.round((completedCount / enrollments.length) * 100)
                    : 0,
            },
            enrollments: enrollmentDetails.sort((a, b) => b.progress - a.progress),
        };
    },
});

// Relatório de atividade do usuário
export const getUserActivityReport = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return null;

        const enrollments = await ctx.db
            .query("enrollments")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const lessonProgress = await ctx.db
            .query("lessonProgress")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const certificates = await ctx.db
            .query("certificates")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const quizAttempts = await ctx.db
            .query("quizAttempts")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const streak = await ctx.db
            .query("studyStreaks")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        const achievements = await ctx.db
            .query("userAchievements")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        // Calcular tempo total estudado (em segundos)
        const totalTimeSpent = lessonProgress.reduce((sum, lp) => sum + lp.watchedSeconds, 0);

        // Aulas por dia (últimos 30 dias)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const recentActivity = lessonProgress
            .filter(lp => lp.lastWatchedAt > thirtyDaysAgo)
            .reduce((acc, lp) => {
                const date = new Date(lp.lastWatchedAt).toISOString().split('T')[0];
                acc[date] = (acc[date] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

        // Converter para array para gráfico
        const activityByDay = Object.entries(recentActivity)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            user: {
                id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                role: user.role,
            },
            summary: {
                totalCourses: enrollments.length,
                completedCourses: enrollments.filter(e => e.completedAt).length,
                totalLessonsWatched: lessonProgress.filter(lp => lp.isCompleted).length,
                totalTimeSpent,
                totalTimeFormatted: formatTime(totalTimeSpent),
                totalCertificates: certificates.length,
                totalQuizzes: quizAttempts.length,
                avgQuizScore: quizAttempts.length > 0
                    ? Math.round(quizAttempts.reduce((sum, q) => sum + q.score, 0) / quizAttempts.length)
                    : 0,
                currentStreak: streak?.currentStreak || 0,
                longestStreak: streak?.longestStreak || 0,
                totalAchievements: achievements.length,
            },
            activityByDay,
            enrollments: await Promise.all(
                enrollments.map(async (e) => {
                    const course = await ctx.db.get(e.courseId);
                    return {
                        courseId: e.courseId,
                        courseTitle: course?.title || "Curso Desconhecido",
                        progress: e.progress,
                        startedAt: e.startedAt,
                        completedAt: e.completedAt,
                    };
                })
            ),
        };
    },
});

// Relatório geral da organização
export const getOrganizationReport = query({
    args: {
        organizationId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        const organization = await ctx.db.get(args.organizationId);
        if (!organization) return null;

        const users = await ctx.db
            .query("users")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const courses = await ctx.db
            .query("courses")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const courseIds = courses.map(c => c._id);

        // Buscar todas as matrículas dos cursos da organização
        let allEnrollments: any[] = [];
        for (const courseId of courseIds) {
            const enrollments = await ctx.db
                .query("enrollments")
                .withIndex("by_course", (q) => q.eq("courseId", courseId))
                .collect();
            allEnrollments = [...allEnrollments, ...enrollments];
        }

        // Buscar todos os certificados
        let allCertificates: any[] = [];
        for (const courseId of courseIds) {
            const certificates = await ctx.db
                .query("certificates")
                .withIndex("by_course", (q) => q.eq("courseId", courseId))
                .collect();
            allCertificates = [...allCertificates, ...certificates];
        }

        // Contagem por role
        const usersByRole = {
            admin: users.filter(u => u.role === "admin").length,
            professor: users.filter(u => u.role === "professor").length,
            student: users.filter(u => u.role === "student").length,
        };

        // Cursos por status
        const coursesByStatus = {
            published: courses.filter(c => c.isPublished).length,
            draft: courses.filter(c => !c.isPublished).length,
        };

        // Cursos mais populares
        const courseEnrollmentCount: Record<string, number> = {};
        allEnrollments.forEach(e => {
            const id = e.courseId.toString();
            courseEnrollmentCount[id] = (courseEnrollmentCount[id] || 0) + 1;
        });

        const topCourses = await Promise.all(
            Object.entries(courseEnrollmentCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(async ([courseId, count]) => {
                    const course = courses.find(c => c._id.toString() === courseId);
                    return {
                        courseId,
                        title: course?.title || "Desconhecido",
                        enrollments: count,
                    };
                })
        );

        // Matrículas por mês (últimos 6 meses)
        const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;
        const enrollmentsByMonth = allEnrollments
            .filter(e => e.startedAt > sixMonthsAgo)
            .reduce((acc, e) => {
                const month = new Date(e.startedAt).toISOString().slice(0, 7);
                acc[month] = (acc[month] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

        const enrollmentTrend = Object.entries(enrollmentsByMonth)
            .map(([month, count]) => ({ month, count }))
            .sort((a, b) => a.month.localeCompare(b.month));

        return {
            organization: {
                id: organization._id,
                name: organization.name,
                plan: organization.plan,
            },
            summary: {
                totalUsers: users.length,
                totalCourses: courses.length,
                totalEnrollments: allEnrollments.length,
                totalCertificates: allCertificates.length,
                avgProgress: allEnrollments.length > 0
                    ? Math.round(allEnrollments.reduce((sum, e) => sum + e.progress, 0) / allEnrollments.length)
                    : 0,
                completionRate: allEnrollments.length > 0
                    ? Math.round((allEnrollments.filter(e => e.completedAt).length / allEnrollments.length) * 100)
                    : 0,
            },
            usersByRole,
            coursesByStatus,
            topCourses,
            enrollmentTrend,
        };
    },
});

// Relatório global para superadmin
export const getGlobalReport = query({
    args: {},
    handler: async (ctx) => {
        const organizations = await ctx.db.query("organizations").collect();
        const users = await ctx.db.query("users").collect();
        const courses = await ctx.db.query("courses").collect();
        const enrollments = await ctx.db.query("enrollments").collect();
        const certificates = await ctx.db.query("certificates").collect();

        // Organizações por plano
        const orgsByPlan = {
            starter: organizations.filter(o => o.plan === "starter").length,
            professional: organizations.filter(o => o.plan === "professional").length,
            enterprise: organizations.filter(o => o.plan === "enterprise").length,
        };

        // Top 5 organizações por usuários
        const usersByOrg: Record<string, number> = {};
        users.forEach(u => {
            if (u.organizationId) {
                const id = u.organizationId.toString();
                usersByOrg[id] = (usersByOrg[id] || 0) + 1;
            }
        });

        const topOrgsByUsers = await Promise.all(
            Object.entries(usersByOrg)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(async ([orgId, count]) => {
                    const org = organizations.find(o => o._id.toString() === orgId);
                    return {
                        name: org?.name || "Desconhecida",
                        users: count,
                    };
                })
        );

        // Crescimento de usuários (últimos 6 meses)
        const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;
        const usersByMonth = users
            .filter(u => u.createdAt > sixMonthsAgo)
            .reduce((acc, u) => {
                const month = new Date(u.createdAt).toISOString().slice(0, 7);
                acc[month] = (acc[month] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

        const userGrowth = Object.entries(usersByMonth)
            .map(([month, count]) => ({ month, count }))
            .sort((a, b) => a.month.localeCompare(b.month));

        return {
            summary: {
                totalOrganizations: organizations.length,
                activeOrganizations: organizations.filter(o => o.isActive).length,
                totalUsers: users.length,
                totalCourses: courses.length,
                publishedCourses: courses.filter(c => c.isPublished).length,
                totalEnrollments: enrollments.length,
                totalCertificates: certificates.length,
            },
            orgsByPlan,
            topOrgsByUsers,
            userGrowth,
        };
    },
});

// Helper para formatar tempo
function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
}
