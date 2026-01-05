import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireAuthWithOrg, requireRole, requireCourseAccess } from "./authHelpers";

// Get all courses (filtrado por organização do usuário, ou todos para superadmin)
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        try {
            const auth = await requireAuth(ctx);

            const courses =
                auth.user.role === "superadmin"
                    ? await ctx.db.query("courses").collect()
                    : auth.user.organizationId
                        ? await ctx.db
                            .query("courses")
                            .withIndex("by_organization", (q) => q.eq("organizationId", auth.user.organizationId!))
                            .collect()
                        : [];

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
        } catch (error) {
            return [];
        }
    },
});

// ===============================================
// PUBLIC QUERIES - Não requerem autenticação
// ===============================================

// Get all public courses (sem autenticação)
export const getPublicCourses = query({
    args: {},
    handler: async (ctx) => {
        try {
            // Buscar cursos públicos e publicados
            const courses = await ctx.db
                .query("courses")
                .withIndex("by_public", (q) => q.eq("isPublic", true))
                .collect();

            // Filtrar apenas os publicados
            const publishedCourses = courses.filter(c => c.isPublished === true);

            // Enriquecer com dados do instrutor e organização
            const enrichedCourses = await Promise.all(
                publishedCourses.map(async (course) => {
                    const instructor = await ctx.db.get(course.instructorId);
                    const organization = await ctx.db.get(course.organizationId);

                    // Contar aulas
                    const lessons = await ctx.db
                        .query("lessons")
                        .withIndex("by_course", (q) => q.eq("courseId", course._id))
                        .collect();

                    // Contar matrículas
                    const enrollments = await ctx.db
                        .query("enrollments")
                        .withIndex("by_course", (q) => q.eq("courseId", course._id))
                        .collect();

                    return {
                        ...course,
                        instructor: instructor ? {
                            firstName: instructor.firstName,
                            lastName: instructor.lastName,
                            imageUrl: instructor.imageUrl,
                        } : null,
                        organization: organization ? { name: organization.name, logo: organization.logo } : null,
                        lessonCount: lessons.filter(l => l.isPublished).length,
                        enrollmentCount: enrollments.length,
                    };
                })
            );

            return enrichedCourses;
        } catch (error) {
            console.error("getPublicCourses error:", error);
            return [];
        }
    },
});

// Get all published courses for an organization (PUBLIC - sem autenticação)
// Retorna cursos publicados de uma organização específica
// Cursos públicos: qualquer um pode ver o conteúdo
// Cursos privados: aparecem na lista mas redirecionam para checkout/login
export const getPublicCoursesByOrganization = query({
    args: { organizationSlug: v.string() },
    handler: async (ctx, args) => {
        try {
            // Buscar organização pelo slug
            const org = await ctx.db
                .query("organizations")
                .withIndex("by_slug", (q) => q.eq("slug", args.organizationSlug))
                .first();

            if (!org || !org.isActive) {
                return [];
            }

            // Buscar cursos publicados dessa organização
            const courses = await ctx.db
                .query("courses")
                .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
                .collect();

            // Filtrar apenas os publicados
            const publishedCourses = courses.filter(c => c.isPublished === true);

            // Enriquecer com dados do instrutor
            const enrichedCourses = await Promise.all(
                publishedCourses.map(async (course) => {
                    const instructor = await ctx.db.get(course.instructorId);

                    // Contar aulas
                    const lessons = await ctx.db
                        .query("lessons")
                        .withIndex("by_course", (q) => q.eq("courseId", course._id))
                        .collect();

                    // Contar matrículas
                    const enrollments = await ctx.db
                        .query("enrollments")
                        .withIndex("by_course", (q) => q.eq("courseId", course._id))
                        .collect();

                    return {
                        ...course,
                        instructor: instructor ? {
                            firstName: instructor.firstName,
                            lastName: instructor.lastName,
                            imageUrl: instructor.imageUrl,
                        } : null,
                        lessonCount: lessons.filter(l => l.isPublished).length,
                        enrollmentCount: enrollments.length,
                    };
                })
            );

            return enrichedCourses;
        } catch (error) {
            console.error("getPublicCoursesByOrganization error:", error);
            return [];
        }
    },
});

// Get public course by slug with content (sem autenticação)
export const getPublicCourseBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        try {
            const course = await ctx.db
                .query("courses")
                .withIndex("by_slug", (q) => q.eq("slug", args.slug))
                .first();

            // Curso deve existir, estar publicado E ser público
            if (!course || !course.isPublished || !course.isPublic) {
                return null;
            }

            // Buscar módulos publicados
            const modules = await ctx.db
                .query("modules")
                .withIndex("by_course", (q) => q.eq("courseId", course._id))
                .collect();

            const modulesWithLessons = await Promise.all(
                modules
                    .filter(m => m.isPublished)
                    .map(async (mod) => {
                        const lessons = await ctx.db
                            .query("lessons")
                            .withIndex("by_module", (q) => q.eq("moduleId", mod._id))
                            .collect();

                        // Para visitantes não autenticados, mostrar todas as aulas
                        // mas marcar quais são gratuitas (isFree) para acesso ao conteúdo
                        const publishedLessons = lessons
                            .filter(l => l.isPublished)
                            .sort((a, b) => a.order - b.order)
                            .map(lesson => ({
                                ...lesson,
                                // Ocultar conteúdo de vídeo/texto se não for gratuita
                                videoUrl: lesson.isFree ? lesson.videoUrl : undefined,
                                textContent: lesson.isFree ? lesson.textContent : undefined,
                                fileUrl: lesson.isFree ? lesson.fileUrl : undefined,
                            }));

                        return {
                            ...mod,
                            lessons: publishedLessons,
                        };
                    })
            );

            const instructor = await ctx.db.get(course.instructorId);
            const organization = await ctx.db.get(course.organizationId);

            // Contar matrículas
            const enrollments = await ctx.db
                .query("enrollments")
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
                organization: organization ? {
                    name: organization.name,
                    logo: organization.logo,
                    slug: organization.slug,
                } : null,
                modules: modulesWithLessons.sort((a, b) => a.order - b.order),
                enrollmentCount: enrollments.length,
            };
        } catch (error) {
            console.error("getPublicCourseBySlug error:", error);
            return null;
        }
    },
});


export const getById = query({
    args: { courseId: v.id("courses") },
    handler: async (ctx, args) => {
        try {
            const auth = await requireAuth(ctx);
            const course = await ctx.db.get(args.courseId);
            if (!course) return null;

            if (auth.user.role !== "superadmin" && auth.user.organizationId !== course.organizationId) {
                return null;
            }

            return course;
        } catch (error) {
            return null;
        }
    },
});

// Get course by slug (for friendly URLs)
export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        try {
            // Verificar autenticação primeiro
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) {
                return null;
            }

            const user = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();

            if (!user || user.isActive === false) {
                return null;
            }

            const course = await ctx.db
                .query("courses")
                .withIndex("by_slug", (q) => q.eq("slug", args.slug))
                .first();

            if (!course) return null;

            if (user.role !== "superadmin" && user.organizationId !== course.organizationId) {
                return null;
            }

            return course;
        } catch (error) {
            return null;
        }
    },
});

// Get course by slug with modules and lessons (for friendly URLs)
export const getWithContentBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        try {
            // Verificar autenticação primeiro
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) {
                console.log("getWithContentBySlug: Usuário não autenticado");
                return null;
            }

            const user = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();

            if (!user) {
                console.log("getWithContentBySlug: Usuário não encontrado no sistema");
                return null;
            }

            if (user.isActive === false) {
                console.log("getWithContentBySlug: Usuário inativo");
                return null;
            }

            const course = await ctx.db
                .query("courses")
                .withIndex("by_slug", (q) => q.eq("slug", args.slug))
                .first();

            if (!course) {
                console.log("getWithContentBySlug: Curso não encontrado com slug:", args.slug);
                return null;
            }

            if (user.role !== "superadmin" && user.organizationId !== course.organizationId) {
                console.log("getWithContentBySlug: Acesso negado - organizações diferentes");
                return null;
            }

            const modules = await ctx.db
                .query("modules")
                .withIndex("by_course", (q) => q.eq("courseId", course._id))
                .collect();

            const modulesWithLessons = await Promise.all(
                modules.map(async (courseModule) => {
                    const lessons = await ctx.db
                        .query("lessons")
                        .withIndex("by_module", (q) => q.eq("moduleId", courseModule._id))
                        .collect();
                    return {
                        ...courseModule,
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
        } catch (error) {
            console.error("getWithContentBySlug: Erro ao buscar curso:", error);
            return null;
        }
    },
});

// Get all courses for an organization
export const getByOrganization = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        try {
            await requireAuthWithOrg(ctx, args.organizationId);

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
            return [];
        }
    },
});

// Get published courses for an organization (catalog)
export const getPublishedByOrganization = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        try {
            await requireAuthWithOrg(ctx, args.organizationId);

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
        } catch (error) {
            return [];
        }
    },
});

// Get course by ID with modules and lessons
export const getWithContent = query({
    args: { courseId: v.id("courses") },
    handler: async (ctx, args) => {
        try {
            // Verificar autenticação primeiro
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) {
                return null;
            }

            const user = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();

            if (!user) {
                return null;
            }

            if (user.isActive === false) {
                return null;
            }

            const course = await ctx.db.get(args.courseId);
            if (!course) {
                return null;
            }
            if (user.role !== "superadmin" && user.organizationId !== course.organizationId) {
                return null;
            }

            const modules = await ctx.db
                .query("modules")
                .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
                .collect();

            const modulesWithLessons = await Promise.all(
                modules.map(async (courseModule) => {
                    const lessons = await ctx.db
                        .query("lessons")
                        .withIndex("by_module", (q) => q.eq("moduleId", courseModule._id))
                        .collect();
                    return {
                        ...courseModule,
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
        } catch (error) {
            console.error("getWithContent: Erro ao buscar curso:", error);
            return null;
        }
    },
});

// Get courses by instructor
export const getByInstructor = query({
    args: { instructorId: v.id("users") },
    handler: async (ctx, args) => {
        try {
            const auth = await requireRole(ctx, ["superadmin", "admin", "professor"]);

            if (auth.user.role === "professor" && auth.user._id !== args.instructorId) {
                return [];
            }

            if (auth.user.role === "admin") {
                const instructor = await ctx.db.get(args.instructorId);
                if (!instructor) return [];
                if (!auth.user.organizationId || instructor.organizationId !== auth.user.organizationId) return [];
            }

            const courses = await ctx.db
                .query("courses")
                .withIndex("by_instructor", (q) => q.eq("instructorId", args.instructorId))
                .collect();

            if (auth.user.role !== "superadmin") {
                return courses.filter((c) => c.organizationId === auth.user.organizationId);
            }
            return courses;
        } catch (error) {
            return [];
        }
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
        certificateTemplateId: v.optional(v.id("certificateTemplates")),
    },
    handler: async (ctx, args) => {
        try {
            const auth = await requireRole(ctx, ["superadmin", "admin", "professor"]);

            const organizationId =
                auth.user.role === "superadmin"
                    ? args.organizationId
                    : auth.user.organizationId;
            if (!organizationId) throw new Error("Organização não encontrada");

            const instructorId =
                auth.user.role === "professor"
                    ? auth.user._id
                    : args.instructorId;

            if (auth.user.role === "admin" && args.organizationId !== auth.user.organizationId) {
                throw new Error("Acesso negado");
            }

            const instructor = await ctx.db.get(instructorId);
            if (!instructor) throw new Error("Instrutor não encontrado");
            if (auth.user.role !== "superadmin" && instructor.organizationId !== organizationId) {
                throw new Error("Acesso negado");
            }

            const now = Date.now();
            const courseId = await ctx.db.insert("courses", {
                ...args,
                organizationId,
                instructorId,
                duration: 0,
                isPublished: false,
                isFeatured: false,
                createdAt: now,
                updatedAt: now,
            });
            return courseId;
        } catch (error) {
            throw error;
        }
    },
});

// Update course
export const update = mutation({
    args: {
        courseId: v.id("courses"),
        title: v.optional(v.string()),
        slug: v.optional(v.string()),
        description: v.optional(v.string()),
        thumbnail: v.optional(v.string()),
        category: v.optional(v.string()),
        level: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
        instructorId: v.optional(v.id("users")),
        isPublished: v.optional(v.boolean()),
        isPublic: v.optional(v.boolean()),
        isFeatured: v.optional(v.boolean()),
        price: v.optional(v.number()),
        certificateTemplateId: v.optional(v.id("certificateTemplates")),
    },
    handler: async (ctx, args) => {
        try {
            await requireCourseAccess(ctx, args.courseId);
            const { courseId, ...updates } = args;
            const filteredUpdates: Record<string, any> = {};
            for (const [key, value] of Object.entries(updates)) {
                if (value !== undefined) {
                    filteredUpdates[key] = value;
                }
            }
            await ctx.db.patch(courseId, {
                ...filteredUpdates,
                updatedAt: Date.now(),
            });
        } catch (error) {
            throw error;
        }
    },
});

// Delete course
export const remove = mutation({
    args: { courseId: v.id("courses") },
    handler: async (ctx, args) => {
        try {
            await requireCourseAccess(ctx, args.courseId);

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
            for (const courseModule of modules) {
                await ctx.db.delete(courseModule._id);
            }

            // Delete course
            await ctx.db.delete(args.courseId);
        } catch (error) {
            throw error;
        }
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
        await requireCourseAccess(ctx, args.courseId);

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
        await requireCourseAccess(ctx, args.courseId);

        const courseModule = await ctx.db.get(args.moduleId);
        if (!courseModule) throw new Error("Módulo não encontrado");
        if (courseModule.courseId !== args.courseId) throw new Error("Acesso negado");

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
        const lesson = await ctx.db.get(args.lessonId);
        if (!lesson) {
            throw new Error("Aula não encontrada");
        }
        await requireCourseAccess(ctx, lesson.courseId);

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
        const lesson = await ctx.db.get(args.lessonId);
        if (!lesson) {
            throw new Error("Aula não encontrada");
        }
        await requireCourseAccess(ctx, lesson.courseId);

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
        // Valores padrão
        const defaultStats = {
            totalEnrollments: 0,
            completedCount: 0,
            averageProgress: 0,
            completionRate: 0,
        };

        try {
            await requireCourseAccess(ctx, args.courseId);

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
        } catch (error) {
            return defaultStats;
        }
    },
});
