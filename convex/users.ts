import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAuth } from "./authHelpers";

// Helper function to generate URL-friendly slug from name
function generateSlug(firstName: string, lastName: string): string {
    const base = `${firstName}-${lastName}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[^a-z0-9-]/g, "-")     // Caracteres especiais viram hífen
        .replace(/-+/g, "-")              // Remove hífens duplicados
        .replace(/^-|-$/g, "");           // Remove hífens no início/fim
    return base || "usuario";
}

// Get user by Slug (URL amigável)
export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();

        if (!user) return null;

        // Check permission - allow if superadmin, admin of same org, or self
        const caller = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!caller) return null;

        if (caller.role === "superadmin") return user;
        if (caller._id === user._id) return user;
        if (caller.role === "admin" && caller.organizationId && caller.organizationId === user.organizationId) {
            return user;
        }

        return null;
    },
});

// Internal helper to generate unique slug
async function generateUniqueSlug(
    ctx: { db: any },
    firstName: string,
    lastName: string,
    excludeUserId?: any
): Promise<string> {
    let slug = generateSlug(firstName, lastName);
    let counter = 1;

    while (true) {
        const existing = await ctx.db
            .query("users")
            .withIndex("by_slug", (q: any) => q.eq("slug", slug))
            .first();

        if (!existing || (excludeUserId && existing._id === excludeUserId)) {
            break;
        }

        slug = `${generateSlug(firstName, lastName)}-${counter}`;
        counter++;
    }

    return slug;
}

// Get user by Clerk ID
export const getByClerkId = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        if (identity.subject !== args.clerkId) return null;

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
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        try {
            const caller = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();
            if (!caller) return null;

            const target = await ctx.db.get(args.userId);
            if (!target) return null;

            if (caller.role === "superadmin") return target;

            if (caller._id === target._id) return target;

            if (caller.role === "admin" && caller.organizationId && caller.organizationId === target.organizationId) {
                return target;
            }

            return null;
        } catch (error) {
            console.error("[users:getById] Erro:", error);
            return null;
        }
    },
});

// Get users by organization
export const getByOrganization = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        try {
            const caller = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();
            if (!caller) return [];

            if (!["superadmin", "admin", "professor"].includes(caller.role)) return [];
            if (caller.role !== "superadmin" && caller.organizationId !== args.organizationId) return [];

            return await ctx.db
                .query("users")
                .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
                .collect();
        } catch (error) {
            console.error("[users:getByOrganization] Erro:", error);
            return [];
        }
    },
});

// Get ALL users (superadmin only)
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        try {
            const caller = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();
            if (!caller) return [];
            if (caller.role !== "superadmin") return [];

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
        } catch (error) {
            console.error("[users:getAll] Erro:", error);
            return [];
        }
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
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        try {
            const caller = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();
            if (!caller) return [];
            if (caller.role !== "superadmin") return [];

            return await ctx.db
                .query("users")
                .withIndex("by_role", (q) => q.eq("role", args.role))
                .collect();
        } catch (error) {
            console.error("[users:getByRole] Erro:", error);
            return [];
        }
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
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }
        if (identity.subject !== args.clerkId) {
            throw new Error("Acesso negado");
        }

        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .first();

        const now = Date.now();

        if (existingUser) {
            const updateData: Record<string, unknown> = {
                email: args.email,
                firstName: args.firstName,
                lastName: args.lastName,
                imageUrl: args.imageUrl,
                lastLoginAt: now,
                updatedAt: now,
            };

            await ctx.db.patch(existingUser._id, updateData);
            return existingUser._id;
        } else {
            const anyUser = await ctx.db.query("users").take(1);
            const allowRoleBootstrap = anyUser.length === 0;
            const role = allowRoleBootstrap ? (args.role || "student") : "student";

            // Generate unique slug for new user
            const slug = await generateUniqueSlug(ctx, args.firstName, args.lastName);

            return await ctx.db.insert("users", {
                clerkId: args.clerkId,
                email: args.email,
                firstName: args.firstName,
                lastName: args.lastName,
                slug,
                imageUrl: args.imageUrl,
                role,
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
        const auth = await requireAuth(ctx);
        if (auth.user.role !== "superadmin" && auth.user.role !== "admin") {
            throw new Error("Acesso negado");
        }

        if (auth.user.role === "admin") {
            if (!auth.user.organizationId) throw new Error("Organização não encontrada");
            if (args.role === "superadmin") throw new Error("Acesso negado");
            if (args.organizationId && args.organizationId !== auth.user.organizationId) {
                throw new Error("Acesso negado");
            }
        }

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

        const organizationId =
            auth.user.role === "admin" ? auth.user.organizationId : args.organizationId;

        // Generate unique slug for new user
        const slug = await generateUniqueSlug(ctx, args.firstName, args.lastName);

        return await ctx.db.insert("users", {
            clerkId: args.clerkId || `pending_${now}`, // Will be updated when user accepts invitation
            email: args.email,
            firstName: args.firstName,
            lastName: args.lastName,
            slug,
            imageUrl: args.imageUrl,
            role: args.role,
            organizationId,
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
        const auth = await requireAuth(ctx);

        const { userId, ...updates } = args;

        if (auth.user.role !== "superadmin" && auth.user.role !== "admin") {
            throw new Error("Acesso negado");
        }

        const target = await ctx.db.get(userId);
        if (!target) throw new Error("Usuário não encontrado");

        if (auth.user.role === "admin") {
            if (!auth.user.organizationId) throw new Error("Organização não encontrada");
            if (target.organizationId !== auth.user.organizationId) throw new Error("Acesso negado");
            if (updates.role === "superadmin") throw new Error("Acesso negado");
            if (updates.organizationId && updates.organizationId !== auth.user.organizationId) {
                throw new Error("Acesso negado");
            }
        }

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
        const auth = await requireAuth(ctx);
        if (auth.user.role !== "superadmin" && auth.user.role !== "admin") {
            throw new Error("Acesso negado");
        }

        if (auth.user.role === "admin") {
            if (args.role === "superadmin") throw new Error("Acesso negado");
            const target = await ctx.db.get(args.userId);
            if (!target) throw new Error("Usuário não encontrado");
            if (!auth.user.organizationId || target.organizationId !== auth.user.organizationId) {
                throw new Error("Acesso negado");
            }
        }

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
        const auth = await requireAuth(ctx);
        if (auth.user.role !== "superadmin" && auth.user.role !== "admin") {
            throw new Error("Acesso negado");
        }

        if (auth.user.role === "admin") {
            if (!auth.user.organizationId) throw new Error("Organização não encontrada");
            if (args.organizationId !== auth.user.organizationId) throw new Error("Acesso negado");
            const target = await ctx.db.get(args.userId);
            if (!target) throw new Error("Usuário não encontrado");
            if (target.organizationId !== auth.user.organizationId) throw new Error("Acesso negado");
        }

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
        const auth = await requireAuth(ctx);
        if (auth.user.role !== "superadmin" && auth.user.role !== "admin") {
            throw new Error("Acesso negado");
        }

        if (auth.user.role === "admin") {
            const target = await ctx.db.get(args.userId);
            if (!target) throw new Error("Usuário não encontrado");
            if (!auth.user.organizationId || target.organizationId !== auth.user.organizationId) {
                throw new Error("Acesso negado");
            }
            if (target.role === "superadmin") throw new Error("Acesso negado");
        }

        await ctx.db.delete(args.userId);
    },
});

// Get all superadmins
export const getSuperadmins = query({
    args: {},
    handler: async (ctx) => {
        // Verificar autenticação - retorna array vazio se não autenticado
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        try {
            return await ctx.db
                .query("users")
                .withIndex("by_role", (q) => q.eq("role", "superadmin"))
                .collect();
        } catch (error) {
            console.error("[users:getSuperadmins] Erro:", error);
            return [];
        }
    },
});

// Get user stats
export const getStats = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        // Valores padrão para retornar em caso de erro
        const defaultStats = {
            coursesInProgress: 0,
            coursesCompleted: 0,
            certificates: 0,
            currentStreak: 0,
            achievements: 0,
        };

        try {
            // Verificar autenticação
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) {
                console.log("[getStats] Usuário não autenticado");
                return defaultStats;
            }

            // Verificar se o userId é válido
            const user = await ctx.db.get(args.userId);
            if (!user) {
                console.log("[getStats] Usuário não encontrado:", args.userId);
                return defaultStats;
            }

            const enrollments = await ctx.db
                .query("enrollments")
                .withIndex("by_user", (q) => q.eq("userId", args.userId))
                .collect();

            // Filtrar apenas enrollments cujos cursos ainda existem
            const validEnrollments = [];
            for (const enrollment of enrollments) {
                const course = await ctx.db.get(enrollment.courseId);
                if (course) {
                    validEnrollments.push(enrollment);
                }
            }

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
                coursesInProgress: validEnrollments.filter((e) => !e.completedAt).length,
                coursesCompleted: validEnrollments.filter((e) => e.completedAt).length,
                certificates: certificates.length,
                currentStreak: streak?.currentStreak || 0,
                achievements: achievements.length,
            };
        } catch (error) {
            console.error("[getStats] Erro:", error);
            return defaultStats;
        }
    },
});

// Get global user stats (superadmin)
export const getGlobalStats = query({
    args: {
        period: v.optional(v.union(
            v.literal("7d"),
            v.literal("30d"),
            v.literal("90d"),
            v.literal("1y")
        ))
    },
    handler: async (ctx, args) => {
        // Valores padrão para retornar se não autenticado ou em caso de erro
        const defaultStats = {
            total: 0,
            byRole: {
                superadmin: 0,
                admin: 0,
                professor: 0,
                student: 0,
            },
            active: 0,
            pending: 0,
            growth: {
                users: 0,
                organizations: 0,
                activeUsers: 0,
            },
            courses: {
                total: 0,
                published: 0,
            },
            enrollments: {
                total: 0,
                completed: 0,
            },
            certificates: {
                total: 0,
            },
        };

        try {
            let auth;
            try {
                auth = await requireAuth(ctx);
            } catch {
                return defaultStats;
            }
            if (auth.user.role !== "superadmin") {
                return defaultStats;
            }

            const users = await ctx.db.query("users").collect();
            const organizations = await ctx.db.query("organizations").collect();
            const enrollments = await ctx.db.query("enrollments").collect();
            const certificates = await ctx.db.query("certificates").collect();
            const courses = await ctx.db.query("courses").collect();

            // Calculate period in milliseconds based on selected period
            const now = Date.now();
            let periodMs: number;
            switch (args.period || "30d") {
                case "7d":
                    periodMs = 7 * 24 * 60 * 60 * 1000;
                    break;
                case "90d":
                    periodMs = 90 * 24 * 60 * 60 * 1000;
                    break;
                case "1y":
                    periodMs = 365 * 24 * 60 * 60 * 1000;
                    break;
                case "30d":
                default:
                    periodMs = 30 * 24 * 60 * 60 * 1000;
                    break;
            }

            const periodStart = now - periodMs;
            const previousPeriodStart = periodStart - periodMs;

            // Users created in this period vs previous period
            // Verificar se createdAt existe e é um número válido
            const usersThisPeriod = users.filter(u =>
                typeof u.createdAt === "number" && u.createdAt >= periodStart
            ).length;
            const usersPreviousPeriod = users.filter(u =>
                typeof u.createdAt === "number" && u.createdAt >= previousPeriodStart && u.createdAt < periodStart
            ).length;
            const userGrowth = usersPreviousPeriod > 0
                ? ((usersThisPeriod - usersPreviousPeriod) / usersPreviousPeriod * 100)
                : usersThisPeriod > 0 ? 100 : 0;

            // Organizations created in this period vs previous period
            // Verificar se createdAt existe e é um número válido
            const orgsThisPeriod = organizations.filter(o =>
                typeof o.createdAt === "number" && o.createdAt >= periodStart
            ).length;
            const orgsPreviousPeriod = organizations.filter(o =>
                typeof o.createdAt === "number" && o.createdAt >= previousPeriodStart && o.createdAt < periodStart
            ).length;
            const orgGrowth = orgsPreviousPeriod > 0
                ? ((orgsThisPeriod - orgsPreviousPeriod) / orgsPreviousPeriod * 100)
                : orgsThisPeriod > 0 ? 100 : 0;

            // Active users growth (based on lastLoginAt)
            // Verificar todos os campos antes de usar
            const activeUsersThisPeriod = users.filter(u =>
                u.isActive === true && typeof u.lastLoginAt === "number" && u.lastLoginAt >= periodStart
            ).length;
            const activeUsersPreviousPeriod = users.filter(u =>
                u.isActive === true && typeof u.lastLoginAt === "number" && u.lastLoginAt >= previousPeriodStart && u.lastLoginAt < periodStart
            ).length;
            const activeGrowth = activeUsersPreviousPeriod > 0
                ? ((activeUsersThisPeriod - activeUsersPreviousPeriod) / activeUsersPreviousPeriod * 100)
                : activeUsersThisPeriod > 0 ? 100 : 0;

            // Contar usuários ativos de forma segura
            const activeUsersCount = users.filter((u) => u.isActive === true).length;
            const pendingUsersCount = users.filter((u) => u.isActive === false || u.isActive === undefined).length;

            // Contar cursos publicados de forma segura  
            const publishedCoursesCount = courses.filter(c => c.isPublished === true).length;

            // Contar enrollments concluídos de forma segura
            const completedEnrollmentsCount = enrollments.filter(e =>
                e.completedAt !== undefined && e.completedAt !== null && typeof e.completedAt === "number"
            ).length;

            return {
                total: users.length || 0,
                byRole: {
                    superadmin: users.filter((u) => u.role === "superadmin").length || 0,
                    admin: users.filter((u) => u.role === "admin").length || 0,
                    professor: users.filter((u) => u.role === "professor").length || 0,
                    student: users.filter((u) => u.role === "student").length || 0,
                },
                active: activeUsersCount || 0,
                pending: pendingUsersCount || 0,
                // Growth metrics
                growth: {
                    users: Math.round((userGrowth || 0) * 10) / 10,
                    organizations: Math.round((orgGrowth || 0) * 10) / 10,
                    activeUsers: Math.round((activeGrowth || 0) * 10) / 10,
                },
                // Additional stats
                courses: {
                    total: courses.length || 0,
                    published: publishedCoursesCount || 0,
                },
                enrollments: {
                    total: enrollments.length || 0,
                    completed: completedEnrollmentsCount || 0,
                },
                certificates: {
                    total: certificates.length || 0,
                },
            };
        } catch (error) {
            console.error("[users:getGlobalStats] Error:", error);
            return defaultStats;
        }
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

// Migration: Add slugs to existing users who don't have one
export const migrateAddSlugs = internalMutation({
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        let updated = 0;

        for (const user of users) {
            if (!user.slug) {
                const slug = await generateUniqueSlug(ctx, user.firstName, user.lastName, user._id);
                await ctx.db.patch(user._id, { slug });
                updated++;
            }
        }

        console.log(`[migrateAddSlugs] Updated ${updated} users with slugs`);
        return { updated };
    },
});

// Public mutation to trigger slug migration (for admin use)
export const addSlugToExistingUsers = mutation({
    args: {},
    handler: async (ctx) => {
        const auth = await requireAuth(ctx);
        if (auth.user.role !== "superadmin") {
            throw new Error("Acesso negado");
        }

        const users = await ctx.db.query("users").collect();
        let updated = 0;

        for (const user of users) {
            if (!user.slug) {
                const slug = await generateUniqueSlug(ctx, user.firstName, user.lastName, user._id);
                await ctx.db.patch(user._id, { slug });
                updated++;
            }
        }

        return { updated, message: `${updated} usuários atualizados com slug` };
    },
});

// Change user password (superadmin only)
export const changeUserPassword = mutation({
    args: {
        userId: v.id("users"),
        newPassword: v.string(),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx);

        // Apenas superadmins podem alterar senhas
        if (auth.user.role !== "superadmin") {
            throw new Error("Acesso negado: apenas superadmins podem alterar senhas");
        }

        // Validar senha (mínimo 8 caracteres)
        if (args.newPassword.length < 8) {
            throw new Error("A senha deve ter no mínimo 8 caracteres");
        }

        // Buscar usuário alvo
        const targetUser = await ctx.db.get(args.userId);
        if (!targetUser) {
            throw new Error("Usuário não encontrado");
        }

        // Verificar se o clerkId é válido (não é pending)
        if (targetUser.clerkId.startsWith("pending_")) {
            throw new Error("Este usuário ainda não completou o cadastro no Clerk");
        }

        try {
            // Chamar action do Clerk para atualizar senha
            const { clerkClient } = await import("@clerk/nextjs/server");

            // Atualizar senha no Clerk diretamente
            await (await clerkClient()).users.updateUser(targetUser.clerkId, {
                password: args.newPassword,
            });

            // Registrar log de auditoria
            await ctx.db.insert("passwordChangeLogs", {
                changedByUserId: auth.user._id,
                targetUserId: args.userId,
                timestamp: Date.now(),
                // ipAddress poderia ser passado como argumento se disponível
            });

            return { success: true };
        } catch (error: any) {
            console.error("[users:changeUserPassword] Erro:", error);
            throw new Error(`Erro ao alterar senha: ${error.message || "Erro desconhecido"}`);
        }
    },
});
