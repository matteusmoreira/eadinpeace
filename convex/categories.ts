import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all categories for an organization
export const getByOrganization = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("courseCategories")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();
    },
});

// Create category
export const create = mutation({
    args: {
        organizationId: v.id("organizations"),
        name: v.string(),
        description: v.optional(v.string()),
        color: v.optional(v.string()),
        icon: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Get max order
        const existingCategories = await ctx.db
            .query("courseCategories")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const now = Date.now();
        return await ctx.db.insert("courseCategories", {
            ...args,
            order: existingCategories.length,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });
    },
});

// Update category
export const update = mutation({
    args: {
        categoryId: v.id("courseCategories"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        color: v.optional(v.string()),
        icon: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { categoryId, ...updates } = args;

        // Remove undefined values
        const cleanUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        await ctx.db.patch(categoryId, {
            ...cleanUpdates,
            updatedAt: Date.now(),
        });
    },
});

// Delete category
export const remove = mutation({
    args: { categoryId: v.id("courseCategories") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.categoryId);
    },
});

// Seed default categories for an organization
export const seedDefaults = mutation({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const existingCategories = await ctx.db
            .query("courseCategories")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        if (existingCategories.length > 0) {
            return { created: 0, message: "Categorias já existem" };
        }

        const defaultCategories = [
            { name: "Teologia", color: "#8B5CF6", icon: "📖" },
            { name: "Bíblia", color: "#10B981", icon: "📜" },
            { name: "Liderança", color: "#F59E0B", icon: "👑" },
            { name: "Discipulado", color: "#3B82F6", icon: "🤝" },
            { name: "Missões", color: "#EF4444", icon: "🌍" },
            { name: "Louvor e Adoração", color: "#EC4899", icon: "🎵" },
            { name: "Família", color: "#14B8A6", icon: "👨‍👩‍👧‍👦" },
            { name: "Aconselhamento", color: "#8B5CF6", icon: "💬" },
            { name: "Evangelismo", color: "#F97316", icon: "📢" },
            { name: "Ministério Infantil", color: "#84CC16", icon: "🧒" },
            { name: "Juventude", color: "#06B6D4", icon: "🎯" },
            { name: "Outros", color: "#6B7280", icon: "📚" },
        ];

        const now = Date.now();
        for (let i = 0; i < defaultCategories.length; i++) {
            await ctx.db.insert("courseCategories", {
                organizationId: args.organizationId,
                name: defaultCategories[i].name,
                color: defaultCategories[i].color,
                icon: defaultCategories[i].icon,
                order: i,
                isActive: true,
                createdAt: now,
                updatedAt: now,
            });
        }

        return { created: defaultCategories.length, message: "Categorias criadas com sucesso" };
    },
});
