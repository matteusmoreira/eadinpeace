import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Criar questão no banco
export const create = mutation({
    args: {
        organizationId: v.id("organizations"),
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
        defaultPoints: v.number(),
        tags: v.array(v.string()),
        difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Não autenticado");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("Usuário não encontrado");

        const now = Date.now();
        return await ctx.db.insert("questionBank", {
            organizationId: args.organizationId,
            createdBy: user._id,
            type: args.type,
            question: args.question,
            options: args.options,
            correctAnswer: args.correctAnswer,
            correctAnswers: args.correctAnswers,
            matchPairs: args.matchPairs,
            correctOrder: args.correctOrder,
            blankPositions: args.blankPositions,
            blankAnswers: args.blankAnswers,
            mediaUrl: args.mediaUrl,
            mediaType: args.mediaType,
            explanation: args.explanation,
            defaultPoints: args.defaultPoints,
            tags: args.tags,
            difficulty: args.difficulty,
            usageCount: 0,
            createdAt: now,
            updatedAt: now,
        });
    },
});

// Atualizar questão
export const update = mutation({
    args: {
        questionId: v.id("questionBank"),
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
        explanation: v.optional(v.string()),
        defaultPoints: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
        difficulty: v.optional(v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))),
    },
    handler: async (ctx, args) => {
        const { questionId, ...updates } = args;
        await ctx.db.patch(questionId, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

// Remover questão
export const remove = mutation({
    args: { questionId: v.id("questionBank") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.questionId);
    },
});

// Listar questões da organização
export const getByOrganization = query({
    args: {
        organizationId: v.id("organizations"),
        type: v.optional(v.union(
            v.literal("true_false"),
            v.literal("single_choice"),
            v.literal("multiple_choice"),
            v.literal("short_answer"),
            v.literal("text_answer"),
            v.literal("match_following"),
            v.literal("sortable"),
            v.literal("fill_blanks"),
            v.literal("audio_video")
        )),
        difficulty: v.optional(v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))),
        tag: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let questions = await ctx.db
            .query("questionBank")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        // Filtrar por tipo se especificado
        if (args.type) {
            questions = questions.filter((q) => q.type === args.type);
        }

        // Filtrar por dificuldade se especificado
        if (args.difficulty) {
            questions = questions.filter((q) => q.difficulty === args.difficulty);
        }

        // Filtrar por tag se especificado
        if (args.tag) {
            const tagFilter = args.tag;
            questions = questions.filter((q) => q.tags.includes(tagFilter));
        }

        // Enriquecer com informações do criador
        const enrichedQuestions = await Promise.all(
            questions.map(async (question) => {
                const creator = await ctx.db.get(question.createdBy);
                return {
                    ...question,
                    creatorName: creator ? `${creator.firstName} ${creator.lastName}` : "Desconhecido",
                };
            })
        );

        return enrichedQuestions.sort((a, b) => b.createdAt - a.createdAt);
    },
});

// Buscar questão específica
export const getById = query({
    args: { questionId: v.id("questionBank") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.questionId);
    },
});

// Busca avançada
export const search = query({
    args: {
        organizationId: v.id("organizations"),
        searchTerm: v.optional(v.string()),
        searchText: v.optional(v.string()),
        type: v.optional(v.string()),
        types: v.optional(v.array(v.string())),
        difficulty: v.optional(v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))),
        difficulties: v.optional(v.array(v.string())),
        tags: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        let questions = await ctx.db
            .query("questionBank")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        // Busca por texto (suporta searchTerm ou searchText)
        const searchQuery = args.searchTerm || args.searchText;
        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            questions = questions.filter((q) =>
                q.question.toLowerCase().includes(searchLower)
            );
        }

        // Filtrar por tipo único
        if (args.type) {
            questions = questions.filter((q) => q.type === args.type);
        }

        // Filtrar por tipos múltiplos
        if (args.types && args.types.length > 0) {
            questions = questions.filter((q) => args.types!.includes(q.type));
        }

        // Filtrar por dificuldade única
        if (args.difficulty) {
            questions = questions.filter((q) => q.difficulty === args.difficulty);
        }

        // Filtrar por dificuldades múltiplas
        if (args.difficulties && args.difficulties.length > 0) {
            questions = questions.filter((q) => args.difficulties!.includes(q.difficulty));
        }

        // Filtrar por tags
        if (args.tags && args.tags.length > 0) {
            questions = questions.filter((q) =>
                args.tags!.some((tag) => q.tags.includes(tag))
            );
        }

        return questions.sort((a, b) => b.createdAt - a.createdAt);
    },
});

// Importar questão do banco para um quiz
export const importToQuiz = mutation({
    args: {
        questionBankId: v.id("questionBank"),
        quizId: v.id("quizzes"),
        points: v.optional(v.number()), // Sobrescrever pontuação padrão
    },
    handler: async (ctx, args) => {
        const question = await ctx.db.get(args.questionBankId);
        if (!question) throw new Error("Questão não encontrada");

        // Contar questões existentes para definir ordem
        const existingQuestions = await ctx.db
            .query("quizQuestions")
            .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
            .collect();

        const now = Date.now();
        const questionId = await ctx.db.insert("quizQuestions", {
            quizId: args.quizId,
            questionBankId: args.questionBankId,
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
            points: args.points ?? question.defaultPoints,
            order: existingQuestions.length,
            requiresManualGrading: question.type === "text_answer",
            createdAt: now,
            updatedAt: now,
        });

        // Incrementar contador de uso
        await ctx.db.patch(args.questionBankId, {
            usageCount: question.usageCount + 1,
        });

        return questionId;
    },
});

// Estatísticas do banco
export const getStats = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const questions = await ctx.db
            .query("questionBank")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const stats = {
            total: questions.length,
            byType: {} as Record<string, number>,
            byDifficulty: {
                easy: 0,
                medium: 0,
                hard: 0,
            },
            mostUsed: [] as any[],
        };

        questions.forEach((q) => {
            // Por tipo
            stats.byType[q.type] = (stats.byType[q.type] || 0) + 1;

            // Por dificuldade
            stats.byDifficulty[q.difficulty]++;
        });

        // Questões mais usadas (top 10)
        stats.mostUsed = questions
            .filter((q) => q.usageCount > 0)
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 10)
            .map((q) => ({
                id: q._id,
                question: q.question.substring(0, 100),
                type: q.type,
                usageCount: q.usageCount,
            }));

        return stats;
    },
});
