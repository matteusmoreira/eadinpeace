import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Elemento do template
const elementValidator = v.object({
    id: v.string(),
    type: v.union(
        v.literal("text"),
        v.literal("image"),
        v.literal("shape"),
        v.literal("qrcode"),
        v.literal("signature")
    ),
    x: v.number(),
    y: v.number(),
    width: v.number(),
    height: v.number(),
    rotation: v.optional(v.number()),
    content: v.optional(v.string()),
    fontSize: v.optional(v.number()),
    fontFamily: v.optional(v.string()),
    fontWeight: v.optional(v.string()),
    textAlign: v.optional(v.string()),
    color: v.optional(v.string()),
    src: v.optional(v.string()),
    fill: v.optional(v.string()),
    stroke: v.optional(v.string()),
    strokeWidth: v.optional(v.number()),
    borderRadius: v.optional(v.number()),
    opacity: v.optional(v.number()),
    shapeType: v.optional(v.union(
        v.literal("rectangle"),
        v.literal("circle"),
        v.literal("line")
    )),
});

// Get template by ID
export const getById = query({
    args: { templateId: v.id("certificateTemplates") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db.get(args.templateId);
    },
});

// Get templates by organization
export const getByOrganization = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const templates = await ctx.db
            .query("certificateTemplates")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        return templates.sort((a, b) => b.createdAt - a.createdAt);
    },
});

// Get default template for organization
export const getDefault = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const template = await ctx.db
            .query("certificateTemplates")
            .withIndex("by_default", (q) =>
                q.eq("organizationId", args.organizationId).eq("isDefault", true)
            )
            .first();

        return template;
    },
});

// Create new template
export const create = mutation({
    args: {
        organizationId: v.id("organizations"),
        name: v.string(),
        description: v.optional(v.string()),
        isDefault: v.optional(v.boolean()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        backgroundColor: v.optional(v.string()),
        backgroundImage: v.optional(v.string()),
        elements: v.optional(v.array(elementValidator)),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        // Get current user
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) {
            throw new Error("Usuário não encontrado");
        }

        // If this is the first template or isDefault is true, set as default
        const existingTemplates = await ctx.db
            .query("certificateTemplates")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const shouldBeDefault = args.isDefault || existingTemplates.length === 0;

        // If setting as default, unset other defaults
        if (shouldBeDefault) {
            for (const template of existingTemplates) {
                if (template.isDefault) {
                    await ctx.db.patch(template._id, { isDefault: false });
                }
            }
        }

        const now = Date.now();

        return await ctx.db.insert("certificateTemplates", {
            organizationId: args.organizationId,
            name: args.name,
            description: args.description,
            isDefault: shouldBeDefault,
            width: args.width || 1056,
            height: args.height || 816,
            backgroundColor: args.backgroundColor || "#ffffff",
            backgroundImage: args.backgroundImage,
            elements: args.elements || [],
            createdBy: user._id,
            createdAt: now,
            updatedAt: now,
        });
    },
});

// Update template
export const update = mutation({
    args: {
        templateId: v.id("certificateTemplates"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        backgroundColor: v.optional(v.string()),
        backgroundImage: v.optional(v.string()),
        elements: v.optional(v.array(elementValidator)),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const template = await ctx.db.get(args.templateId);
        if (!template) {
            throw new Error("Template não encontrado");
        }

        const updates: any = { updatedAt: Date.now() };

        if (args.name !== undefined) updates.name = args.name;
        if (args.description !== undefined) updates.description = args.description;
        if (args.width !== undefined) updates.width = args.width;
        if (args.height !== undefined) updates.height = args.height;
        if (args.backgroundColor !== undefined) updates.backgroundColor = args.backgroundColor;
        if (args.backgroundImage !== undefined) updates.backgroundImage = args.backgroundImage;
        if (args.elements !== undefined) updates.elements = args.elements;

        await ctx.db.patch(args.templateId, updates);

        return args.templateId;
    },
});

// Set template as default
export const setAsDefault = mutation({
    args: { templateId: v.id("certificateTemplates") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const template = await ctx.db.get(args.templateId);
        if (!template) {
            throw new Error("Template não encontrado");
        }

        // Unset other defaults in the same organization
        const templates = await ctx.db
            .query("certificateTemplates")
            .withIndex("by_organization", (q) => q.eq("organizationId", template.organizationId))
            .collect();

        for (const t of templates) {
            if (t.isDefault && t._id !== args.templateId) {
                await ctx.db.patch(t._id, { isDefault: false });
            }
        }

        // Set this one as default
        await ctx.db.patch(args.templateId, { isDefault: true, updatedAt: Date.now() });

        return args.templateId;
    },
});

// Duplicate template
export const duplicate = mutation({
    args: { templateId: v.id("certificateTemplates") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) {
            throw new Error("Usuário não encontrado");
        }

        const template = await ctx.db.get(args.templateId);
        if (!template) {
            throw new Error("Template não encontrado");
        }

        const now = Date.now();

        return await ctx.db.insert("certificateTemplates", {
            organizationId: template.organizationId,
            name: `${template.name} (Cópia)`,
            description: template.description,
            isDefault: false,
            width: template.width,
            height: template.height,
            backgroundColor: template.backgroundColor,
            backgroundImage: template.backgroundImage,
            elements: template.elements,
            createdBy: user._id,
            createdAt: now,
            updatedAt: now,
        });
    },
});

// Delete template
export const remove = mutation({
    args: { templateId: v.id("certificateTemplates") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const template = await ctx.db.get(args.templateId);
        if (!template) {
            throw new Error("Template não encontrado");
        }

        // If deleting default, set another as default if exists
        if (template.isDefault) {
            const otherTemplates = await ctx.db
                .query("certificateTemplates")
                .withIndex("by_organization", (q) => q.eq("organizationId", template.organizationId))
                .collect();

            const other = otherTemplates.find((t) => t._id !== args.templateId);
            if (other) {
                await ctx.db.patch(other._id, { isDefault: true });
            }
        }

        await ctx.db.delete(args.templateId);

        return args.templateId;
    },
});
