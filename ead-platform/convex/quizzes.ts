import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get quiz by lesson
export const getByLesson = query({
    args: { lessonId: v.id("lessons") },
    handler: async (ctx, args) => {
        const quiz = await ctx.db
            .query("quizzes")
            .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
            .first();

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
            v.literal("multiple_choice"),
            v.literal("true_false"),
            v.literal("short_answer")
        ),
        question: v.string(),
        options: v.optional(v.array(v.string())),
        correctAnswer: v.string(),
        explanation: v.optional(v.string()),
        points: v.number(),
    },
    handler: async (ctx, args) => {
        // Get current questions count for order
        const existingQuestions = await ctx.db
            .query("quizQuestions")
            .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
            .collect();

        const now = Date.now();
        return await ctx.db.insert("quizQuestions", {
            ...args,
            order: existingQuestions.length,
            createdAt: now,
            updatedAt: now,
        });
    },
});

// Submit quiz attempt
export const submitAttempt = mutation({
    args: {
        quizId: v.id("quizzes"),
        userId: v.id("users"),
        answers: v.array(v.object({
            questionId: v.id("quizQuestions"),
            answer: v.string(),
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
        const results = [];

        for (const question of questions) {
            totalPoints += question.points;
            const userAnswer = args.answers.find(a => a.questionId === question._id);
            const isCorrect = userAnswer?.answer === question.correctAnswer;

            if (isCorrect) {
                earnedPoints += question.points;
            }

            results.push({
                questionId: question._id,
                userAnswer: userAnswer?.answer || "",
                correctAnswer: question.correctAnswer,
                isCorrect,
                points: isCorrect ? question.points : 0,
            });
        }

        const score = Math.round((earnedPoints / totalPoints) * 100);
        const passed = score >= quiz.passingScore;

        const now = Date.now();
        const attemptId = await ctx.db.insert("quizAttempts", {
            quizId: args.quizId,
            userId: args.userId,
            score,
            passed,
            timeSpent: args.timeSpent,
            answers: results,
            completedAt: now,
        });

        return {
            attemptId,
            score,
            passed,
            earnedPoints,
            totalPoints,
            results,
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

// Update question
export const updateQuestion = mutation({
    args: {
        questionId: v.id("quizQuestions"),
        question: v.optional(v.string()),
        options: v.optional(v.array(v.string())),
        correctAnswer: v.optional(v.string()),
        explanation: v.optional(v.string()),
        points: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { questionId, ...updates } = args;
        await ctx.db.patch(questionId, {
            ...updates,
            updatedAt: Date.now(),
        });
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
