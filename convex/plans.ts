import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all subscription plans
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("subscriptionPlans").collect();
    },
});

// Get plan by ID
export const getById = query({
    args: { planId: v.id("subscriptionPlans") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.planId);
    },
});

// Create subscription plan
export const create = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        price: v.number(),
        interval: v.union(v.literal("monthly"), v.literal("yearly")),
        maxUsers: v.number(),
        maxCourses: v.number(),
        features: v.array(v.string()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        return await ctx.db.insert("subscriptionPlans", {
            name: args.name,
            description: args.description,
            price: args.price,
            interval: args.interval,
            maxUsers: args.maxUsers,
            maxCourses: args.maxCourses,
            features: args.features,
            isActive: args.isActive ?? true,
            createdAt: now,
            updatedAt: now,
        });
    },
});

// Update subscription plan
export const update = mutation({
    args: {
        planId: v.id("subscriptionPlans"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        price: v.optional(v.number()),
        interval: v.optional(v.union(v.literal("monthly"), v.literal("yearly"))),
        maxUsers: v.optional(v.number()),
        maxCourses: v.optional(v.number()),
        features: v.optional(v.array(v.string())),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { planId, ...updates } = args;

        // Remove undefined values
        const cleanUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        await ctx.db.patch(planId, {
            ...cleanUpdates,
            updatedAt: Date.now(),
        });
    },
});

// Delete subscription plan
export const remove = mutation({
    args: { planId: v.id("subscriptionPlans") },
    handler: async (ctx, args) => {
        // Check if any organization is using this plan
        const subscriptions = await ctx.db
            .query("subscriptions")
            .filter((q) => q.eq(q.field("planId"), args.planId))
            .collect();

        if (subscriptions.length > 0) {
            throw new Error("Este plano está em uso por organizações. Desative-o ao invés de excluir.");
        }

        await ctx.db.delete(args.planId);
    },
});

// Initialize default plans
export const initializeDefaults = mutation({
    args: {},
    handler: async (ctx) => {
        const existing = await ctx.db.query("subscriptionPlans").first();
        if (existing) return { message: "Planos já inicializados" };

        const now = Date.now();
        const plans = [
            {
                name: "Starter",
                description: "Ideal para pequenas igrejas e ministérios",
                price: 9700, // R$ 97,00 em centavos
                interval: "monthly" as const,
                maxUsers: 50,
                maxCourses: 10,
                features: [
                    "Até 50 usuários",
                    "Até 10 cursos",
                    "Armazenamento 5GB",
                    "Suporte por email",
                ],
                isActive: true,
            },
            {
                name: "Professional",
                description: "Para igrejas em crescimento",
                price: 19700, // R$ 197,00 em centavos
                interval: "monthly" as const,
                maxUsers: 200,
                maxCourses: 50,
                features: [
                    "Até 200 usuários",
                    "Até 50 cursos",
                    "Armazenamento 20GB",
                    "Suporte prioritário",
                    "Certificados personalizados",
                    "Relatórios avançados",
                ],
                isActive: true,
            },
            {
                name: "Enterprise",
                description: "Para grandes organizações",
                price: 49700, // R$ 497,00 em centavos
                interval: "monthly" as const,
                maxUsers: 9999,
                maxCourses: 9999,
                features: [
                    "Usuários ilimitados",
                    "Cursos ilimitados",
                    "Armazenamento 100GB",
                    "Suporte 24/7",
                    "Certificados personalizados",
                    "Relatórios avançados",
                    "API de integração",
                ],
                isActive: true,
            },
        ];

        for (const plan of plans) {
            await ctx.db.insert("subscriptionPlans", {
                ...plan,
                createdAt: now,
                updatedAt: now,
            });
        }

        return { message: "Planos padrão criados com sucesso", count: plans.length };
    },
});

// Get plan stats (organizations using each plan)
export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const plans = await ctx.db.query("subscriptionPlans").collect();
        const subscriptions = await ctx.db.query("subscriptions").collect();

        return plans.map((plan) => {
            const planSubscriptions = subscriptions.filter(
                (s) => s.planId === plan._id && s.status === "active"
            );
            return {
                ...plan,
                activeSubscriptions: planSubscriptions.length,
            };
        });
    },
});
