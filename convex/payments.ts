import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireAuthWithOrg, requireRole } from "./authHelpers";

// Buscar planos disponíveis
export const getPlans = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("subscriptionPlans").collect();
    },
});

// Buscar plano por ID
export const getPlanById = query({
    args: {
        planId: v.id("subscriptionPlans"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.planId);
    },
});

// Criar plano de assinatura (superadmin)
export const createPlan = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        price: v.number(),
        interval: v.union(v.literal("monthly"), v.literal("yearly")),
        maxUsers: v.number(),
        maxCourses: v.number(),
        features: v.array(v.string()),
        isActive: v.boolean(),
    },
    handler: async (ctx, args) => {
        await requireRole(ctx, ["superadmin"]);
        return await ctx.db.insert("subscriptionPlans", {
            ...args,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// Atualizar plano
export const updatePlan = mutation({
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
        await requireRole(ctx, ["superadmin"]);
        const { planId, ...updates } = args;
        await ctx.db.patch(planId, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

// Buscar assinatura de uma organização
export const getSubscriptionByOrganization = query({
    args: {
        organizationId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuthWithOrg(ctx, args.organizationId);
        if (auth.user.role !== "superadmin" && auth.user.role !== "admin") {
            throw new Error("Acesso negado");
        }

        const subscription = await ctx.db
            .query("subscriptions")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .first();

        if (!subscription) return null;

        const plan = await ctx.db.get(subscription.planId);

        return {
            ...subscription,
            plan,
        };
    },
});

// Criar assinatura
export const createSubscription = mutation({
    args: {
        organizationId: v.id("organizations"),
        planId: v.id("subscriptionPlans"),
        paymentMethod: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuthWithOrg(ctx, args.organizationId);
        if (auth.user.role !== "superadmin" && auth.user.role !== "admin") {
            throw new Error("Acesso negado");
        }

        const plan = await ctx.db.get(args.planId);
        if (!plan) throw new Error("Plano não encontrado");

        // Calcular data de expiração
        const now = Date.now();
        const periodEnd = plan.interval === "yearly"
            ? now + 365 * 24 * 60 * 60 * 1000
            : now + 30 * 24 * 60 * 60 * 1000;

        // Verificar se já existe assinatura
        const existing = await ctx.db
            .query("subscriptions")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .first();

        if (existing) {
            // Atualizar assinatura existente
            await ctx.db.patch(existing._id, {
                planId: args.planId,
                status: "active",
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: false,
                updatedAt: now,
            });
            return existing._id;
        }

        // Criar nova assinatura
        return await ctx.db.insert("subscriptions", {
            organizationId: args.organizationId,
            planId: args.planId,
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
            stripeSubscriptionId: null,
            stripeCustomerId: null,
            createdAt: now,
            updatedAt: now,
        });
    },
});

// Cancelar assinatura
export const cancelSubscription = mutation({
    args: {
        subscriptionId: v.id("subscriptions"),
        immediately: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx);
        if (auth.user.role !== "superadmin" && auth.user.role !== "admin") {
            throw new Error("Acesso negado");
        }

        const subscription = await ctx.db.get(args.subscriptionId);
        if (!subscription) {
            throw new Error("Assinatura não encontrada");
        }

        if (auth.user.role !== "superadmin" && auth.user.organizationId !== subscription.organizationId) {
            throw new Error("Acesso negado");
        }

        if (args.immediately) {
            await ctx.db.patch(args.subscriptionId, {
                status: "canceled",
                cancelAtPeriodEnd: false,
                updatedAt: Date.now(),
            });
        } else {
            await ctx.db.patch(args.subscriptionId, {
                cancelAtPeriodEnd: true,
                updatedAt: Date.now(),
            });
        }
    },
});

// Registrar transação
export const createTransaction = mutation({
    args: {
        organizationId: v.id("organizations"),
        subscriptionId: v.optional(v.id("subscriptions")),
        amount: v.number(),
        currency: v.string(),
        type: v.union(v.literal("payment"), v.literal("refund")),
        status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
        description: v.string(),
        stripePaymentIntentId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuthWithOrg(ctx, args.organizationId);
        if (auth.user.role !== "superadmin" && auth.user.role !== "admin") {
            throw new Error("Acesso negado");
        }

        return await ctx.db.insert("transactions", {
            ...args,
            createdAt: Date.now(),
        });
    },
});

// Buscar transações de uma organização
export const getTransactionsByOrganization = query({
    args: {
        organizationId: v.id("organizations"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuthWithOrg(ctx, args.organizationId);
        if (auth.user.role !== "superadmin" && auth.user.role !== "admin") {
            throw new Error("Acesso negado");
        }

        const query = ctx.db
            .query("transactions")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .order("desc");

        const transactions = args.limit
            ? await query.take(args.limit)
            : await query.collect();

        return transactions;
    },
});

// Buscar todas as transações (superadmin)
export const getAllTransactions = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await requireRole(ctx, ["superadmin"]);
        const transactions = await ctx.db
            .query("transactions")
            .order("desc")
            .take(args.limit || 100);

        // Adicionar nome da organização
        return await Promise.all(
            transactions.map(async (t) => {
                const org = await ctx.db.get(t.organizationId);
                return {
                    ...t,
                    organizationName: org?.name || "Desconhecida",
                };
            })
        );
    },
});

// Resumo financeiro (superadmin)
export const getFinancialSummary = query({
    args: {},
    handler: async (ctx) => {
        await requireRole(ctx, ["superadmin"]);
        const transactions = await ctx.db.query("transactions").collect();
        const subscriptions = await ctx.db.query("subscriptions").collect();

        const now = Date.now();
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

        // Receita total
        const totalRevenue = transactions
            .filter(t => t.type === "payment" && t.status === "completed")
            .reduce((sum, t) => sum + t.amount, 0);

        // Receita últimos 30 dias
        const recentRevenue = transactions
            .filter(t =>
                t.type === "payment" &&
                t.status === "completed" &&
                t.createdAt > thirtyDaysAgo
            )
            .reduce((sum, t) => sum + t.amount, 0);

        // Assinaturas ativas
        const activeSubscriptions = subscriptions.filter(s =>
            s.status === "active" &&
            s.currentPeriodEnd > now
        ).length;

        // Receita por mês (últimos 6 meses)
        const sixMonthsAgo = now - 6 * 30 * 24 * 60 * 60 * 1000;
        const revenueByMonth = transactions
            .filter(t =>
                t.type === "payment" &&
                t.status === "completed" &&
                t.createdAt > sixMonthsAgo
            )
            .reduce((acc, t) => {
                const month = new Date(t.createdAt).toISOString().slice(0, 7);
                acc[month] = (acc[month] || 0) + t.amount;
                return acc;
            }, {} as Record<string, number>);

        const revenueTrend = Object.entries(revenueByMonth)
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => a.month.localeCompare(b.month));

        return {
            totalRevenue,
            recentRevenue,
            activeSubscriptions,
            totalTransactions: transactions.length,
            revenueTrend,
        };
    },
});
