import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Calcular nota final do curso
export const calculate = mutation({
    args: {
        userId: v.id("users"),
        courseId: v.id("courses"),
    },
    handler: async (ctx, args) => {
        // Buscar todas as tentativas de quizzes do usuário no curso
        const quizzes = await ctx.db
            .query("quizzes")
            .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
            .filter((q) => q.eq(q.field("isPublished"), true))
            .collect();

        const quizScores = [];
        let totalQuizWeight = 0;
        let totalAssignmentWeight = 0;

        for (const quiz of quizzes) {
            const attempts = await ctx.db
                .query("quizAttempts")
                .withIndex("by_quiz_user", (q) =>
                    q.eq("quizId", quiz._id).eq("userId", args.userId)
                )
                .collect();

            if (attempts.length > 0) {
                // Pegar a melhor tentativa
                const bestAttempt = attempts.reduce((best, current) =>
                    current.score > best.score ? current : best
                );

                const weight = quiz.weight || 0;
                totalQuizWeight += weight;

                quizScores.push({
                    quizId: quiz._id,
                    score: bestAttempt.score,
                    weight,
                    weightedScore: (bestAttempt.score * weight) / 100,
                });
            }
        }

        // Buscar assignments (aulas tipo "assignment") do curso
        const modules = await ctx.db
            .query("modules")
            .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
            .collect();

        const assignmentScores: { lessonId: any; score: number; weight: number; weightedScore: number }[] = [];
        for (const module of modules) {
            const assignments = await ctx.db
                .query("lessons")
                .withIndex("by_module", (q) => q.eq("moduleId", module._id))
                .filter((q) => q.eq(q.field("type"), "assignment"))
                .collect();

            // Por enquanto, não temos sistema de notas para assignments
            // Isso será implementado futuramente
            // Aqui só preparamos a estrutura
        }

        // Calcular nota final
        const totalWeight = totalQuizWeight + totalAssignmentWeight;
        let finalGrade = 0;

        if (totalWeight > 0) {
            const quizTotal = quizScores.reduce((sum, qs) => sum + qs.weightedScore, 0);
            const assignmentTotal = assignmentScores.reduce((sum, as) => sum + as.weightedScore, 0);

            finalGrade = ((quizTotal + assignmentTotal) / totalWeight) * 100;
        } else {
            // Se não houver pesos definidos, usar média simples dos quizzes
            if (quizScores.length > 0) {
                finalGrade = quizScores.reduce((sum, qs) => sum + qs.score, 0) / quizScores.length;
            }
        }

        // Determinar letra
        let letterGrade = "F";
        if (finalGrade >= 90) letterGrade = "A";
        else if (finalGrade >= 80) letterGrade = "B";
        else if (finalGrade >= 70) letterGrade = "C";
        else if (finalGrade >= 60) letterGrade = "D";

        // Verificar se já existe registro
        const existing = await ctx.db
            .query("courseGrades")
            .withIndex("by_user_course", (q) =>
                q.eq("userId", args.userId).eq("courseId", args.courseId)
            )
            .first();

        const gradeData = {
            userId: args.userId,
            courseId: args.courseId,
            quizScores,
            assignmentScores,
            finalGrade: Math.round(finalGrade * 100) / 100, // 2 casas decimais
            letterGrade,
            updatedAt: Date.now(),
        };

        if (existing) {
            await ctx.db.patch(existing._id, gradeData);
            return existing._id;
        } else {
            return await ctx.db.insert("courseGrades", gradeData);
        }
    },
});

// Buscar notas de um aluno em um curso
export const getByStudent = query({
    args: {
        userId: v.id("users"),
        courseId: v.id("courses"),
    },
    handler: async (ctx, args) => {
        const grades = await ctx.db
            .query("courseGrades")
            .withIndex("by_user_course", (q) =>
                q.eq("userId", args.userId).eq("courseId", args.courseId)
            )
            .first();

        if (!grades) return null;

        // Enriquecer com nomes dos quizzes
        const enrichedQuizScores = await Promise.all(
            grades.quizScores.map(async (qs) => {
                const quiz = await ctx.db.get(qs.quizId);
                return {
                    ...qs,
                    quizName: quiz?.title || "Quiz Desconhecido",
                };
            })
        );

        // Enriquecer com nomes dos assignments
        const enrichedAssignmentScores = await Promise.all(
            grades.assignmentScores.map(async (as) => {
                const lesson = await ctx.db.get(as.lessonId);
                return {
                    ...as,
                    assignmentName: lesson?.title || "Atividade Desconhecida",
                };
            })
        );

        return {
            ...grades,
            quizScores: enrichedQuizScores,
            assignmentScores: enrichedAssignmentScores,
        };
    },
});

// Relatório completo de notas (Gradebook)
export const getStudentGradebook = query({
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

        if (!enrollment) {
            throw new Error("Matrícula não encontrada");
        }

        const course = await ctx.db.get(args.courseId);
        if (!course) throw new Error("Curso não encontrado");

        // Buscar todas as provas e tentativas
        const quizzes = await ctx.db
            .query("quizzes")
            .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
            .filter((q) => q.eq(q.field("isPublished"), true))
            .collect();

        const quizDetails = await Promise.all(
            quizzes.map(async (quiz) => {
                const attempts = await ctx.db
                    .query("quizAttempts")
                    .withIndex("by_quiz_user", (q) =>
                        q.eq("quizId", quiz._id).eq("userId", args.userId)
                    )
                    .collect();

                let bestScore = null;
                let attemptCount = attempts.length;
                let lastAttempt = null;

                if (attempts.length > 0) {
                    const best = attempts.reduce((best, current) =>
                        current.score > best.score ? current : best
                    );
                    bestScore = best.score;
                    lastAttempt = attempts.reduce((last, current) =>
                        current.completedAt > last.completedAt ? current : last
                    );
                }

                return {
                    id: quiz._id,
                    title: quiz.title,
                    weight: quiz.weight || 0,
                    maxAttempts: quiz.maxAttempts,
                    passingScore: quiz.passingScore,
                    attemptCount,
                    bestScore,
                    passed: bestScore !== null && bestScore >= quiz.passingScore,
                    lastAttemptDate: lastAttempt?.completedAt,
                };
            })
        );

        // Buscar assignments (futuro)
        const assignmentDetails: any[] = [];

        // Buscar ou calcular nota final
        let courseGrade = await ctx.db
            .query("courseGrades")
            .withIndex("by_user_course", (q) =>
                q.eq("userId", args.userId).eq("courseId", args.courseId)
            )
            .first();

        // Se não existe, calcular
        if (!courseGrade && quizDetails.some((q) => q.bestScore !== null)) {
            // Recalcular notas
            // (Normalmente seria feito por um mutation, mas para gradebook fazemos aqui)
            let totalPoints = 0;
            let totalWeight = 0;

            quizDetails.forEach((qd) => {
                if (qd.bestScore !== null) {
                    const weight = qd.weight || 1;
                    totalWeight += weight;
                    totalPoints += (qd.bestScore * weight) / 100;
                }
            });

            const finalGrade = totalWeight > 0 ? (totalPoints / totalWeight) * 100 : 0;
            let letterGrade = "F";
            if (finalGrade >= 90) letterGrade = "A";
            else if (finalGrade >= 80) letterGrade = "B";
            else if (finalGrade >= 70) letterGrade = "C";
            else if (finalGrade >= 60) letterGrade = "D";

            courseGrade = {
                finalGrade: Math.round(finalGrade * 100) / 100,
                letterGrade,
            } as any;
        }

        return {
            course: {
                id: course._id,
                title: course.title,
            },
            enrollment: {
                progress: enrollment.progress,
                startedAt: enrollment.startedAt,
                completedAt: enrollment.completedAt,
            },
            quizzes: quizDetails,
            assignments: assignmentDetails,
            finalGrade: courseGrade?.finalGrade || 0,
            letterGrade: courseGrade?.letterGrade || "N/A",
        };
    },
});

// Recalcular notas após tentativa de quiz
export const recalculateAfterQuiz = mutation({
    args: {
        userId: v.id("users"),
        quizId: v.id("quizzes"),
    },
    handler: async (ctx, args) => {
        const quiz = await ctx.db.get(args.quizId);
        if (!quiz) return;

        // Recalcular notas do curso inline (evitando chamada recursiva)
        const courseId = quiz.courseId;
        const userId = args.userId;

        // Buscar todas as tentativas de quizzes do usuário no curso
        const quizzes = await ctx.db
            .query("quizzes")
            .withIndex("by_course", (q) => q.eq("courseId", courseId))
            .filter((q) => q.eq(q.field("isPublished"), true))
            .collect();

        const quizScores: { quizId: any; score: number; weight: number; weightedScore: number }[] = [];
        let totalQuizWeight = 0;

        for (const qz of quizzes) {
            const attempts = await ctx.db
                .query("quizAttempts")
                .withIndex("by_quiz_user", (q) =>
                    q.eq("quizId", qz._id).eq("userId", userId)
                )
                .collect();

            if (attempts.length > 0) {
                const bestAttempt = attempts.reduce((best, current) =>
                    current.score > best.score ? current : best
                );

                const weight = qz.weight || 0;
                totalQuizWeight += weight;

                quizScores.push({
                    quizId: qz._id,
                    score: bestAttempt.score,
                    weight,
                    weightedScore: (bestAttempt.score * weight) / 100,
                });
            }
        }

        // Calcular nota final
        let finalGrade = 0;
        if (totalQuizWeight > 0) {
            const quizTotal = quizScores.reduce((sum, qs) => sum + qs.weightedScore, 0);
            finalGrade = (quizTotal / totalQuizWeight) * 100;
        } else if (quizScores.length > 0) {
            finalGrade = quizScores.reduce((sum, qs) => sum + qs.score, 0) / quizScores.length;
        }

        // Determinar letra
        let letterGrade = "F";
        if (finalGrade >= 90) letterGrade = "A";
        else if (finalGrade >= 80) letterGrade = "B";
        else if (finalGrade >= 70) letterGrade = "C";
        else if (finalGrade >= 60) letterGrade = "D";

        // Atualizar ou criar registro
        const existing = await ctx.db
            .query("courseGrades")
            .withIndex("by_user_course", (q) =>
                q.eq("userId", userId).eq("courseId", courseId)
            )
            .first();

        const gradeData = {
            userId,
            courseId,
            quizScores,
            assignmentScores: [],
            finalGrade: Math.round(finalGrade * 100) / 100,
            letterGrade,
            updatedAt: Date.now(),
        };

        if (existing) {
            await ctx.db.patch(existing._id, gradeData);
        } else {
            await ctx.db.insert("courseGrades", gradeData);
        }
    },
});
