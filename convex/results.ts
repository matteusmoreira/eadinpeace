import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ================================
// PROFESSOR RESULTS - Resultados Acadêmicos
// ================================

// Helper para pegar nome completo do usuário
const getFullName = (user: { firstName: string; lastName: string }) =>
    `${user.firstName} ${user.lastName}`;

// Resumo geral de resultados do professor
export const getSummary = query({
    args: {
        courseId: v.optional(v.id("courses")),
        classId: v.optional(v.id("classes")),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) {
                return {
                    totalAttempts: 0,
                    averageScore: 0,
                    approvalRate: 0,
                    pendingGrading: 0,
                    totalStudents: 0,
                    completedCourses: 0,
                };
            }

            const user = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();

            if (!user) {
                return {
                    totalAttempts: 0,
                    averageScore: 0,
                    approvalRate: 0,
                    pendingGrading: 0,
                    totalStudents: 0,
                    completedCourses: 0,
                };
            }

            // Get all quiz attempts
            let attempts = await ctx.db.query("quizAttempts").collect();

            // Filter by course if specified
            if (args.courseId) {
                const quizzes = await ctx.db
                    .query("quizzes")
                    .withIndex("by_course", (q) => q.eq("courseId", args.courseId!))
                    .collect();
                const quizIds = quizzes.map(q => q._id);
                attempts = attempts.filter(a => quizIds.includes(a.quizId));
            }

            // Filter by class if specified
            if (args.classId) {
                const classEnrollments = await ctx.db
                    .query("classEnrollments")
                    .withIndex("by_class", (q) => q.eq("classId", args.classId!))
                    .collect();
                const studentIds = classEnrollments.map(e => e.userId);
                attempts = attempts.filter(a => studentIds.includes(a.userId));
            }

            // Filter by date range if specified
            if (args.startDate) {
                attempts = attempts.filter(a => a.completedAt >= args.startDate!);
            }
            if (args.endDate) {
                attempts = attempts.filter(a => a.completedAt <= args.endDate!);
            }

            // Calculate stats
            const gradedAttempts = attempts.filter(a => a.gradingStatus === "graded");
            const totalScore = gradedAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
            const averageScore = gradedAttempts.length > 0 ? totalScore / gradedAttempts.length : 0;

            // Assuming 60% is passing grade
            const passedAttempts = gradedAttempts.filter(a => (a.score || 0) >= 60);
            const approvalRate = gradedAttempts.length > 0 ? (passedAttempts.length / gradedAttempts.length) * 100 : 0;

            const pendingGrading = attempts.filter(a =>
                a.gradingStatus === "pending" || a.gradingStatus === "grading"
            ).length;

            // Get unique students
            const uniqueStudents = new Set(attempts.map(a => a.userId));

            // Get completed courses count
            const enrollments = await ctx.db
                .query("enrollments")
                .filter((q) => q.eq(q.field("progress"), 100))
                .collect();

            return {
                totalAttempts: attempts.length,
                averageScore: Number(averageScore.toFixed(1)),
                approvalRate: Number(approvalRate.toFixed(1)),
                pendingGrading,
                totalStudents: uniqueStudents.size,
                completedCourses: enrollments.length,
            };
        } catch (error) {
            console.error("Error in results:getSummary", error);
            return {
                totalAttempts: 0,
                averageScore: 0,
                approvalRate: 0,
                pendingGrading: 0,
                totalStudents: 0,
                completedCourses: 0,
            };
        }
    },
});

// Resultados por curso
export const getByCourse = query({
    args: {
        instructorId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) return [];

            const user = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();

            if (!user) return [];

            const instructorId = args.instructorId || user._id;

            // Get instructor's courses
            const courses = await ctx.db
                .query("courses")
                .withIndex("by_instructor", (q) => q.eq("instructorId", instructorId))
                .collect();

            const results = await Promise.all(courses.map(async (course) => {
                // Get quizzes for this course
                const quizzes = await ctx.db
                    .query("quizzes")
                    .withIndex("by_course", (q) => q.eq("courseId", course._id))
                    .collect();

                const quizIds = quizzes.map(q => q._id);

                // Get attempts for these quizzes
                const allAttempts = await ctx.db.query("quizAttempts").collect();
                const courseAttempts = allAttempts.filter(a => quizIds.includes(a.quizId));
                const gradedAttempts = courseAttempts.filter(a => a.gradingStatus === "graded");

                // Calculate average score
                const totalScore = gradedAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
                const averageScore = gradedAttempts.length > 0 ? totalScore / gradedAttempts.length : 0;

                // Get enrollments
                const enrollments = await ctx.db
                    .query("enrollments")
                    .withIndex("by_course", (q) => q.eq("courseId", course._id))
                    .collect();

                // Calculate completion rate
                const completedEnrollments = enrollments.filter(e => e.progress === 100);
                const completionRate = enrollments.length > 0
                    ? (completedEnrollments.length / enrollments.length) * 100
                    : 0;

                return {
                    _id: course._id,
                    title: course.title,
                    thumbnail: course.thumbnail,
                    totalStudents: enrollments.length,
                    totalQuizzes: quizzes.length,
                    totalAttempts: courseAttempts.length,
                    averageScore: Number(averageScore.toFixed(1)),
                    completionRate: Number(completionRate.toFixed(1)),
                    pendingGrading: courseAttempts.filter(a => a.gradingStatus === "pending").length,
                };
            }));

            return results;
        } catch (error) {
            console.error("Error in results:getByCourse", error);
            return [];
        }
    },
});

// Resultados por turma
export const getByClass = query({
    args: {
        classId: v.id("classes"),
    },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) return { classInfo: null, students: [] };

            // Get class info
            const classInfo = await ctx.db.get(args.classId);
            if (!classInfo) return { classInfo: null, students: [] };

            // Get class enrollments
            const enrollments = await ctx.db
                .query("classEnrollments")
                .withIndex("by_class", (q) => q.eq("classId", args.classId))
                .filter((q) => q.eq(q.field("status"), "active"))
                .collect();

            // Get course for this class
            const course = await ctx.db.get(classInfo.courseId);

            // Get quizzes for the course
            const quizzes = course ? await ctx.db
                .query("quizzes")
                .withIndex("by_course", (q) => q.eq("courseId", course._id))
                .collect() : [];
            const quizIds = quizzes.map(q => q._id);

            // Get student details and their results
            const students = await Promise.all(enrollments.map(async (enrollment) => {
                const student = await ctx.db.get(enrollment.userId);
                if (!student) return null;

                // Get course enrollment for progress
                const courseEnrollment = course ? await ctx.db
                    .query("enrollments")
                    .withIndex("by_user_course", (q) =>
                        q.eq("userId", enrollment.userId).eq("courseId", course._id)
                    )
                    .first() : null;

                // Get quiz attempts
                const allAttempts = await ctx.db.query("quizAttempts").collect();
                const studentAttempts = allAttempts.filter(a =>
                    a.userId === enrollment.userId && quizIds.includes(a.quizId)
                );
                const gradedAttempts = studentAttempts.filter(a => a.gradingStatus === "graded");

                // Calculate average score
                const totalScore = gradedAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
                const averageScore = gradedAttempts.length > 0 ? totalScore / gradedAttempts.length : 0;

                return {
                    _id: student._id,
                    name: getFullName(student),
                    email: student.email,
                    imageUrl: student.imageUrl,
                    progress: courseEnrollment?.progress || 0,
                    quizzesTaken: studentAttempts.length,
                    quizzesGraded: gradedAttempts.length,
                    averageScore: Number(averageScore.toFixed(1)),
                    status: averageScore >= 60 ? "approved" : averageScore > 0 ? "attention" : "pending",
                    enrolledAt: enrollment.enrolledAt,
                };
            }));

            // Filter out nulls
            const validStudents = students.filter(s => s !== null);

            return {
                classInfo: {
                    _id: classInfo._id,
                    name: classInfo.name,
                    courseName: course?.title || "Curso não encontrado",
                    totalStudents: validStudents.length,
                },
                students: validStudents,
            };
        } catch (error) {
            console.error("Error in results:getByClass", error);
            return { classInfo: null, students: [] };
        }
    },
});

// Resultados detalhados de quizzes
export const getQuizResults = query({
    args: {
        courseId: v.optional(v.id("courses")),
        classId: v.optional(v.id("classes")),
    },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) return [];

            let quizzes: any[] = [];

            if (args.courseId) {
                quizzes = await ctx.db
                    .query("quizzes")
                    .withIndex("by_course", (q) => q.eq("courseId", args.courseId!))
                    .collect();
            } else {
                quizzes = await ctx.db.query("quizzes").collect();
            }

            // Get class students if filtering by class
            let classStudentIds: Id<"users">[] = [];
            if (args.classId) {
                const classEnrollments = await ctx.db
                    .query("classEnrollments")
                    .withIndex("by_class", (q) => q.eq("classId", args.classId!))
                    .collect();
                classStudentIds = classEnrollments.map(e => e.userId);
            }

            const results = await Promise.all(quizzes.map(async (quiz) => {
                // Get all attempts for this quiz
                let attempts = await ctx.db
                    .query("quizAttempts")
                    .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
                    .collect();

                // Filter by class students if specified
                if (args.classId && classStudentIds.length > 0) {
                    attempts = attempts.filter(a => classStudentIds.includes(a.userId));
                }

                const gradedAttempts = attempts.filter(a => a.gradingStatus === "graded");
                const totalScore = gradedAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
                const averageScore = gradedAttempts.length > 0 ? totalScore / gradedAttempts.length : 0;

                // Get course info
                const course = quiz.courseId ? await ctx.db.get(quiz.courseId) : null;

                // Get max score from questions
                const questions = await ctx.db
                    .query("quizQuestions")
                    .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
                    .collect();
                const maxScore = questions.reduce((acc, q) => acc + q.points, 0);

                // Score distribution
                const distribution = {
                    excellent: gradedAttempts.filter(a => (a.score || 0) >= 90).length,
                    good: gradedAttempts.filter(a => (a.score || 0) >= 70 && (a.score || 0) < 90).length,
                    average: gradedAttempts.filter(a => (a.score || 0) >= 60 && (a.score || 0) < 70).length,
                    below: gradedAttempts.filter(a => (a.score || 0) < 60).length,
                };

                return {
                    _id: quiz._id,
                    title: quiz.title,
                    type: quiz.type || "quiz",
                    courseName: course?.title || "N/A",
                    totalAttempts: attempts.length,
                    gradedAttempts: gradedAttempts.length,
                    pendingGrading: attempts.filter(a => a.gradingStatus === "pending").length,
                    averageScore: Number(averageScore.toFixed(1)),
                    maxScore: maxScore || 100,
                    distribution,
                };
            }));

            return results;
        } catch (error) {
            console.error("Error in results:getQuizResults", error);
            return [];
        }
    },
});

// Resultados por aluno
export const getByStudent = query({
    args: {
        studentId: v.id("users"),
        courseId: v.optional(v.id("courses")),
    },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) return null;

            const student = await ctx.db.get(args.studentId);
            if (!student) return null;

            // Get student's enrollments
            let enrollments = await ctx.db
                .query("enrollments")
                .withIndex("by_user", (q) => q.eq("userId", args.studentId))
                .collect();

            if (args.courseId) {
                enrollments = enrollments.filter(e => e.courseId === args.courseId);
            }

            // Get all quiz attempts for this student
            const allAttempts = await ctx.db.query("quizAttempts").collect();
            let studentAttempts = allAttempts.filter(a => a.userId === args.studentId);

            if (args.courseId) {
                const courseQuizzes = await ctx.db
                    .query("quizzes")
                    .withIndex("by_course", (q) => q.eq("courseId", args.courseId!))
                    .collect();
                const quizIds = courseQuizzes.map(q => q._id);
                studentAttempts = studentAttempts.filter(a => quizIds.includes(a.quizId));
            }

            // Get detailed attempts with quiz info
            const detailedAttempts = await Promise.all(studentAttempts.map(async (attempt) => {
                const quiz = await ctx.db.get(attempt.quizId);
                const course = quiz?.courseId ? await ctx.db.get(quiz.courseId) : null;

                // Get max score from questions
                const questions = quiz ? await ctx.db
                    .query("quizQuestions")
                    .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
                    .collect() : [];
                const maxScore = questions.reduce((acc, q) => acc + q.points, 0) || 100;

                return {
                    _id: attempt._id,
                    quizTitle: quiz?.title || "Quiz não encontrado",
                    courseName: course?.title || "N/A",
                    score: attempt.score,
                    maxScore,
                    percentage: attempt.score ? Number(((attempt.score / maxScore) * 100).toFixed(1)) : 0,
                    gradingStatus: attempt.gradingStatus,
                    completedAt: attempt.completedAt,
                };
            }));

            // Calculate overall stats
            const gradedAttempts = detailedAttempts.filter(a => a.gradingStatus === "graded");
            const totalPercentage = gradedAttempts.reduce((acc, a) => acc + a.percentage, 0);
            const averageScore = gradedAttempts.length > 0 ? totalPercentage / gradedAttempts.length : 0;

            // Course progress
            const courseProgress = await Promise.all(enrollments.map(async (enrollment) => {
                const course = await ctx.db.get(enrollment.courseId);
                return {
                    courseId: enrollment.courseId,
                    courseName: course?.title || "Curso não encontrado",
                    progress: enrollment.progress,
                    enrolledAt: enrollment.startedAt,
                };
            }));

            return {
                student: {
                    _id: student._id,
                    name: getFullName(student),
                    email: student.email,
                    imageUrl: student.imageUrl,
                },
                stats: {
                    totalQuizzes: studentAttempts.length,
                    gradedQuizzes: gradedAttempts.length,
                    averageScore: Number(averageScore.toFixed(1)),
                    coursesEnrolled: enrollments.length,
                    coursesCompleted: enrollments.filter(e => e.progress === 100).length,
                },
                attempts: detailedAttempts.sort((a, b) => b.completedAt - a.completedAt),
                courseProgress,
            };
        } catch (error) {
            console.error("Error in results:getByStudent", error);
            return null;
        }
    },
});

// Distribuição de notas para gráficos
export const getScoreDistribution = query({
    args: {
        courseId: v.optional(v.id("courses")),
        classId: v.optional(v.id("classes")),
    },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) {
                return {
                    distribution: [],
                    timeline: [],
                };
            }

            let attempts = await ctx.db.query("quizAttempts").collect();
            attempts = attempts.filter(a => a.gradingStatus === "graded");

            // Filter by course
            if (args.courseId) {
                const quizzes = await ctx.db
                    .query("quizzes")
                    .withIndex("by_course", (q) => q.eq("courseId", args.courseId!))
                    .collect();
                const quizIds = quizzes.map(q => q._id);
                attempts = attempts.filter(a => quizIds.includes(a.quizId));
            }

            // Filter by class
            if (args.classId) {
                const classEnrollments = await ctx.db
                    .query("classEnrollments")
                    .withIndex("by_class", (q) => q.eq("classId", args.classId!))
                    .collect();
                const studentIds = classEnrollments.map(e => e.userId);
                attempts = attempts.filter(a => studentIds.includes(a.userId));
            }

            // Create distribution buckets (0-10, 10-20, ..., 90-100)
            const distribution = [
                { range: "0-10", count: 0 },
                { range: "10-20", count: 0 },
                { range: "20-30", count: 0 },
                { range: "30-40", count: 0 },
                { range: "40-50", count: 0 },
                { range: "50-60", count: 0 },
                { range: "60-70", count: 0 },
                { range: "70-80", count: 0 },
                { range: "80-90", count: 0 },
                { range: "90-100", count: 0 },
            ];

            attempts.forEach(attempt => {
                const score = attempt.score || 0;
                const bucketIndex = Math.min(Math.floor(score / 10), 9);
                distribution[bucketIndex].count++;
            });

            // Create timeline data (last 30 days)
            const now = Date.now();
            const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
            const recentAttempts = attempts.filter(a => a.completedAt && a.completedAt >= thirtyDaysAgo);

            // Group by day
            const timelineMap = new Map<string, { total: number; count: number }>();
            recentAttempts.forEach(attempt => {
                if (attempt.completedAt) {
                    const date = new Date(attempt.completedAt).toISOString().split('T')[0];
                    const existing = timelineMap.get(date) || { total: 0, count: 0 };
                    timelineMap.set(date, {
                        total: existing.total + (attempt.score || 0),
                        count: existing.count + 1,
                    });
                }
            });

            const timeline = Array.from(timelineMap.entries()).map(([date, data]) => ({
                date,
                averageScore: Number((data.total / data.count).toFixed(1)),
                attempts: data.count,
            })).sort((a, b) => a.date.localeCompare(b.date));

            return {
                distribution,
                timeline,
            };
        } catch (error) {
            console.error("Error in results:getScoreDistribution", error);
            return {
                distribution: [],
                timeline: [],
            };
        }
    },
});

// Alunos com baixo desempenho (para alertas)
export const getLowPerformers = query({
    args: {
        courseId: v.optional(v.id("courses")),
        threshold: v.optional(v.number()), // Default 60
    },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) return [];

            const threshold = args.threshold || 60;

            let attempts = await ctx.db.query("quizAttempts").collect();
            attempts = attempts.filter(a => a.gradingStatus === "graded");

            // Filter by course
            if (args.courseId) {
                const quizzes = await ctx.db
                    .query("quizzes")
                    .withIndex("by_course", (q) => q.eq("courseId", args.courseId!))
                    .collect();
                const quizIds = quizzes.map(q => q._id);
                attempts = attempts.filter(a => quizIds.includes(a.quizId));
            }

            // Group by student
            const studentScores = new Map<string, { total: number; count: number }>();
            attempts.forEach(attempt => {
                const existing = studentScores.get(attempt.userId) || { total: 0, count: 0 };
                studentScores.set(attempt.userId, {
                    total: existing.total + (attempt.score || 0),
                    count: existing.count + 1,
                });
            });

            // Find low performers
            const lowPerformers = [];
            for (const [userId, data] of studentScores) {
                const average = data.total / data.count;
                if (average < threshold) {
                    const student = await ctx.db.get(userId as Id<"users">);
                    if (student) {
                        lowPerformers.push({
                            _id: student._id,
                            name: getFullName(student),
                            email: student.email,
                            imageUrl: student.imageUrl,
                            averageScore: Number(average.toFixed(1)),
                            quizzesTaken: data.count,
                            status: average < 40 ? "critical" : "attention",
                        });
                    }
                }
            }

            return lowPerformers.sort((a, b) => a.averageScore - b.averageScore);
        } catch (error) {
            console.error("Error in results:getLowPerformers", error);
            return [];
        }
    },
});

// Comparativo histórico
export const getHistoricalComparison = query({
    args: {
        courseId: v.optional(v.id("courses")),
        classId: v.optional(v.id("classes")),
    },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) {
                return {
                    currentPeriod: { average: 0, total: 0 },
                    previousPeriod: { average: 0, total: 0 },
                    change: 0,
                };
            }

            const now = Date.now();
            const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
            const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);

            let attempts = await ctx.db.query("quizAttempts").collect();
            attempts = attempts.filter(a => a.gradingStatus === "graded");

            // Filter by course
            if (args.courseId) {
                const quizzes = await ctx.db
                    .query("quizzes")
                    .withIndex("by_course", (q) => q.eq("courseId", args.courseId!))
                    .collect();
                const quizIds = quizzes.map(q => q._id);
                attempts = attempts.filter(a => quizIds.includes(a.quizId));
            }

            // Filter by class
            if (args.classId) {
                const classEnrollments = await ctx.db
                    .query("classEnrollments")
                    .withIndex("by_class", (q) => q.eq("classId", args.classId!))
                    .collect();
                const studentIds = classEnrollments.map(e => e.userId);
                attempts = attempts.filter(a => studentIds.includes(a.userId));
            }

            // Current period (last 30 days)
            const currentAttempts = attempts.filter(a =>
                a.completedAt && a.completedAt >= thirtyDaysAgo
            );
            const currentTotal = currentAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
            const currentAverage = currentAttempts.length > 0 ? currentTotal / currentAttempts.length : 0;

            // Previous period (30-60 days ago)
            const previousAttempts = attempts.filter(a =>
                a.completedAt && a.completedAt >= sixtyDaysAgo && a.completedAt < thirtyDaysAgo
            );
            const previousTotal = previousAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
            const previousAverage = previousAttempts.length > 0 ? previousTotal / previousAttempts.length : 0;

            // Calculate change
            const change = previousAverage > 0
                ? ((currentAverage - previousAverage) / previousAverage) * 100
                : 0;

            return {
                currentPeriod: {
                    average: Number(currentAverage.toFixed(1)),
                    total: currentAttempts.length,
                },
                previousPeriod: {
                    average: Number(previousAverage.toFixed(1)),
                    total: previousAttempts.length,
                },
                change: Number(change.toFixed(1)),
            };
        } catch (error) {
            console.error("Error in results:getHistoricalComparison", error);
            return {
                currentPeriod: { average: 0, total: 0 },
                previousPeriod: { average: 0, total: 0 },
                change: 0,
            };
        }
    },
});
