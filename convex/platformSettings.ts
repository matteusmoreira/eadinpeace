import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all platform settings
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        const settings = await ctx.db.query("platformSettings").collect();

        // Convert array to object by key
        const settingsMap: Record<string, any> = {};
        for (const setting of settings) {
            settingsMap[setting.key] = setting;
        }

        return settingsMap;
    },
});

// Get settings by key
export const getByKey = query({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("platformSettings")
            .withIndex("by_key", (q) => q.eq("key", args.key))
            .first();
    },
});

// Update or create general settings
export const updateGeneral = mutation({
    args: {
        platformName: v.optional(v.string()),
        platformUrl: v.optional(v.string()),
        supportEmail: v.optional(v.string()),
        maxFileSize: v.optional(v.number()),
        enableRegistration: v.optional(v.boolean()),
        maintenanceMode: v.optional(v.boolean()),
        userId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const { userId, ...updates } = args;
        const existing = await ctx.db
            .query("platformSettings")
            .withIndex("by_key", (q) => q.eq("key", "general"))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...updates,
                updatedAt: Date.now(),
                updatedBy: userId,
            });
        } else {
            await ctx.db.insert("platformSettings", {
                key: "general",
                ...updates,
                updatedAt: Date.now(),
                updatedBy: userId,
            });
        }
    },
});

// Update or create email settings
export const updateEmail = mutation({
    args: {
        smtpHost: v.optional(v.string()),
        smtpPort: v.optional(v.string()),
        smtpUser: v.optional(v.string()),
        smtpPassword: v.optional(v.string()),
        fromEmail: v.optional(v.string()),
        fromName: v.optional(v.string()),
        enableEmailNotifications: v.optional(v.boolean()),
        userId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const { userId, ...updates } = args;
        const existing = await ctx.db
            .query("platformSettings")
            .withIndex("by_key", (q) => q.eq("key", "email"))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...updates,
                updatedAt: Date.now(),
                updatedBy: userId,
            });
        } else {
            await ctx.db.insert("platformSettings", {
                key: "email",
                ...updates,
                updatedAt: Date.now(),
                updatedBy: userId,
            });
        }
    },
});

// Update or create payment settings
export const updatePayment = mutation({
    args: {
        stripePublicKey: v.optional(v.string()),
        stripeSecretKey: v.optional(v.string()),
        enablePayments: v.optional(v.boolean()),
        currency: v.optional(v.string()),
        userId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const { userId, ...updates } = args;
        const existing = await ctx.db
            .query("platformSettings")
            .withIndex("by_key", (q) => q.eq("key", "payment"))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...updates,
                updatedAt: Date.now(),
                updatedBy: userId,
            });
        } else {
            await ctx.db.insert("platformSettings", {
                key: "payment",
                ...updates,
                updatedAt: Date.now(),
                updatedBy: userId,
            });
        }
    },
});

// Update or create security settings
export const updateSecurity = mutation({
    args: {
        enable2FA: v.optional(v.boolean()),
        sessionTimeout: v.optional(v.number()),
        maxLoginAttempts: v.optional(v.number()),
        passwordMinLength: v.optional(v.number()),
        requireUppercase: v.optional(v.boolean()),
        requireNumbers: v.optional(v.boolean()),
        userId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const { userId, ...updates } = args;
        const existing = await ctx.db
            .query("platformSettings")
            .withIndex("by_key", (q) => q.eq("key", "security"))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...updates,
                updatedAt: Date.now(),
                updatedBy: userId,
            });
        } else {
            await ctx.db.insert("platformSettings", {
                key: "security",
                ...updates,
                updatedAt: Date.now(),
                updatedBy: userId,
            });
        }
    },
});

// Update or create appearance settings
export const updateAppearance = mutation({
    args: {
        primaryColor: v.optional(v.string()),
        secondaryColor: v.optional(v.string()),
        theme: v.optional(v.string()),
        font: v.optional(v.string()),
        enableDarkMode: v.optional(v.boolean()),
        enableAnimations: v.optional(v.boolean()),
        borderRadius: v.optional(v.string()),
        logoUrl: v.optional(v.string()),
        faviconUrl: v.optional(v.string()),
        logoStorageId: v.optional(v.id("_storage")),
        faviconStorageId: v.optional(v.id("_storage")),
        userId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const { userId, logoStorageId, faviconStorageId, ...updates } = args;

        // Resolve storage IDs to URLs if provided
        if (logoStorageId) {
            const url = await ctx.storage.getUrl(logoStorageId);
            if (url) {
                updates.logoUrl = url;
            }
        }

        if (faviconStorageId) {
            const url = await ctx.storage.getUrl(faviconStorageId);
            if (url) {
                updates.faviconUrl = url;
            }
        }

        const existing = await ctx.db
            .query("platformSettings")
            .withIndex("by_key", (q) => q.eq("key", "appearance"))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...updates,
                updatedAt: Date.now(),
                updatedBy: userId,
            });
        } else {
            await ctx.db.insert("platformSettings", {
                key: "appearance",
                ...updates,
                updatedAt: Date.now(),
                updatedBy: userId,
            });
        }
    },
});
