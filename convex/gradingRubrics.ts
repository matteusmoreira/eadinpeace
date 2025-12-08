import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Criar rubrica
export const create = mutation({
    args: {
        organizationId: v.id("organizations"),
        name: v.string(),
        description: v.string(),
        isDefault: v.boolean(),
        criteria: v.array(v.object({
            name: v.string(),
            description: v.string(),
            maxPoints: v.number(),
            levels: v.array(v.object({
                label: v.string(),
                points: v.number(),
                description: v.string(),
            })),
        })),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Não autenticado");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("Usuário não encontrado");

        // Se for padrão, remover flag de outras rubricas
        if (args.isDefault) {
            const existingRubrics = await ctx.db
                .query("gradingRubrics")
                .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
                .collect();

            for (const rubric of existingRubrics) {
                if (rubric.isDefault) {
                    await ctx.db.patch(rubric._id, { isDefault: false });
                }
            }
        }

        const now = Date.now();
        return await ctx.db.insert("gradingRubrics", {
            organizationId: args.organizationId,
            name: args.name,
            description: args.description,
            isDefault: args.isDefault,
            criteria: args.criteria,
            createdBy: user._id,
            createdAt: now,
            updatedAt: now,
        });
    },
});

// Atualizar rubrica
export const update = mutation({
    args: {
        rubricId: v.id("gradingRubrics"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        isDefault: v.optional(v.boolean()),
        criteria: v.optional(v.array(v.object({
            name: v.string(),
            description: v.string(),
            maxPoints: v.number(),
            levels: v.array(v.object({
                label: v.string(),
                points: v.number(),
                description: v.string(),
            })),
        }))),
    },
    handler: async (ctx, args) => {
        const { rubricId, ...updates } = args;

        // Se estiver definindo como padrão, remover flag de outras
        if (updates.isDefault) {
            const rubric = await ctx.db.get(rubricId);
            if (rubric) {
                const existingRubrics = await ctx.db
                    .query("gradingRubrics")
                    .withIndex("by_organization", (q) => q.eq("organizationId", rubric.organizationId))
                    .collect();

                for (const r of existingRubrics) {
                    if (r._id !== rubricId && r.isDefault) {
                        await ctx.db.patch(r._id, { isDefault: false });
                    }
                }
            }
        }

        await ctx.db.patch(rubricId, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

// Remover rubrica
export const remove = mutation({
    args: { rubricId: v.id("gradingRubrics") },
    handler: async (ctx, args) => {
        const rubric = await ctx.db.get(args.rubricId);
        if (rubric?.isDefault) {
            throw new Error("Não é possível remover a rubrica padrão. Defina outra como padrão primeiro.");
        }
        await ctx.db.delete(args.rubricId);
    },
});

// Listar rubricas da organização
export const getByOrganization = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const rubrics = await ctx.db
            .query("gradingRubrics")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        // Enriquecer com informações do criador
        const enrichedRubrics = await Promise.all(
            rubrics.map(async (rubric) => {
                const creator = await ctx.db.get(rubric.createdBy);
                return {
                    ...rubric,
                    creatorName: creator ? `${creator.firstName} ${creator.lastName}` : "Desconhecido",
                };
            })
        );

        return enrichedRubrics.sort((a, b) => {
            // Padrão primeiro
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;
            return b.createdAt - a.createdAt;
        });
    },
});

// Buscar rubrica padrão
export const getDefault = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("gradingRubrics")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .filter((q) => q.eq(q.field("isDefault"), true))
            .first();
    },
});

// Definir rubrica como padrão
export const setAsDefault = mutation({
    args: { rubricId: v.id("gradingRubrics") },
    handler: async (ctx, args) => {
        const rubric = await ctx.db.get(args.rubricId);
        if (!rubric) throw new Error("Rubrica não encontrada");

        // Remover flag de outras rubricas
        const existingRubrics = await ctx.db
            .query("gradingRubrics")
            .withIndex("by_organization", (q) => q.eq("organizationId", rubric.organizationId))
            .collect();

        for (const r of existingRubrics) {
            if (r._id !== args.rubricId && r.isDefault) {
                await ctx.db.patch(r._id, { isDefault: false });
            }
        }

        // Definir como padrão
        await ctx.db.patch(args.rubricId, {
            isDefault: true,
            updatedAt: Date.now(),
        });
    },
});

// Buscar rubrica específica
export const getById = query({
    args: { rubricId: v.id("gradingRubrics") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.rubricId);
    },
});

// Criar rubrica padrão para uma organização (chamado ao criar org)
export const createDefaultRubric = mutation({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Não autenticado");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("Usuário não encontrado");

        const now = Date.now();
        return await ctx.db.insert("gradingRubrics", {
            organizationId: args.organizationId,
            name: "Rubrica Padrão",
            description: "Rubrica de avaliação padrão para questões dissertativas",
            isDefault: true,
            criteria: [
                {
                    name: "Compreensão do Conteúdo",
                    description: "Demonstra entendimento do assunto",
                    maxPoints: 40,
                    levels: [
                        {
                            label: "Excelente",
                            points: 40,
                            description: "Demonstra compreensão completa e profunda",
                        },
                        {
                            label: "Bom",
                            points: 30,
                            description: "Demonstra boa compreensão com pequenas lacunas",
                        },
                        {
                            label: "Regular",
                            points: 20,
                            description: "Demonstra compreensão básica com várias lacunas",
                        },
                        {
                            label: "Insuficiente",
                            points: 10,
                            description: "Demonstra pouca ou nenhuma compreensão",
                        },
                    ],
                },
                {
                    name: "Clareza e Organização",
                    description: "Apresenta ideias de forma clara e organizada",
                    maxPoints: 30,
                    levels: [
                        {
                            label: "Excelente",
                            points: 30,
                            description: "Texto muito claro, bem estruturado e coeso",
                        },
                        {
                            label: "Bom",
                            points: 22,
                            description: "Texto claro e organizado com pequenos problemas",
                        },
                        {
                            label: "Regular",
                            points: 15,
                            description: "Texto com problemas de clareza e organização",
                        },
                        {
                            label: "Insuficiente",
                            points: 8,
                            description: "Texto confuso e desorganizado",
                        },
                    ],
                },
                {
                    name: "Uso de Exemplos",
                    description: "Utiliza exemplos relevantes para ilustrar pontos",
                    maxPoints: 20,
                    levels: [
                        {
                            label: "Excelente",
                            points: 20,
                            description: "Exemplos muito relevantes e bem aplicados",
                        },
                        {
                            label: "Bom",
                            points: 15,
                            description: "Bons exemplos com aplicação adequada",
                        },
                        {
                            label: "Regular",
                            points: 10,
                            description: "Exemplos básicos ou pouco relevantes",
                        },
                        {
                            label: "Insuficiente",
                            points: 5,
                            description: "Sem exemplos ou exemplos inadequados",
                        },
                    ],
                },
                {
                    name: "Completude da Resposta",
                    description: "Responde completamente à questão proposta",
                    maxPoints: 10,
                    levels: [
                        {
                            label: "Completa",
                            points: 10,
                            description: "Responde a todos os aspectos da questão",
                        },
                        {
                            label: "Parcial",
                            points: 6,
                            description: "Responde a maioria dos aspectos",
                        },
                        {
                            label: "Incompleta",
                            points: 3,
                            description: "Responde apenas alguns aspectos",
                        },
                        {
                            label: "Muito Incompleta",
                            points: 0,
                            description: "Não responde adequadamente",
                        },
                    ],
                },
            ],
            createdBy: user._id,
            createdAt: now,
            updatedAt: now,
        });
    },
});
