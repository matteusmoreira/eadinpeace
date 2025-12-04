import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get certificates by user
export const getByUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
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

// Get global certificate stats
export const getGlobalStats = query({
    args: {},
    handler: async (ctx) => {
        const certificates = await ctx.db.query("certificates").collect();

        // Get unique courses
        const courseIds = [...new Set(certificates.map(c => c.courseId))];

        // Get this month's certificates
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const thisMonthCerts = certificates.filter(c => c.issuedAt >= startOfMonth);

        return {
            total: certificates.length,
            thisMonth: thisMonthCerts.length,
            uniqueCourses: courseIds.length,
        };
    },
});
