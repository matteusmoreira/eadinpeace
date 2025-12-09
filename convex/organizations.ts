import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all organizations
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const orgs = await ctx.db.query("organizations").collect();

        // Enrich with user counts
        const enrichedOrgs = await Promise.all(
            orgs.map(async (org) => {
                const users = await ctx.db
                    .query("users")
                    .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
                    .collect();

                const courses = await ctx.db
                    .query("courses")
                    .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
                    .collect();

                return {
                    ...org,
                    userCount: users.length,
                    courseCount: courses.length,
                    adminCount: users.filter((u) => u.role === "admin").length,
                };
            })
        );

        return enrichedOrgs;
    },
});

// Get organization by ID
export const getById = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        return await ctx.db.get(args.organizationId);
    },
});

// Get organization by slug
export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        return await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
    },
});

// Get organization by Clerk org ID
export const getByClerkOrgId = query({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        return await ctx.db
            .query("organizations")
            .withIndex("by_clerk_org", (q) => q.eq("clerkOrgId", args.clerkOrgId))
            .first();
    },
});

// Create organization
export const create = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        logo: v.optional(v.string()),
        primaryColor: v.optional(v.string()),
        plan: v.union(v.literal("starter"), v.literal("professional"), v.literal("enterprise")),
        maxUsers: v.optional(v.number()), // Optional: override plan defaults
        maxCourses: v.optional(v.number()), // Optional: override plan defaults
        clerkOrgId: v.optional(v.string()),
        // Optional: Create admin user at same time
        adminEmail: v.optional(v.string()),
        adminFirstName: v.optional(v.string()),
        adminLastName: v.optional(v.string()),
        adminClerkId: v.optional(v.string()), // Clerk ID do admin (se já criado)
    },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const now = Date.now();

        // Check if slug already exists
        const existingOrg = await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();

        if (existingOrg) {
            throw new Error("Slug já existe");
        }

        // Set limits based on plan (defaults) or use provided values
        const planLimits = {
            starter: { maxUsers: 50, maxCourses: 10 },
            professional: { maxUsers: 500, maxCourses: 50 },
            enterprise: { maxUsers: 10000, maxCourses: 500 },
        };

        const defaultLimits = planLimits[args.plan];

        const orgId = await ctx.db.insert("organizations", {
            name: args.name,
            slug: args.slug,
            logo: args.logo,
            primaryColor: args.primaryColor || "#6366F1",
            plan: args.plan,
            maxUsers: args.maxUsers ?? defaultLimits.maxUsers,
            maxCourses: args.maxCourses ?? defaultLimits.maxCourses,
            isActive: true,
            clerkOrgId: args.clerkOrgId,
            createdAt: now,
            updatedAt: now,
        });

        // Create admin user if provided
        if (args.adminEmail && args.adminFirstName && args.adminLastName) {
            // Se temos clerkId, o admin já foi criado no Clerk
            const hasClerkId = !!args.adminClerkId;

            await ctx.db.insert("users", {
                clerkId: args.adminClerkId || `pending_${now}`,
                email: args.adminEmail,
                firstName: args.adminFirstName,
                lastName: args.adminLastName,
                role: "admin",
                organizationId: orgId,
                isActive: hasClerkId, // Ativo se já criou no Clerk, senão pending
                createdAt: now,
                updatedAt: now,
            });
        }

        return orgId;
    },
});

// Update organization
export const update = mutation({
    args: {
        organizationId: v.id("organizations"),
        name: v.optional(v.string()),
        slug: v.optional(v.string()),
        logo: v.optional(v.string()),
        primaryColor: v.optional(v.string()),
        plan: v.optional(v.union(v.literal("starter"), v.literal("professional"), v.literal("enterprise"))),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const { organizationId, ...updates } = args;

        const org = await ctx.db.get(organizationId);
        if (!org) throw new Error("Organization not found");

        // Check slug uniqueness if changing
        if (updates.slug && updates.slug !== org.slug) {
            const existingOrg = await ctx.db
                .query("organizations")
                .withIndex("by_slug", (q) => q.eq("slug", updates.slug!))
                .first();

            if (existingOrg) {
                throw new Error("Slug já existe");
            }
        }

        // Update plan limits if plan changed
        if (updates.plan) {
            const planLimits = {
                starter: { maxUsers: 50, maxCourses: 10 },
                professional: { maxUsers: 500, maxCourses: 50 },
                enterprise: { maxUsers: 10000, maxCourses: 500 },
            };
            const limits = planLimits[updates.plan];
            Object.assign(updates, limits);
        }

        // Remove undefined values
        const cleanUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        await ctx.db.patch(organizationId, {
            ...cleanUpdates,
            updatedAt: Date.now(),
        });
    },
});

// Delete organization
export const remove = mutation({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        // Remove all users from this organization
        const users = await ctx.db
            .query("users")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        for (const user of users) {
            await ctx.db.delete(user._id);
        }

        // Remove all courses from this organization
        const courses = await ctx.db
            .query("courses")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        for (const course of courses) {
            await ctx.db.delete(course._id);
        }

        // Finally, delete the organization
        await ctx.db.delete(args.organizationId);
    },
});

// Get organization stats
export const getStats = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const users = await ctx.db
            .query("users")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const courses = await ctx.db
            .query("courses")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const activeUsers = users.filter((u) => u.isActive);
        const publishedCourses = courses.filter((c) => c.isPublished);

        return {
            totalUsers: users.length,
            activeUsers: activeUsers.length,
            totalCourses: courses.length,
            publishedCourses: publishedCourses.length,
            usersByRole: {
                admin: users.filter((u) => u.role === "admin").length,
                professor: users.filter((u) => u.role === "professor").length,
                student: users.filter((u) => u.role === "student").length,
            },
        };
    },
});

// Get global stats (superadmin)
export const getGlobalStats = query({
    args: {},
    handler: async (ctx) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const orgs = await ctx.db.query("organizations").collect();
        const users = await ctx.db.query("users").collect();
        const courses = await ctx.db.query("courses").collect();

        return {
            totalOrganizations: orgs.length,
            activeOrganizations: orgs.filter((o) => o.isActive).length,
            totalUsers: users.length,
            totalCourses: courses.length,
            byPlan: {
                starter: orgs.filter((o) => o.plan === "starter").length,
                professional: orgs.filter((o) => o.plan === "professional").length,
                enterprise: orgs.filter((o) => o.plan === "enterprise").length,
            },
        };
    },
});
