import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireAuthWithOrg, requireRole, requireCourseAccess } from "./authHelpers";

// Get all courses (filtrado por organização do usuário, ou todos para superadmin)
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        // Verificar autenticação
        const auth = await requireAuth(ctx);

        // Filtrar por organização (superadmin vê todos)
        let courses;
        if (auth.user.role === "superadmin") {
            courses = await ctx.db.query("courses").collect();
        } else {
            courses = await ctx.db
                .query("courses")
                .withIndex("by_organization", (q) => q.eq("organizationId", auth.user.organizationId!))
                .collect();
        }

        // Enrich with instructor and organization
        const enrichedCourses = await Promise.all(
            courses.map(async (course) => {
                const instructor = await ctx.db.get(course.instructorId);
                const organization = await ctx.db.get(course.organizationId);

                // Count enrollments
                const enrollments = await ctx.db
                    .query("enrollments")
                    .withIndex("by_course", (q) => q.eq("courseId", course._id))
                    .collect();

                // Count lessons
                const lessons = await ctx.db
                    .query("lessons")
                    .withIndex("by_course", (q) => q.eq("courseId", course._id))
                    .collect();

                return {
                    ...course,
                    instructor: instructor ? {
                        _id: instructor._id,
                        firstName: instructor.firstName,
                        lastName: instructor.lastName,
                        imageUrl: instructor.imageUrl,
                    } : null,
                    organization: organization ? { name: organization.name } : null,
                    enrollmentCount: enrollments.length,
                    lessonCount: lessons.length,
                };
            })
        );

        return enrichedCourses;
    },
});

// Get course by ID
export const getById = query({
    args: { courseId: v.id("courses") },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const auth = await requireAuth(ctx);

        const course = await ctx.db.get(args.courseId);
        if (!course) return null;

        // Verificar acesso à organização (exceto superadmin)
        if (auth.user.role !== "superadmin" && auth.user.organizationId !== course.organizationId) {
            throw new Error("Acesso negado: curso de outra organização");
        }

        return course;
    },
});

// Get all courses for an organization
export const getByOrganization = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        // Verificar autenticação básica
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        try {
            const courses = await ctx.db
                .query("courses")
                .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
                .collect();

            // Enrich with instructor info
            const enrichedCourses = await Promise.all(
                courses.map(async (course) => {
                    const instructor = await ctx.db.get(course.instructorId);
                    const enrollments = await ctx.db
                        .query("enrollments")
                        .withIndex("by_course", (q) => q.eq("courseId", course._id))
                        .collect();
                    const lessons = await ctx.db
                        .query("lessons")
                        .withIndex("by_course", (q) => q.eq("courseId", course._id))
                        .collect();

                    return {
                        ...course,
                        instructor,
                        enrollmentCount: enrollments.length,
                        lessonCount: lessons.length,
                    };
                })
            );

            return enrichedCourses;
        } catch (error) {
            console.error("[courses:getByOrganization] Erro:", error);
            return [];
        }
    },
});

// Get published courses for an organization (catalog)
export const getPublishedByOrganization = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const courses = await ctx.db
            .query("courses")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        const publishedCourses = courses.filter((c) => c.isPublished);

        // Enrich with instructor and enrollment count
        const enrichedCourses = await Promise.all(
            publishedCourses.map(async (course) => {
                const instructor = await ctx.db.get(course.instructorId);
                const enrollments = await ctx.db
                    .query("enrollments")
                    .withIndex("by_course", (q) => q.eq("courseId", course._id))
                    .collect();
                const lessons = await ctx.db
                    .query("lessons")
                    .withIndex("by_course", (q) => q.eq("courseId", course._id))
                    .collect();

                return {
                    ...course,
                    instructor,
                    enrollmentCount: enrollments.length,
                    lessonCount: lessons.length,
                };
            })
        );

        return enrichedCourses;
    },
});

// Get course by ID with modules and lessons
export const getWithContent = query({
    args: { courseId: v.id("courses") },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const course = await ctx.db.get(args.courseId);
        if (!course) return null;

        const modules = await ctx.db
            .query("modules")
            .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
            .collect();

        const modulesWithLessons = await Promise.all(
            modules.map(async (module) => {
                const lessons = await ctx.db
                    .query("lessons")
                    .withIndex("by_module", (q) => q.eq("moduleId", module._id))
                    .collect();
                return {
                    ...module,
                    lessons: lessons.sort((a, b) => a.order - b.order),
                };
            })
        );

        // Get instructor info
        const instructor = await ctx.db.get(course.instructorId);

        return {
            ...course,
            instructor,
            modules: modulesWithLessons.sort((a, b) => a.order - b.order),
        };
    },
});

// Get courses by instructor
export const getByInstructor = query({
    args: { instructorId: v.id("users") },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        return await ctx.db
            .query("courses")
            .withIndex("by_instructor", (q) => q.eq("instructorId", args.instructorId))
            .collect();
    },
});

// Create course
export const create = mutation({
    args: {
        title: v.string(),
        slug: v.string(),
        description: v.string(),
        thumbnail: v.optional(v.string()),
        organizationId: v.id("organizations"),
        instructorId: v.id("users"),
        category: v.string(),
        level: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
        price: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const now = Date.now();
        return await ctx.db.insert("courses", {
            ...args,
            duration: 0,
            isPublished: false,
            isFeatured: false,
            createdAt: now,
            updatedAt: now,
        });
    },
});

// Update course
export const update = mutation({
    args: {
        courseId: v.id("courses"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        thumbnail: v.optional(v.string()),
        category: v.optional(v.string()),
        level: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
        isPublished: v.optional(v.boolean()),
        isFeatured: v.optional(v.boolean()),
        price: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const { courseId, ...updates } = args;
        await ctx.db.patch(courseId, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

// Delete course
export const remove = mutation({
    args: { courseId: v.id("courses") },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        // Delete all lessons
        const lessons = await ctx.db
            .query("lessons")
            .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
            .collect();
        for (const lesson of lessons) {
            await ctx.db.delete(lesson._id);
        }

        // Delete all modules
        const modules = await ctx.db
            .query("modules")
            .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
            .collect();
        for (const module of modules) {
            await ctx.db.delete(module._id);
        }

        // Delete course
        await ctx.db.delete(args.courseId);
    },
});

// Create module
export const createModule = mutation({
    args: {
        courseId: v.id("courses"),
        title: v.string(),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const existingModules = await ctx.db
            .query("modules")
            .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
            .collect();

        const now = Date.now();
        return await ctx.db.insert("modules", {
            courseId: args.courseId,
            title: args.title,
            description: args.description,
            order: existingModules.length,
            isPublished: false,
            createdAt: now,
            updatedAt: now,
        });
    },
});

// Create lesson
export const createLesson = mutation({
    args: {
        moduleId: v.id("modules"),
        courseId: v.id("courses"),
        title: v.string(),
        description: v.optional(v.string()),
        // Tipo de aula
        type: v.union(
            v.literal("video"),
            v.literal("text"),
            v.literal("pdf"),
            v.literal("assignment"),
            v.literal("exam")
        ),
        // Para vídeo
        videoUrl: v.optional(v.string()),
        videoProvider: v.optional(v.union(v.literal("youtube"), v.literal("bunny"), v.literal("upload"))),
        // Para texto
        textContent: v.optional(v.string()),
        // Para PDF/arquivo
        fileUrl: v.optional(v.string()),
        fileStorageId: v.optional(v.id("_storage")),
        fileName: v.optional(v.string()),
        // Para trabalhos e provas
        dueDate: v.optional(v.number()),
        maxScore: v.optional(v.number()),
        instructions: v.optional(v.string()),
        // Comum
        duration: v.number(),
        isFree: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const existingLessons = await ctx.db
            .query("lessons")
            .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
            .collect();

        const now = Date.now();
        const lessonId = await ctx.db.insert("lessons", {
            moduleId: args.moduleId,
            courseId: args.courseId,
            title: args.title,
            description: args.description,
            type: args.type,
            videoUrl: args.videoUrl,
            videoProvider: args.videoProvider,
            textContent: args.textContent,
            fileUrl: args.fileUrl,
            fileStorageId: args.fileStorageId,
            fileName: args.fileName,
            dueDate: args.dueDate,
            maxScore: args.maxScore,
            instructions: args.instructions,
            duration: args.duration,
            order: existingLessons.length,
            isPublished: false,
            isFree: args.isFree || false,
            createdAt: now,
            updatedAt: now,
        });

        // Update course duration
        const course = await ctx.db.get(args.courseId);
        if (course) {
            await ctx.db.patch(args.courseId, {
                duration: course.duration + args.duration,
                updatedAt: now,
            });
        }

        return lessonId;
    },
});

// Update lesson
export const updateLesson = mutation({
    args: {
        lessonId: v.id("lessons"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        // Tipo de aula
        type: v.optional(v.union(
            v.literal("video"),
            v.literal("text"),
            v.literal("pdf"),
            v.literal("assignment"),
            v.literal("exam")
        )),
        // Para vídeo
        videoUrl: v.optional(v.string()),
        videoProvider: v.optional(v.union(v.literal("youtube"), v.literal("bunny"), v.literal("upload"))),
        // Para texto
        textContent: v.optional(v.string()),
        // Para PDF/arquivo
        fileUrl: v.optional(v.string()),
        fileStorageId: v.optional(v.id("_storage")),
        fileName: v.optional(v.string()),
        // Para trabalhos e provas
        dueDate: v.optional(v.number()),
        maxScore: v.optional(v.number()),
        instructions: v.optional(v.string()),
        // Comum
        duration: v.optional(v.number()),
        isFree: v.optional(v.boolean()),
        isPublished: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const lesson = await ctx.db.get(args.lessonId);
        if (!lesson) {
            throw new Error("Aula não encontrada");
        }

        const { lessonId, ...updates } = args;
        const oldDuration = lesson.duration ?? 0;
        const newDuration = updates.duration ?? oldDuration;

        // Filtrar campos undefined para evitar erros no Convex
        const filteredUpdates: Record<string, any> = {};
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                filteredUpdates[key] = value;
            }
        }

        // Update lesson
        await ctx.db.patch(lessonId, {
            ...filteredUpdates,
            updatedAt: Date.now(),
        });

        // Update course duration if duration changed
        if (updates.duration !== undefined && updates.duration !== oldDuration) {
            const course = await ctx.db.get(lesson.courseId);
            if (course) {
                const courseDuration = course.duration ?? 0;
                await ctx.db.patch(lesson.courseId, {
                    duration: Math.max(0, courseDuration - oldDuration + newDuration),
                    updatedAt: Date.now(),
                });
            }
        }

        return lessonId;
    },
});

// Delete lesson
export const deleteLesson = mutation({
    args: {
        lessonId: v.id("lessons"),
    },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const lesson = await ctx.db.get(args.lessonId);
        if (!lesson) {
            throw new Error("Aula não encontrada");
        }

        // Update course duration
        const course = await ctx.db.get(lesson.courseId);
        if (course) {
            const lessonDuration = lesson.duration ?? 0;
            const courseDuration = course.duration ?? 0;
            await ctx.db.patch(lesson.courseId, {
                duration: Math.max(0, courseDuration - lessonDuration),
                updatedAt: Date.now(),
            });
        }

        // Reorder remaining lessons
        const remainingLessons = await ctx.db
            .query("lessons")
            .withIndex("by_module", (q) => q.eq("moduleId", lesson.moduleId))
            .collect();

        const lessonsToReorder = remainingLessons
            .filter(l => l._id !== lesson._id && l.order > lesson.order)
            .sort((a, b) => a.order - b.order);

        for (const l of lessonsToReorder) {
            await ctx.db.patch(l._id, { order: l.order - 1 });
        }

        // Delete lesson
        await ctx.db.delete(args.lessonId);
    },
});

// Get course stats
export const getStats = query({
    args: { courseId: v.id("courses") },
    handler: async (ctx, args) => {
        // Verificar autenticação
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Não autenticado");
        }

        const enrollments = await ctx.db
            .query("enrollments")
            .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
            .collect();

        const completed = enrollments.filter((e) => e.completedAt);
        const totalProgress = enrollments.reduce((acc, e) => acc + e.progress, 0);

        return {
            totalEnrollments: enrollments.length,
            completedCount: completed.length,
            averageProgress: enrollments.length > 0 ? Math.round(totalProgress / enrollments.length) : 0,
            completionRate: enrollments.length > 0 ? Math.round((completed.length / enrollments.length) * 100) : 0,
        };
    },
});
