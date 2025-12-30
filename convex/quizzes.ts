import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all quizzes (for superadmins or admins viewing all organizational quizzes)
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        // Get all courses first
        const courses = await ctx.db.query("courses").collect();

        const courseMap = new Map(courses.map(c => [c._id, c]));

        // Get all quizzes
        const quizzes = await ctx.db.query("quizzes").collect();

        // Enrich quizzes with course name and stats
        const enrichedQuizzes = await Promise.all(
            quizzes.map(async (quiz) => {
                const course = courseMap.get(quiz.courseId);

                const questions = await ctx.db
                    .query("quizQuestions")
                    .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
                    .collect();

                const attempts = await ctx.db
                    .query("quizAttempts")
                    .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
                    .collect();

                const avgScore = attempts.length > 0
                    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
                    : 0;

                return {
                    ...quiz,
                    courseName: course?.title || "Sem curso",
                    questionCount: questions.length,
                    attemptCount: attempts.length,
                    avgScore,
                };
            })
        );

        return enrichedQuizzes;
    },
});

// Get quiz by lesson
export const getByLesson = query({
    args: { lessonId: v.id("lessons") },
    handler: async (ctx, args) => {
        // Primeiro tenta buscar pelo lessonId diretamente
        let quiz = await ctx.db
            .query("quizzes")
            .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
            .first();

        // Se não encontrou, busca o lesson e tenta encontrar um quiz do mesmo curso
        if (!quiz) {
            const lesson = await ctx.db.get(args.lessonId);
            if (lesson && lesson.type === "exam") {
                // Busca quizzes do curso que têm título similar ao título da aula
                const courseQuizzes = await ctx.db
                    .query("quizzes")
                    .withIndex("by_course", (q) => q.eq("courseId", lesson.courseId))
                    .collect();

                // Tenta encontrar um quiz com título semelhante ou usa o primeiro publicado
                quiz = courseQuizzes.find(q =>
                    q.title.toLowerCase().includes(lesson.title.toLowerCase()) ||
                    lesson.title.toLowerCase().includes(q.title.toLowerCase())
                ) || courseQuizzes.find(q => q.isPublished) || courseQuizzes[0];
            }
        }

        if (!quiz) return null;

        // Get questions
        const questions = await ctx.db
            .query("quizQuestions")
            .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
            .collect();

        return {
            ...quiz,
            questions: questions.sort((a, b) => a.order - b.order),
        };
    },
});

// Get quiz by course
export const getByCourse = query({
    args: { courseId: v.id("courses") },
    handler: async (ctx, args) => {
        const quizzes = await ctx.db
            .query("quizzes")
            .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
            .collect();

        // Enrich with question count and attempt stats
        const enrichedQuizzes = await Promise.all(
            quizzes.map(async (quiz) => {
                const questions = await ctx.db
                    .query("quizQuestions")
                    .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
                    .collect();

                const attempts = await ctx.db
                    .query("quizAttempts")
                    .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
                    .collect();

                const avgScore = attempts.length > 0
                    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
                    : 0;

                return {
                    ...quiz,
                    questionCount: questions.length,
                    attemptCount: attempts.length,
                    avgScore,
                };
            })
        );

        return enrichedQuizzes;
    },
});

// Get all quizzes for an organization (for admins)
export const getByOrganization = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        // Get all courses for this organization
        const courses = await ctx.db
            .query("courses")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        // Get all quizzes for these courses
        const allQuizzes = [];
        for (const course of courses) {
            const quizzes = await ctx.db
                .query("quizzes")
                .withIndex("by_course", (q) => q.eq("courseId", course._id))
                .collect();

            for (const quiz of quizzes) {
                const questions = await ctx.db
                    .query("quizQuestions")
                    .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
                    .collect();

                const attempts = await ctx.db
                    .query("quizAttempts")
                    .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
                    .collect();

                const avgScore = attempts.length > 0
                    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
                    : 0;

                allQuizzes.push({
                    ...quiz,
                    courseName: course.title,
                    questionCount: questions.length,
                    attemptCount: attempts.length,
                    avgScore,
                });
            }
        }

        return allQuizzes;
    },
});

// Get all quizzes for instructor
export const getByInstructor = query({
    args: { instructorId: v.id("users") },
    handler: async (ctx, args) => {
        // Get all courses by instructor
        const courses = await ctx.db
            .query("courses")
            .withIndex("by_instructor", (q) => q.eq("instructorId", args.instructorId))
            .collect();

        // Get all quizzes for these courses
        const allQuizzes = [];
        for (const course of courses) {
            const quizzes = await ctx.db
                .query("quizzes")
                .withIndex("by_course", (q) => q.eq("courseId", course._id))
                .collect();

            for (const quiz of quizzes) {
                const questions = await ctx.db
                    .query("quizQuestions")
                    .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
                    .collect();

                const attempts = await ctx.db
                    .query("quizAttempts")
                    .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
                    .collect();

                const avgScore = attempts.length > 0
                    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
                    : 0;

                allQuizzes.push({
                    ...quiz,
                    courseName: course.title,
                    questionCount: questions.length,
                    attemptCount: attempts.length,
                    avgScore,
                });
            }
        }

        return allQuizzes;
    },
});

// Get quiz with all details (for editing)
export const getWithQuestions = query({
    args: { quizId: v.id("quizzes") },
    handler: async (ctx, args) => {
        const quiz = await ctx.db.get(args.quizId);
        if (!quiz) return null;

        const questions = await ctx.db
            .query("quizQuestions")
            .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
            .collect();

        const course = await ctx.db.get(quiz.courseId);

        return {
            ...quiz,
            courseName: course?.title || "Curso Desconhecido",
            questions: questions.sort((a, b) => a.order - b.order),
        };
    },
});

// Create quiz
export const create = mutation({
    args: {
        courseId: v.id("courses"),
        lessonId: v.optional(v.id("lessons")),
        title: v.string(),
        description: v.optional(v.string()),
        passingScore: v.number(),
        timeLimit: v.optional(v.number()),
        maxAttempts: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db.insert("quizzes", {
            ...args,
            isPublished: false,
            createdAt: now,
            updatedAt: now,
        });
    },
});

// Add question to quiz
export const addQuestion = mutation({
    args: {
        quizId: v.id("quizzes"),
        type: v.union(
            v.literal("true_false"),
            v.literal("single_choice"),
            v.literal("multiple_choice"),
            v.literal("short_answer"),
            v.literal("text_answer"),
            v.literal("match_following"),
            v.literal("sortable"),
            v.literal("fill_blanks"),
            v.literal("audio_video")
        ),
        question: v.string(),
        options: v.optional(v.array(v.string())),
        correctAnswer: v.optional(v.string()),
        correctAnswers: v.optional(v.array(v.string())),
        matchPairs: v.optional(v.array(v.object({
            prompt: v.string(),
            promptImage: v.optional(v.string()),
            answer: v.string(),
            answerImage: v.optional(v.string()),
        }))),
        correctOrder: v.optional(v.array(v.string())),
        blankPositions: v.optional(v.array(v.number())),
        blankAnswers: v.optional(v.array(v.string())),
        mediaUrl: v.optional(v.string()),
        mediaType: v.optional(v.union(v.literal("audio"), v.literal("video"))),
        explanation: v.optional(v.string()),
        points: v.number(),
    },
    handler: async (ctx, args) => {
        // Get current questions count for order
        const existingQuestions = await ctx.db
            .query("quizQuestions")
            .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
            .collect();

        const requiresManualGrading = args.type === "text_answer" || args.type === "audio_video";

        const now = Date.now();
        return await ctx.db.insert("quizQuestions", {
            ...args,
            order: existingQuestions.length,
            requiresManualGrading,
            createdAt: now,
            updatedAt: now,
        });
    },
});

// Submit quiz attempt - Suporta todos os 9 tipos de questões
export const submitAttempt = mutation({
    args: {
        quizId: v.id("quizzes"),
        userId: v.id("users"),
        answers: v.array(v.object({
            questionId: v.id("quizQuestions"),
            // Diferentes tipos de resposta
            answer: v.optional(v.string()), // single_choice, true_false, short_answer, text_answer
            answers: v.optional(v.array(v.string())), // multiple_choice
            matches: v.optional(v.array(v.object({ // match_following
                prompt: v.string(),
                answer: v.string(),
            }))),
            order: v.optional(v.array(v.string())), // sortable
            blanks: v.optional(v.array(v.string())), // fill_blanks
        })),
        timeSpent: v.number(),
    },
    handler: async (ctx, args) => {
        const quiz = await ctx.db.get(args.quizId);
        if (!quiz) throw new Error("Quiz not found");

        // Get questions
        const questions = await ctx.db
            .query("quizQuestions")
            .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
            .collect();

        // Calculate score
        let earnedPoints = 0;
        let totalPoints = 0;
        let automaticPoints = 0;
        let requiresManualGrading = false;
        const results = [];

        for (const question of questions) {
            totalPoints += question.points;
            const userAnswer = args.answers.find(a => a.questionId === question._id);

            let isCorrect = false;
            let points = 0;
            let needsManual = question.requiresManualGrading || false;

            // Avaliar baseado no tipo de questão
            switch (question.type) {
                case "true_false":
                case "single_choice":
                case "short_answer":
                    // Comparação simples de string
                    isCorrect = userAnswer?.answer?.toLowerCase().trim() ===
                        question.correctAnswer?.toLowerCase().trim();
                    if (isCorrect) {
                        earnedPoints += question.points;
                        automaticPoints += question.points;
                        points = question.points;
                    }
                    break;

                case "multiple_choice":
                    // Todas as respostas corretas devem estar selecionadas
                    const userAnswers = userAnswer?.answers || [];
                    const correctAnswers = question.correctAnswers || [];

                    if (userAnswers.length === correctAnswers.length) {
                        const sortedUser = [...userAnswers].sort();
                        const sortedCorrect = [...correctAnswers].sort();
                        isCorrect = sortedUser.every((a, i) => a === sortedCorrect[i]);
                    }

                    if (isCorrect) {
                        earnedPoints += question.points;
                        automaticPoints += question.points;
                        points = question.points;
                    }
                    break;

                case "match_following":
                    // Verificar se todos os pares estão corretos
                    const userMatches = userAnswer?.matches || [];
                    const correctPairs = question.matchPairs || [];

                    if (userMatches.length === correctPairs.length) {
                        isCorrect = correctPairs.every(pair =>
                            userMatches.some(um =>
                                um.prompt === pair.prompt && um.answer === pair.answer
                            )
                        );
                    }

                    if (isCorrect) {
                        earnedPoints += question.points;
                        automaticPoints += question.points;
                        points = question.points;
                    }
                    break;

                case "sortable":
                    // Verificar se a ordem está correta
                    const userOrder = userAnswer?.order || [];
                    const correctOrder = question.correctOrder || [];

                    isCorrect = userOrder.length === correctOrder.length &&
                        userOrder.every((item, i) => item === correctOrder[i]);

                    if (isCorrect) {
                        earnedPoints += question.points;
                        automaticPoints += question.points;
                        points = question.points;
                    }
                    break;

                case "fill_blanks":
                    // Verificar se todas as lacunas estão corretas
                    const userBlanks = userAnswer?.blanks || [];
                    const correctBlanks = question.blankAnswers || [];

                    isCorrect = userBlanks.length === correctBlanks.length &&
                        userBlanks.every((blank, i) =>
                            blank.toLowerCase().trim() === correctBlanks[i]?.toLowerCase().trim()
                        );

                    if (isCorrect) {
                        earnedPoints += question.points;
                        automaticPoints += question.points;
                        points = question.points;
                    }
                    break;

                case "text_answer":
                case "audio_video":
                    // Requer correção manual
                    needsManual = true;
                    requiresManualGrading = true;
                    isCorrect = false; // Será definido pelo professor
                    points = 0; // Será atribuído pelo professor
                    break;
            }

            results.push({
                questionId: question._id,
                userAnswer: userAnswer?.answer,
                userAnswers: userAnswer?.answers,
                userMatches: userAnswer?.matches,
                userOrder: userAnswer?.order,
                userBlanks: userAnswer?.blanks,
                correctAnswer: question.correctAnswer,
                correctAnswers: question.correctAnswers,
                isCorrect,
                points,
                manualPoints: needsManual ? undefined : undefined,
                instructorFeedback: undefined,
            });
        }

        const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        const passed = !requiresManualGrading && score >= quiz.passingScore;

        // Determinar status de correção
        const gradingStatus = requiresManualGrading ? "pending" : "auto_graded";

        const now = Date.now();
        const attemptId = await ctx.db.insert("quizAttempts", {
            quizId: args.quizId,
            userId: args.userId,
            score,
            automaticScore: automaticPoints,
            manualScore: 0,
            passed,
            timeSpent: args.timeSpent,
            answers: results,
            gradingStatus,
            completedAt: now,
        });

        // Se não requer correção manual, pode calcular notas do curso
        // (Para correção manual, será feito após a correção)

        return {
            attemptId,
            score,
            passed,
            earnedPoints,
            totalPoints,
            results,
            gradingStatus,
            requiresManualGrading,
        };
    },
});

// Get user attempts for a quiz
export const getUserAttempts = query({
    args: {
        quizId: v.id("quizzes"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("quizAttempts")
            .filter((q) =>
                q.and(
                    q.eq(q.field("quizId"), args.quizId),
                    q.eq(q.field("userId"), args.userId)
                )
            )
            .collect();
    },
});

// Get best attempt
export const getBestAttempt = query({
    args: {
        quizId: v.id("quizzes"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const attempts = await ctx.db
            .query("quizAttempts")
            .filter((q) =>
                q.and(
                    q.eq(q.field("quizId"), args.quizId),
                    q.eq(q.field("userId"), args.userId)
                )
            )
            .collect();

        if (attempts.length === 0) return null;

        return attempts.sort((a, b) => b.score - a.score)[0];
    },
});

// Publish quiz
export const publish = mutation({
    args: { quizId: v.id("quizzes") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.quizId, {
            isPublished: true,
            updatedAt: Date.now(),
        });
    },
});

// Unpublish quiz
export const unpublish = mutation({
    args: { quizId: v.id("quizzes") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.quizId, {
            isPublished: false,
            updatedAt: Date.now(),
        });
    },
});

// Update quiz
export const update = mutation({
    args: {
        quizId: v.id("quizzes"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        passingScore: v.optional(v.number()),
        timeLimit: v.optional(v.number()),
        maxAttempts: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { quizId, ...updates } = args;
        await ctx.db.patch(quizId, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

// Delete question
export const deleteQuestion = mutation({
    args: { questionId: v.id("quizQuestions") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.questionId);
    },
});


// Get all quizzes available for a student (from enrolled courses)
export const getStudentQuizzes = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        // Get user's enrollments
        const enrollments = await ctx.db
            .query("enrollments")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        if (enrollments.length === 0) {
            return {
                quizzes: [],
                stats: {
                    available: 0,
                    completed: 0,
                    approvalRate: 0,
                    bestScore: 0,
                },
            };
        }

        const allQuizzes = [];
        const courseIds = enrollments.map((e) => e.courseId);

        for (const courseId of courseIds) {
            const course = await ctx.db.get(courseId);
            if (!course) continue;

            // Get published quizzes for this course
            const quizzes = await ctx.db
                .query("quizzes")
                .withIndex("by_course", (q) => q.eq("courseId", courseId))
                .filter((q) => q.eq(q.field("isPublished"), true))
                .collect();

            for (const quiz of quizzes) {
                // Get questions count
                const questions = await ctx.db
                    .query("quizQuestions")
                    .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
                    .collect();

                // Get user's attempts for this quiz
                const userAttempts = await ctx.db
                    .query("quizAttempts")
                    .filter((q) =>
                        q.and(
                            q.eq(q.field("quizId"), quiz._id),
                            q.eq(q.field("userId"), args.userId)
                        )
                    )
                    .collect();

                // Calculate best score and status
                const bestAttempt = userAttempts.length > 0
                    ? userAttempts.reduce((best, current) =>
                        current.score > best.score ? current : best
                    )
                    : null;

                const lastAttempt = userAttempts.length > 0
                    ? userAttempts.reduce((last, current) =>
                        current.completedAt > last.completedAt ? current : last
                    )
                    : null;

                // Determine status
                let status: "pending" | "passed" | "failed" = "pending";
                if (userAttempts.length > 0) {
                    status = bestAttempt && bestAttempt.score >= quiz.passingScore ? "passed" : "failed";
                }

                // Get lesson name if quiz is associated with a lesson
                let lessonName = null;
                if (quiz.lessonId) {
                    const lesson = await ctx.db.get(quiz.lessonId);
                    lessonName = lesson?.title || null;
                }

                // Format last attempt date
                let lastAttemptFormatted = null;
                if (lastAttempt) {
                    const now = Date.now();
                    const diff = now - lastAttempt.completedAt;
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor(diff / (1000 * 60));

                    if (days > 0) {
                        lastAttemptFormatted = `Há ${days} dia${days > 1 ? "s" : ""}`;
                    } else if (hours > 0) {
                        lastAttemptFormatted = `Há ${hours} hora${hours > 1 ? "s" : ""}`;
                    } else {
                        lastAttemptFormatted = `Há ${minutes} minuto${minutes > 1 ? "s" : ""}`;
                    }
                }

                allQuizzes.push({
                    id: quiz._id,
                    title: quiz.title,
                    courseName: course.title,
                    lessonName,
                    questions: questions.length,
                    timeLimit: quiz.timeLimit ? Math.round(quiz.timeLimit / 60) : null, // Convert to minutes
                    passingScore: quiz.passingScore,
                    attempts: userAttempts.length,
                    bestScore: bestAttempt?.score || null,
                    lastAttempt: lastAttemptFormatted,
                    status,
                    maxAttempts: quiz.maxAttempts || null,
                });
            }
        }

        // Calculate overall stats
        const completedQuizzes = allQuizzes.filter((q) => q.attempts > 0);
        const passedQuizzes = allQuizzes.filter((q) => q.status === "passed");
        const allBestScores = allQuizzes
            .filter((q) => q.bestScore !== null)
            .map((q) => q.bestScore as number);

        return {
            quizzes: allQuizzes,
            stats: {
                available: allQuizzes.length,
                completed: completedQuizzes.length,
                approvalRate: completedQuizzes.length > 0
                    ? Math.round((passedQuizzes.length / completedQuizzes.length) * 100)
                    : 0,
                bestScore: allBestScores.length > 0
                    ? Math.max(...allBestScores)
                    : 0,
            },
        };
    },
});

// Delete quiz
export const remove = mutation({
    args: { quizId: v.id("quizzes") },
    handler: async (ctx, args) => {
        // Delete all questions first
        const questions = await ctx.db
            .query("quizQuestions")
            .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
            .collect();

        for (const question of questions) {
            await ctx.db.delete(question._id);
        }

        // Delete quiz
        await ctx.db.delete(args.quizId);
    },
});

// Get quiz by ID
export const getById = query({
    args: { quizId: v.id("quizzes") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.quizId);
    },
});

// Get questions for a quiz
export const getQuestions = query({
    args: { quizId: v.id("quizzes") },
    handler: async (ctx, args) => {
        const questions = await ctx.db
            .query("quizQuestions")
            .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
            .collect();

        return questions.sort((a, b) => a.order - b.order);
    },
});

// Update question
export const updateQuestion = mutation({
    args: {
        questionId: v.id("quizQuestions"),
        question: v.optional(v.string()),
        options: v.optional(v.array(v.string())),
        correctAnswer: v.optional(v.string()),
        correctAnswers: v.optional(v.array(v.string())),
        matchPairs: v.optional(v.array(v.object({
            prompt: v.string(),
            promptImage: v.optional(v.string()),
            answer: v.string(),
            answerImage: v.optional(v.string()),
        }))),
        correctOrder: v.optional(v.array(v.string())),
        blankPositions: v.optional(v.array(v.number())),
        blankAnswers: v.optional(v.array(v.string())),
        mediaUrl: v.optional(v.string()),
        mediaType: v.optional(v.union(v.literal("audio"), v.literal("video"))),
        points: v.optional(v.number()),
        order: v.optional(v.number()),
        explanation: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { questionId, ...updates } = args;

        // Remove undefined values
        const cleanUpdates: Record<string, any> = {};
        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined) {
                cleanUpdates[key] = value;
            }
        });

        if (Object.keys(cleanUpdates).length > 0) {
            cleanUpdates.updatedAt = Date.now();
            await ctx.db.patch(questionId, cleanUpdates);
        }
    },
});

// Remove (delete) question
export const removeQuestion = mutation({
    args: { questionId: v.id("quizQuestions") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.questionId);
    },
});
