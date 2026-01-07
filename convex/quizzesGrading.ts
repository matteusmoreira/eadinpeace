import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ================================
// GRADING FUNCTIONS - Correção de Provas
// ================================

// Listar todas as tentativas de uma prova (para correção)
export const getAttemptsByQuiz = query({
    args: {
        quizId: v.id("quizzes"),
        gradingStatus: v.optional(v.union(
            v.literal("auto_graded"),
            v.literal("pending"),
            v.literal("grading"),
            v.literal("graded")
        )),
    },
    handler: async (ctx, args) => {
        let attempts = await ctx.db
            .query("quizAttempts")
            .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
            .collect();

        // Filtrar por status se especificado
        if (args.gradingStatus) {
            attempts = attempts.filter((a) => a.gradingStatus === args.gradingStatus);
        }

        // Enriquecer com informações do aluno
        const enrichedAttempts = await Promise.all(
            attempts.map(async (attempt) => {
                const user = await ctx.db.get(attempt.userId);
                return {
                    ...attempt,
                    studentName: user ? `${user.firstName} ${user.lastName}` : "Desconhecido",
                    studentEmail: user?.email || "",
                };
            })
        );

        return enrichedAttempts.sort((a, b) => a.completedAt - b.completedAt);
    },
});

// Buscar tentativa específica com todos os detalhes
export const getAttemptById = query({
    args: { attemptId: v.id("quizAttempts") },
    handler: async (ctx, args) => {
        const attempt = await ctx.db.get(args.attemptId);
        if (!attempt) return null;

        const user = await ctx.db.get(attempt.userId);
        const quiz = await ctx.db.get(attempt.quizId);

        if (!quiz) return null;

        // Buscar questões com detalhes
        const questionsWithDetails = await Promise.all(
            attempt.answers.map(async (answer) => {
                const question = await ctx.db.get(answer.questionId);
                return {
                    ...answer,
                    questionData: question,
                };
            })
        );

        return {
            ...attempt,
            studentName: user ? `${user.firstName} ${user.lastName}` : "Desconhecido",
            studentEmail: user?.email || "",
            quizTitle: quiz.title,
            questions: questionsWithDetails,
        };
    },
});

// Corrigir uma tentativa completa
export const gradeAttempt = mutation({
    args: {
        attemptId: v.id("quizAttempts"),
        questionGrades: v.array(v.object({
            questionId: v.id("quizQuestions"),
            manualPoints: v.number(),
            instructorFeedback: v.optional(v.string()),
        })),
        instructorComments: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Não autenticado");

        const instructor = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!instructor) throw new Error("Usuário não encontrado");

        const attempt = await ctx.db.get(args.attemptId);
        if (!attempt) throw new Error("Tentativa não encontrada");

        // Atualizar respostas com notas manuais e feedback
        const updatedAnswers = attempt.answers.map((answer) => {
            const grade = args.questionGrades.find((g) =>
                g.questionId.toString() === answer.questionId.toString()
            );

            if (grade) {
                return {
                    ...answer,
                    manualPoints: grade.manualPoints,
                    instructorFeedback: grade.instructorFeedback,
                    points: grade.manualPoints, // Atualizar pontos totais
                };
            }
            return answer;
        });

        // Calcular pontuação total
        const totalPoints = updatedAnswers.reduce((sum, answer) => sum + answer.points, 0);
        const maxPoints = updatedAnswers.reduce((sum, answer) => {
            // Buscar pontuação máxima da questão (seria bom ter isso no answer)
            return sum + (answer.manualPoints !== undefined ? answer.manualPoints : answer.points);
        }, 0);

        const score = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

        const quiz = await ctx.db.get(attempt.quizId);
        const passed = quiz ? score >= quiz.passingScore : false;

        // Atualizar tentativa
        await ctx.db.patch(args.attemptId, {
            answers: updatedAnswers,
            manualScore: totalPoints,
            score: Math.round(score * 100) / 100,
            passed,
            gradingStatus: "graded",
            gradedBy: instructor._id,
            gradedAt: Date.now(),
            instructorComments: args.instructorComments,
        });

        // Enviar notificação ao aluno
        await ctx.db.insert("notifications", {
            userId: attempt.userId,
            type: "quiz_result",
            title: "Prova Corrigida",
            message: `Sua prova "${quiz?.title || 'Quiz'}" foi corrigida. Nota: ${Math.round(score)}%`,
            link: `/student/quizzes/${attempt.quizId}/attempt/${args.attemptId}`,
            isRead: false,
            metadata: {
                quizId: attempt.quizId,
                attemptId: args.attemptId,
                score,
                passed,
            },
            createdAt: Date.now(),
        });

        // Recalcular notas do curso se houver peso
        if (quiz?.weight && quiz.weight > 0) {
            // Importar e chamar função de recálculo
            // await ctx.runMutation(internal.courseGrades.recalculateAfterQuiz, {
            //     userId: attempt.userId,
            //     quizId: attempt.quizId,
            // });
        }

        return args.attemptId;
    },
});

// Atualizar nota de uma questão específica (correção parcial)
export const updateQuestionGrade = mutation({
    args: {
        attemptId: v.id("quizAttempts"),
        questionId: v.id("quizQuestions"),
        manualPoints: v.number(),
        instructorFeedback: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const attempt = await ctx.db.get(args.attemptId);
        if (!attempt) throw new Error("Tentativa não encontrada");

        // Atualizar resposta específica
        const updatedAnswers = attempt.answers.map((answer) => {
            if (answer.questionId.toString() === args.questionId.toString()) {
                return {
                    ...answer,
                    manualPoints: args.manualPoints,
                    instructorFeedback: args.instructorFeedback,
                    points: args.manualPoints,
                };
            }
            return answer;
        });

        // Recalcular pontuação total
        const totalPoints = updatedAnswers.reduce((sum, answer) => sum + answer.points, 0);
        const maxPoints = updatedAnswers.reduce((sum, answer) => sum + (answer.manualPoints || answer.points), 0);
        const score = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

        const quiz = await ctx.db.get(attempt.quizId);
        const passed = quiz ? score >= quiz.passingScore : false;

        // Atualizar tentativa
        await ctx.db.patch(args.attemptId, {
            answers: updatedAnswers,
            score: Math.round(score * 100) / 100,
            passed,
            gradingStatus: "grading", // Ainda em correção
        });

        return args.attemptId;
    },
});

// Estatísticas para o painel do professor
export const getGradingStats = query({
    args: {
        organizationId: v.optional(v.id("organizations")),
        courseId: v.optional(v.id("courses")),
    },
    handler: async (ctx, args) => {
        let quizzes = [];

        if (args.courseId) {
            quizzes = await ctx.db
                .query("quizzes")
                .withIndex("by_course", (q) => q.eq("courseId", args.courseId!))
                .collect();
        } else if (args.organizationId) {
            // Buscar todos os cursos da organização
            const courses = await ctx.db
                .query("courses")
                .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId!))
                .collect();

            for (const course of courses) {
                const courseQuizzes = await ctx.db
                    .query("quizzes")
                    .withIndex("by_course", (q) => q.eq("courseId", course._id))
                    .collect();
                quizzes.push(...courseQuizzes);
            }
        }

        let totalAttempts = 0;
        let pendingGrading = 0;
        let graded = 0;
        let totalScore = 0;
        let passedCount = 0;

        for (const quiz of quizzes) {
            const attempts = await ctx.db
                .query("quizAttempts")
                .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
                .collect();

            totalAttempts += attempts.length;

            attempts.forEach((attempt) => {
                if (attempt.gradingStatus === "pending" || attempt.gradingStatus === "grading") {
                    pendingGrading++;
                } else if (attempt.gradingStatus === "graded" || attempt.gradingStatus === "auto_graded") {
                    graded++;
                    totalScore += attempt.score;
                    if (attempt.passed) passedCount++;
                }
            });
        }

        return {
            totalAttempts,
            pendingGrading,
            graded,
            avgScore: graded > 0 ? Math.round(totalScore / graded) : 0,
            passRate: graded > 0 ? Math.round((passedCount / graded) * 100) : 0,
        };
    },
});

// Listar tentativas pendentes de correção
export const getPendingGrading = query({
    args: {
        instructorId: v.optional(v.id("users")),
        courseId: v.optional(v.id("courses")),
    },
    handler: async (ctx, args) => {
        let quizzes: any[] = [];
        const courseIds = new Set<string>();

        if (args.courseId) {
            quizzes = await ctx.db
                .query("quizzes")
                .withIndex("by_course", (q) => q.eq("courseId", args.courseId!))
                .collect();
        } else if (args.instructorId) {
            // Buscar o usuário para obter a organização
            const instructor = await ctx.db.get(args.instructorId);

            if (instructor?.organizationId) {
                // Buscar TODOS os cursos da organização (para admins e coordenadores)
                const allCourses = await ctx.db
                    .query("courses")
                    .withIndex("by_organization", (q) => q.eq("organizationId", instructor.organizationId!))
                    .collect();

                for (const course of allCourses) {
                    courseIds.add(course._id);
                }
            }

            // Fallback: Também incluir cursos onde o professor é o instrutor principal
            const ownCourses = await ctx.db
                .query("courses")
                .withIndex("by_instructor", (q) => q.eq("instructorId", args.instructorId!))
                .collect();

            for (const course of ownCourses) {
                courseIds.add(course._id);
            }

            // Buscar turmas onde o professor é instrutor (classInstructors)
            const classInstructorRecords = await ctx.db
                .query("classInstructors")
                .withIndex("by_user", (q) => q.eq("userId", args.instructorId!))
                .collect();

            // Buscar os cursos associados às turmas
            for (const record of classInstructorRecords) {
                // Verificar se tem permissão para corrigir
                if (record.permissions?.canGrade) {
                    const classData = await ctx.db.get(record.classId);
                    if (classData) {
                        courseIds.add(classData.courseId);
                    }
                }
            }

            // Buscar quizzes de todos os cursos encontrados
            for (const courseId of courseIds) {
                const courseQuizzes = await ctx.db
                    .query("quizzes")
                    .withIndex("by_course", (q) => q.eq("courseId", courseId as any))
                    .collect();
                quizzes.push(...courseQuizzes);
            }
        }

        const pendingAttempts = [];

        for (const quiz of quizzes) {
            const attempts = await ctx.db
                .query("quizAttempts")
                .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
                .filter((q) => q.or(
                    q.eq(q.field("gradingStatus"), "pending"),
                    q.eq(q.field("gradingStatus"), "grading")
                ))
                .collect();

            for (const attempt of attempts) {
                const user = await ctx.db.get(attempt.userId);
                pendingAttempts.push({
                    attemptId: attempt._id,
                    quizId: quiz._id,
                    quizTitle: quiz.title,
                    studentName: user ? `${user.firstName} ${user.lastName}` : "Desconhecido",
                    studentEmail: user?.email || "",
                    completedAt: attempt.completedAt,
                    gradingStatus: attempt.gradingStatus,
                    automaticScore: attempt.automaticScore,
                });
            }
        }

        // Ordenar por data (mais antigas primeiro - FIFO)
        return pendingAttempts.sort((a, b) => a.completedAt - b.completedAt);
    },
});


// Adicionar feedback do aluno sobre a prova
export const addStudentFeedback = mutation({
    args: {
        attemptId: v.id("quizAttempts"),
        feedback: v.string(),
        rating: v.number(), // 1-5
    },
    handler: async (ctx, args) => {
        const attempt = await ctx.db.get(args.attemptId);
        if (!attempt) throw new Error("Tentativa não encontrada");

        await ctx.db.patch(args.attemptId, {
            studentFeedback: args.feedback,
            studentRating: args.rating,
        });

        return args.attemptId;
    },
});

// Duplicar prova
export const duplicate = mutation({
    args: {
        quizId: v.id("quizzes"),
        newTitle: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const original = await ctx.db.get(args.quizId);
        if (!original) throw new Error("Prova não encontrada");

        const now = Date.now();

        // Criar nova prova
        const newQuizId = await ctx.db.insert("quizzes", {
            courseId: original.courseId,
            lessonId: original.lessonId,
            title: args.newTitle || `${original.title} (Cópia)`,
            description: original.description,
            passingScore: original.passingScore,
            timeLimit: original.timeLimit,
            maxAttempts: original.maxAttempts,
            randomizeQuestions: original.randomizeQuestions,
            randomizeOptions: original.randomizeOptions,
            revealMode: original.revealMode,
            allowStudentFeedback: original.allowStudentFeedback,
            weight: original.weight,
            isPublished: false, // Não publicar automaticamente
            createdAt: now,
            updatedAt: now,
        });

        // Copiar questões
        const questions = await ctx.db
            .query("quizQuestions")
            .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
            .collect();

        for (const question of questions.sort((a, b) => a.order - b.order)) {
            await ctx.db.insert("quizQuestions", {
                quizId: newQuizId,
                questionBankId: question.questionBankId,
                type: question.type,
                question: question.question,
                options: question.options,
                correctAnswer: question.correctAnswer,
                correctAnswers: question.correctAnswers,
                matchPairs: question.matchPairs,
                correctOrder: question.correctOrder,
                blankPositions: question.blankPositions,
                blankAnswers: question.blankAnswers,
                mediaUrl: question.mediaUrl,
                mediaType: question.mediaType,
                explanation: question.explanation,
                points: question.points,
                order: question.order,
                requiresManualGrading: question.requiresManualGrading,
                createdAt: now,
                updatedAt: now,
            });
        }

        return newQuizId;
    },
});

// Estatísticas detalhadas de uma prova
export const getStatistics = query({
    args: { quizId: v.id("quizzes") },
    handler: async (ctx, args) => {
        const quiz = await ctx.db.get(args.quizId);
        if (!quiz) return null;

        const attempts = await ctx.db
            .query("quizAttempts")
            .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
            .collect();

        const questions = await ctx.db
            .query("quizQuestions")
            .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
            .collect();

        // Estatísticas gerais
        const totalAttempts = attempts.length;
        const avgScore = attempts.length > 0
            ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
            : 0;
        const passedAttempts = attempts.filter((a) => a.passed).length;
        const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0;

        // Distribuição de notas (histograma)
        const scoreDistribution = {
            "0-20": 0,
            "21-40": 0,
            "41-60": 0,
            "61-80": 0,
            "81-100": 0,
        };

        attempts.forEach((attempt) => {
            if (attempt.score <= 20) scoreDistribution["0-20"]++;
            else if (attempt.score <= 40) scoreDistribution["21-40"]++;
            else if (attempt.score <= 60) scoreDistribution["41-60"]++;
            else if (attempt.score <= 80) scoreDistribution["61-80"]++;
            else scoreDistribution["81-100"]++;
        });

        // Desempenho por questão
        const questionStats = questions.map((question) => {
            let correctCount = 0;
            let totalAnswers = 0;

            attempts.forEach((attempt) => {
                const answer = attempt.answers.find((a) =>
                    a.questionId.toString() === question._id.toString()
                );
                if (answer) {
                    totalAnswers++;
                    if (answer.isCorrect) correctCount++;
                }
            });

            return {
                questionId: question._id,
                question: question.question.substring(0, 100),
                correctRate: totalAnswers > 0 ? (correctCount / totalAnswers) * 100 : 0,
                totalAnswers,
            };
        });

        return {
            quiz: {
                id: quiz._id,
                title: quiz.title,
            },
            general: {
                totalAttempts,
                avgScore: Math.round(avgScore * 100) / 100,
                passRate: Math.round(passRate),
            },
            scoreDistribution,
            questionStats: questionStats.sort((a, b) => a.correctRate - b.correctRate), // Mais difíceis primeiro
        };
    },
});
