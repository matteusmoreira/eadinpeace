import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get organization settings
export const getSettings = query({
    args: {
        organizationId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        // Verify that the organization exists
        const organization = await ctx.db.get(args.organizationId);
        if (!organization) {
            return null;
        }

        const settings = await ctx.db
            .query("organizationSettings")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .first();

        return settings;
    },
});


// Get Bunny Stream settings (public-safe version without sensitive data)
export const getBunnyConfig = query({
    args: {
        organizationId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        const settings = await ctx.db
            .query("organizationSettings")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .first();

        if (!settings) {
            return {
                isConfigured: false,
                bunnyEnabled: false,
                bunnyLibraryId: null,
                bunnyCdnHostname: null,
                hasApiKey: false,
            };
        }

        return {
            isConfigured: !!(settings.bunnyApiKey && settings.bunnyLibraryId),
            bunnyEnabled: settings.bunnyEnabled ?? false,
            bunnyLibraryId: settings.bunnyLibraryId || null,
            bunnyCdnHostname: settings.bunnyCdnHostname || null,
            hasApiKey: !!settings.bunnyApiKey,
        };
    },
});

// Get full Bunny credentials (for server-side use only)
export const getBunnyCredentials = query({
    args: {
        organizationId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        const settings = await ctx.db
            .query("organizationSettings")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .first();

        if (!settings) {
            return null;
        }

        return {
            apiKey: settings.bunnyApiKey || "",
            libraryId: settings.bunnyLibraryId || "",
            cdnHostname: settings.bunnyCdnHostname || "",
            enabled: settings.bunnyEnabled ?? false,
        };
    },
});

// Create or update organization settings
export const upsertSettings = mutation({
    args: {
        organizationId: v.id("organizations"),
        bunnyApiKey: v.optional(v.string()),
        bunnyLibraryId: v.optional(v.string()),
        bunnyCdnHostname: v.optional(v.string()),
        bunnyEnabled: v.optional(v.boolean()),
        youtubeApiKey: v.optional(v.string()),
        defaultVideoProvider: v.optional(v.union(
            v.literal("youtube"),
            v.literal("bunny"),
            v.literal("upload")
        )),
    },
    handler: async (ctx, args) => {
        const { organizationId, ...updates } = args;
        const now = Date.now();

        // Check if settings exist
        const existing = await ctx.db
            .query("organizationSettings")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .first();

        if (existing) {
            // Update existing settings
            await ctx.db.patch(existing._id, {
                ...updates,
                updatedAt: now,
            });
            return existing._id;
        } else {
            // Create new settings
            const settingsId = await ctx.db.insert("organizationSettings", {
                organizationId,
                ...updates,
                createdAt: now,
                updatedAt: now,
            });
            return settingsId;
        }
    },
});

// Update only Bunny Stream settings
export const updateBunnySettings = mutation({
    args: {
        organizationId: v.id("organizations"),
        bunnyApiKey: v.optional(v.string()),
        bunnyLibraryId: v.optional(v.string()),
        bunnyCdnHostname: v.optional(v.string()),
        bunnyEnabled: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { organizationId, ...bunnySettings } = args;
        const now = Date.now();

        // Check if settings exist
        const existing = await ctx.db
            .query("organizationSettings")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .first();

        if (existing) {
            // Only update bunny-related fields
            await ctx.db.patch(existing._id, {
                ...(bunnySettings.bunnyApiKey !== undefined && { bunnyApiKey: bunnySettings.bunnyApiKey }),
                ...(bunnySettings.bunnyLibraryId !== undefined && { bunnyLibraryId: bunnySettings.bunnyLibraryId }),
                ...(bunnySettings.bunnyCdnHostname !== undefined && { bunnyCdnHostname: bunnySettings.bunnyCdnHostname }),
                ...(bunnySettings.bunnyEnabled !== undefined && { bunnyEnabled: bunnySettings.bunnyEnabled }),
                updatedAt: now,
            });
            return { success: true, updated: true };
        } else {
            // Create new settings with only bunny fields
            await ctx.db.insert("organizationSettings", {
                organizationId,
                bunnyApiKey: bunnySettings.bunnyApiKey,
                bunnyLibraryId: bunnySettings.bunnyLibraryId,
                bunnyCdnHostname: bunnySettings.bunnyCdnHostname,
                bunnyEnabled: bunnySettings.bunnyEnabled ?? false,
                createdAt: now,
                updatedAt: now,
            });
            return { success: true, updated: false };
        }
    },
});

// Test Bunny Stream connection
export const testBunnyConnection = mutation({
    args: {
        apiKey: v.string(),
        libraryId: v.string(),
    },
    handler: async (ctx, args) => {
        // This is a placeholder - actual testing should be done client-side
        // because Convex doesn't support fetch to external APIs in mutations
        // We just validate the format of the inputs
        if (!args.apiKey || args.apiKey.length < 10) {
            return { success: false, error: "API Key inválida" };
        }

        if (!args.libraryId || isNaN(Number(args.libraryId))) {
            return { success: false, error: "Library ID deve ser um número" };
        }

        return { success: true, message: "Formato válido. Faça um upload de teste para confirmar." };
    },
});

// Delete organization settings
export const deleteSettings = mutation({
    args: {
        organizationId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("organizationSettings")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .first();

        if (existing) {
            await ctx.db.delete(existing._id);
            return { success: true };
        }

        return { success: false, error: "Configurações não encontradas" };
    },
});
