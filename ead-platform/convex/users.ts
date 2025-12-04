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

        return await ctx.db.insert("users", {
            clerkId: `pending_${now}`, // Will be updated when user accepts invitation
            email: args.email,
            firstName: args.firstName,
            lastName: args.lastName,
            imageUrl: args.imageUrl,
            role: args.role,
            organizationId: args.organizationId,
            isActive: false, // Pending invitation
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
