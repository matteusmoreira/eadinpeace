import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireOwnerOrAdmin, requireAuthWithOrg, requireRole } from "./authHelpers";

// Get certificates by user
export const getByUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        // Verificar que o usuário pode acessar certificados deste usuário
        await requireOwnerOrAdmin(ctx, args.userId);

        const certificates = await ctx.db
            .query("certificates")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        // Enrich with course data
        const enrichedCertificates = await Promise.all(
            certificates.map(async (cert) => {
                const course = await ctx.db.get(cert.courseId);
                let instructor = null;
                if (course) {
                    instructor = await ctx.db.get(course.instructorId);
                }
                return {
                    ...cert,
                    course: course ? {
                        title: course.title,
                        thumbnail: course.thumbnail,
                        duration: course.duration,
                    } : null,
                    instructor: instructor ? {
                        firstName: instructor.firstName,
                        lastName: instructor.lastName,
                    } : null,
                };
            })
        );

        return enrichedCertificates;
    },
});

// Get certificate by code (for verification)
export const getByCode = query({
    args: { code: v.string() },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const certificate = await ctx.db
            .query("certificates")
            .withIndex("by_code", (q) => q.eq("code", args.code))
            .first();

        if (!certificate) return null;

        const user = await ctx.db.get(certificate.userId);
        const course = await ctx.db.get(certificate.courseId);
        let instructor = null;
        let organization = null;

        if (course) {
            instructor = await ctx.db.get(course.instructorId);
            organization = await ctx.db.get(course.organizationId);
        }

        return {
            ...certificate,
            user: user ? {
                firstName: user.firstName,
                lastName: user.lastName,
            } : null,
            course: course ? {
                title: course.title,
                duration: course.duration,
            } : null,
            instructor: instructor ? {
                firstName: instructor.firstName,
                lastName: instructor.lastName,
            } : null,
            organization: organization ? {
                name: organization.name,
            } : null,
        };
    },
});

// Get certificate by ID
export const getById = query({
    args: { certificateId: v.id("certificates") },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const certificate = await ctx.db.get(args.certificateId);
        if (!certificate) return null;

        const user = await ctx.db.get(certificate.userId);
        const course = await ctx.db.get(certificate.courseId);
        let instructor = null;
        let organization = null;

        if (course) {
            instructor = await ctx.db.get(course.instructorId);
            organization = await ctx.db.get(course.organizationId);
        }

        return {
            ...certificate,
            user: user ? {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            } : null,
            course: course ? {
                title: course.title,
                duration: course.duration,
                level: course.level,
            } : null,
            instructor: instructor ? {
                firstName: instructor.firstName,
                lastName: instructor.lastName,
            } : null,
            organization: organization ? {
                name: organization.name,
                logo: organization.logo,
            } : null,
        };
    },
});

// Issue certificate manually (admin)
export const issue = mutation({
    args: {
        userId: v.id("users"),
        courseId: v.id("courses"),
    },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        // Check if already exists
        const existing = await ctx.db
            .query("certificates")
            .filter((q) =>
                q.and(
                    q.eq(q.field("userId"), args.userId),
                    q.eq(q.field("courseId"), args.courseId)
                )
            )
            .first();

        if (existing) {
            return existing._id;
        }

        const code = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        return await ctx.db.insert("certificates", {
            userId: args.userId,
            courseId: args.courseId,
            code,
            issuedAt: Date.now(),
        });
    },
});

// Get certificates by organization
export const getByOrganization = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        try {
            // Get all courses for this organization
            const courses = await ctx.db
                .query("courses")
                .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
                .collect();

            if (!courses || courses.length === 0) {
                return [];
            }

            const courseIds = courses.map(c => c._id);

            // Get all certificates for these courses
            const allCertificates = await ctx.db.query("certificates").collect();
            const certificates = allCertificates.filter(cert =>
                cert && cert.courseId && courseIds.some(id => id === cert.courseId)
            );

            if (certificates.length === 0) {
                return [];
            }

            // Enrich with user and course data
            const enrichedCertificates = await Promise.all(
                certificates.map(async (cert) => {
                    try {
                        const user = cert.userId ? await ctx.db.get(cert.userId) : null;
                        const course = courses.find(c => c._id === cert.courseId);
                        return {
                            ...cert,
                            userName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Usuário" : "Usuário",
                            userEmail: user?.email || "",
                            courseName: course?.title || "Curso",
                        };
                    } catch {
                        return {
                            ...cert,
                            userName: "Usuário",
                            userEmail: "",
                            courseName: "Curso",
                        };
                    }
                })
            );

            return enrichedCertificates.sort((a, b) => (b.issuedAt || 0) - (a.issuedAt || 0));
        } catch (error) {
            console.error("[getByOrganization] Error:", error);
            return [];
        }
    },
});

// Get organization certificate stats
export const getOrganizationStats = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        try {
            // Get all courses for this organization
            const courses = await ctx.db
                .query("courses")
                .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
                .collect();

            if (!courses || courses.length === 0) {
                return {
                    total: 0,
                    thisMonth: 0,
                    coursesWithCertificates: 0,
                    downloads: 0,
                };
            }

            const courseIds = courses.map(c => c._id);

            // Get all certificates for these courses
            const allCertificates = await ctx.db.query("certificates").collect();
            const certificates = allCertificates.filter(cert =>
                cert && cert.courseId && courseIds.some(id => id === cert.courseId)
            );

            // Get this month's certificates
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            const thisMonthCerts = certificates.filter(c =>
                typeof c.issuedAt === "number" && c.issuedAt >= startOfMonth
            );

            // Get unique courses with certificates
            const coursesWithCerts = [...new Set(certificates.map(c => c.courseId))];

            // Count downloads (we'll track this in the future)
            const downloads = 0;

            return {
                total: certificates.length,
                thisMonth: thisMonthCerts.length,
                coursesWithCertificates: coursesWithCerts.length,
                downloads,
            };
        } catch (error) {
            console.error("[getOrganizationStats] Error:", error);
            return {
                total: 0,
                thisMonth: 0,
                coursesWithCertificates: 0,
                downloads: 0,
            };
        }
    },
});

// Get global certificate stats
export const getGlobalStats = query({
    args: {},
    handler: async (ctx) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        try {
            const certificates = await ctx.db.query("certificates").collect();

            // Get unique courses
            const courseIds = [...new Set(certificates.filter(c => c?.courseId).map(c => c.courseId))];

            // Get this month's certificates
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            const thisMonthCerts = certificates.filter(c =>
                typeof c.issuedAt === "number" && c.issuedAt >= startOfMonth
            );

            return {
                total: certificates.length,
                thisMonth: thisMonthCerts.length,
                uniqueCourses: courseIds.length,
            };
        } catch (error) {
            console.error("[getGlobalStats] Error:", error);
            return {
                total: 0,
                thisMonth: 0,
                uniqueCourses: 0,
            };
        }
    },
});
