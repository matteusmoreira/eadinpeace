import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user by Clerk ID
export const getByClerkId = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();
    },
});

// Sync user data from Clerk (updates basic info only, preserves role and organization)
export const syncFromClerk = mutation({
    args: {
        clerkId: v.string(),
        email: v.string(),
        firstName: v.string(),
        lastName: v.string(),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (!existingUser) {
            // User doesn't exist in Convex - they need to go through setup
            // Don't create automatically to prevent role issues
            return null;
        }

        const now = Date.now();

        // Only update basic profile info, NEVER touch role or organizationId
        await ctx.db.patch(existingUser._id, {
            email: args.email,
            firstName: args.firstName,
            lastName: args.lastName,
            imageUrl: args.imageUrl,
            lastLoginAt: now,
            updatedAt: now,
        });

        return existingUser._id;
    },
});

// Get user by ID
export const getById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    },
});

// Get users by organization
export const getByOrganization = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();
    },
});

// Get ALL users (superadmin only)
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();

        // Enrich with organization data
        const enrichedUsers = await Promise.all(
            users.map(async (user) => {
                let organization = null;
                if (user.organizationId) {
                    organization = await ctx.db.get(user.organizationId);
                }
                return {
                    ...user,
                    organization: organization ? { name: organization.name, slug: organization.slug } : null,
                };
            })
        );

        return enrichedUsers;
    },
});

// Get users by role
export const getByRole = query({
    args: {
        role: v.union(
            v.literal("superadmin"),
            v.literal("admin"),
            v.literal("professor"),
            v.literal("student")
        )
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", args.role))
            .collect();
    },
});

// Create or update user from Clerk
export const upsertFromClerk = mutation({
    args: {
        clerkId: v.string(),
        email: v.string(),
        firstName: v.string(),
        lastName: v.string(),
        imageUrl: v.optional(v.string()),
        role: v.optional(v.union(
            v.literal("superadmin"),
            v.literal("admin"),
            v.literal("professor"),
            v.literal("student")
        )),
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();

        const now = Date.now();

        if (existingUser) {
            // Update existing user - include role if specified
            const updateData: Record<string, unknown> = {
                email: args.email,
                firstName: args.firstName,
                lastName: args.lastName,
                imageUrl: args.imageUrl,
                lastLoginAt: now,
                updatedAt: now,
            };

            // If role is specified, update it
            if (args.role) {
                updateData.role = args.role;
                // Superadmins don't belong to any organization
                if (args.role === "superadmin") {
                    updateData.organizationId = undefined;
                }
            }

            await ctx.db.patch(existingUser._id, updateData);
            return existingUser._id;
        } else {
            // Create new user
            return await ctx.db.insert("users", {
                clerkId: args.clerkId,
                email: args.email,
                firstName: args.firstName,
                lastName: args.lastName,
                imageUrl: args.imageUrl,
                role: args.role || "student",
                isActive: true,
                lastLoginAt: now,
                createdAt: now,
                updatedAt: now,
            });
        }
    },
});

// Create user (manual - for superadmin/admin)
export const create = mutation({
    args: {
        email: v.string(),
        firstName: v.string(),
        lastName: v.string(),
        role: v.union(
            v.literal("superadmin"),
            v.literal("admin"),
            v.literal("professor"),
            v.literal("student")
        ),
        organizationId: v.optional(v.id("organizations")),
        imageUrl: v.optional(v.string()),
        clerkId: v.optional(v.string()), // Clerk ID se usuário já foi criado no Clerk
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Check if email already exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (existingUser) {
            throw new Error("Email já cadastrado");
        }

        // Se tem clerkId, o usuário já está no Clerk e pode logar
        const hasClerkId = !!args.clerkId;

        return await ctx.db.insert("users", {
            clerkId: args.clerkId || `pending_${now}`, // Will be updated when user accepts invitation
            email: args.email,
            firstName: args.firstName,
            lastName: args.lastName,
            imageUrl: args.imageUrl,
            role: args.role,
            organizationId: args.organizationId,
            isActive: hasClerkId, // Ativo se já criou no Clerk, senão pending
            createdAt: now,
            updatedAt: now,
        });
    },
});

// Update user
export const update = mutation({
    args: {
        userId: v.id("users"),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        role: v.optional(v.union(
            v.literal("superadmin"),
            v.literal("admin"),
            v.literal("professor"),
            v.literal("student")
        )),
        organizationId: v.optional(v.id("organizations")),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { userId, ...updates } = args;

        // Remove undefined values
        const cleanUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        await ctx.db.patch(userId, {
            ...cleanUpdates,
            updatedAt: Date.now(),
        });
    },
});

// Update user role
export const updateRole = mutation({
    args: {
        userId: v.id("users"),
        role: v.union(
            v.literal("superadmin"),
            v.literal("admin"),
            v.literal("professor"),
            v.literal("student")
        ),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, {
            role: args.role,
            updatedAt: Date.now(),
        });
    },
});

// Assign user to organization
export const assignToOrganization = mutation({
    args: {
        userId: v.id("users"),
        organizationId: v.optional(v.id("organizations")),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, {
            organizationId: args.organizationId,
            updatedAt: Date.now(),
        });
    },
});

// Delete user
export const remove = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.userId);
    },
});

// Get all superadmins
export const getSuperadmins = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "superadmin"))
            .collect();
    },
});

// Get user stats
export const getStats = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const enrollments = await ctx.db
            .query("enrollments")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const certificates = await ctx.db
            .query("certificates")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const streak = await ctx.db
            .query("studyStreaks")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        const achievements = await ctx.db
            .query("userAchievements")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        return {
            coursesInProgress: enrollments.filter((e) => !e.completedAt).length,
            coursesCompleted: enrollments.filter((e) => e.completedAt).length,
            certificates: certificates.length,
            currentStreak: streak?.currentStreak || 0,
            achievements: achievements.length,
        };
    },
});

// Get global user stats (superadmin)
export const getGlobalStats = query({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();

        return {
            total: users.length,
            byRole: {
                superadmin: users.filter((u) => u.role === "superadmin").length,
                admin: users.filter((u) => u.role === "admin").length,
                professor: users.filter((u) => u.role === "professor").length,
                student: users.filter((u) => u.role === "student").length,
            },
            active: users.filter((u) => u.isActive).length,
            pending: users.filter((u) => !u.isActive).length,
        };
    },
});

// Promote user to superadmin by email (USE ONLY FOR INITIAL SETUP)
export const promoteToSuperadmin = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (!user) {
            throw new Error(`User with email ${args.email} not found`);
        }

        await ctx.db.patch(user._id, {
            role: "superadmin",
            organizationId: undefined, // Superadmin doesn't belong to any org
            updatedAt: Date.now(),
        });

        return { success: true, userId: user._id };
    },
});

// Ensure user has an organization (creates default if needed)
export const ensureOrganization = mutation({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (!user) {
            throw new Error("Usuário não encontrado");
        }

        // Superadmins don't need organization
        if (user.role === "superadmin") {
            // Get or create a default organization for testing/admin access
            let defaultOrg = await ctx.db
                .query("organizations")
                .first();

            if (!defaultOrg) {
                const now = Date.now();
                const orgId = await ctx.db.insert("organizations", {
                    name: "Organização Padrão",
                    slug: "org-padrao",
                    plan: "enterprise",
                    maxUsers: 1000,
                    maxCourses: 100,
                    isActive: true,
                    createdAt: now,
                    updatedAt: now,
                });
                defaultOrg = await ctx.db.get(orgId);
            }

            return { organizationId: defaultOrg?._id, created: false };
        }

        // If user already has organization, return it
        if (user.organizationId) {
            return { organizationId: user.organizationId, created: false };
        }

        // Try to find or create a default organization
        let org = await ctx.db.query("organizations").first();

        if (!org) {
            const now = Date.now();
            const orgId = await ctx.db.insert("organizations", {
                name: "Minha Organização",
                slug: "minha-org",
                plan: "starter",
                maxUsers: 50,
                maxCourses: 10,
                isActive: true,
                createdAt: now,
                updatedAt: now,
            });
            org = await ctx.db.get(orgId);
        }

        // Assign user to org
        if (org) {
            await ctx.db.patch(user._id, {
                organizationId: org._id,
                updatedAt: Date.now(),
            });
            return { organizationId: org._id, created: true };
        }

        throw new Error("Não foi possível criar ou encontrar uma organização");
    },
});

// Get or create organization for current user (auto-assign)
export const getOrCreateUserOrganization = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        // Se não houver clerkId, retorna null imediatamente
        if (!args.clerkId) {
            console.log("[getOrCreateUserOrganization] No clerkId provided");
            return null;
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (!user) {
            console.log("[getOrCreateUserOrganization] User not found for clerkId:", args.clerkId);
            return null;
        }

        console.log("[getOrCreateUserOrganization] User found:", user.email, "Role:", user.role);

        // If user has org, return it
        if (user.organizationId) {
            const org = await ctx.db.get(user.organizationId);
            if (org) {
                console.log("[getOrCreateUserOrganization] Found user org:", org.name);
                return org;
            }
            // Organização não existe mais - log e continue
            console.log("[getOrCreateUserOrganization] User org ID exists but org not found:", user.organizationId);
        }

        // For superadmin or when user's org is missing, return the first org if exists
        if (user.role === "superadmin" || user.organizationId) {
            const firstOrg = await ctx.db.query("organizations").first();
            if (firstOrg) {
                console.log("[getOrCreateUserOrganization] Returning first org:", firstOrg.name);
            }
            return firstOrg;
        }

        console.log("[getOrCreateUserOrganization] No organization found");
        return null;
    },
});
