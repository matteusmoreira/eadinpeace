import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAuth, requireRole, requireAuthWithOrg } from "./authHelpers";

// ================================
// QUERIES
// ================================

// Obter todas as turmas (filtrado por organização/role)
export const getAll = query({
    args: {
        organizationId: v.optional(v.id("organizations")),
    },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) return [];

            const user = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();

            if (!user) return [];

            let classes: any[] = [];

            if (user.role === "superadmin") {
                // Superadmin vê todas ou filtra por organização
                if (args.organizationId) {
                    classes = await ctx.db
                        .query("classes")
                        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId!))
                        .collect();
                } else {
                    classes = await ctx.db.query("classes").collect();
                }
            } else if (user.role === "admin") {
                // Admin vê turmas da sua organização
                if (!user.organizationId) return [];
                classes = await ctx.db
                    .query("classes")
                    .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId!))
                    .collect();
            } else if (user.role === "professor") {
                // Professor vê turmas onde é instrutor
                const instructorRecords = await ctx.db
                    .query("classInstructors")
                    .withIndex("by_user", (q) => q.eq("userId", user._id))
                    .collect();
                const classIds = instructorRecords.map((r) => r.classId);
                const classResults = await Promise.all(classIds.map((id) => ctx.db.get(id)));
                classes = classResults.filter(Boolean) as any[];
            } else {
                // Aluno vê turmas onde está inscrito
                const enrollments = await ctx.db
                    .query("classEnrollments")
                    .withIndex("by_user", (q) => q.eq("userId", user._id))
                    .collect();
                const classIds = enrollments.filter((e) => e.status === "active").map((e) => e.classId);
                const classResults = await Promise.all(classIds.map((id) => ctx.db.get(id)));
                classes = classResults.filter(Boolean) as any[];
            }

            // Enriquecer com dados do curso e contagens
            const enrichedClasses = await Promise.all(
                classes.map(async (cls: any) => {
                    try {
                        if (!cls || !cls._id) return null;

                        const course = cls.courseId ? await ctx.db.get(cls.courseId) : null;
                        const enrollments = await ctx.db
                            .query("classEnrollments")
                            .withIndex("by_class", (q) => q.eq("classId", cls._id))
                            .collect();
                        const instructors = await ctx.db
                            .query("classInstructors")
                            .withIndex("by_class", (q) => q.eq("classId", cls._id))
                            .collect();

                        return {
                            ...cls,
                            course: course ? { _id: course._id, title: (course as any).title, thumbnail: (course as any).thumbnail } : null,
                            enrolledCount: enrollments.filter((e) => e.status === "active").length,
                            pendingCount: enrollments.filter((e) => e.status === "pending").length,
                            instructorCount: instructors.length,
                        };
                    } catch {
                        // Se falhar ao enriquecer uma turma, retorna ela básica
                        return {
                            ...cls,
                            course: null,
                            enrolledCount: 0,
                            pendingCount: 0,
                            instructorCount: 0,
                        };
                    }
                })
            );

            return enrichedClasses.filter(Boolean);
        } catch (error) {
            console.error("Error in classes:getAll:", error);
            return [];
        }
    },
});

// Obter turma por ID
export const getById = query({
    args: { classId: v.id("classes") },
    handler: async (ctx, args) => {
        try {
            const cls = await ctx.db.get(args.classId);
            if (!cls) return null;

            const course = await ctx.db.get(cls.courseId);
            const organization = await ctx.db.get(cls.organizationId);

            // Obter professores
            const instructorRecords = await ctx.db
                .query("classInstructors")
                .withIndex("by_class", (q) => q.eq("classId", args.classId))
                .collect();
            const instructors = await Promise.all(
                instructorRecords.map(async (record) => {
                    const user = await ctx.db.get(record.userId);
                    return user ? { ...record, user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, imageUrl: user.imageUrl } } : null;
                })
            );

            // Obter contagens de inscrições
            const enrollments = await ctx.db
                .query("classEnrollments")
                .withIndex("by_class", (q) => q.eq("classId", args.classId))
                .collect();

            // Obter tokens de matrícula
            const tokens = await ctx.db
                .query("enrollmentTokens")
                .withIndex("by_class", (q) => q.eq("classId", args.classId))
                .collect();

            return {
                ...cls,
                course,
                organization,
                instructors: instructors.filter(Boolean),
                enrolledCount: enrollments.filter((e) => e.status === "active").length,
                pendingCount: enrollments.filter((e) => e.status === "pending").length,
                completedCount: enrollments.filter((e) => e.status === "completed").length,
                tokens: tokens.filter((t) => t.isActive),
            };
        } catch {
            return null;
        }
    },
});

// Obter turmas de um curso
export const getByCourse = query({
    args: { courseId: v.id("courses") },
    handler: async (ctx, args) => {
        try {
            const classes = await ctx.db
                .query("classes")
                .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
                .collect();

            return Promise.all(
                classes.map(async (cls) => {
                    const enrollments = await ctx.db
                        .query("classEnrollments")
                        .withIndex("by_class", (q) => q.eq("classId", cls._id))
                        .collect();
                    return {
                        ...cls,
                        enrolledCount: enrollments.filter((e) => e.status === "active").length,
                    };
                })
            );
        } catch {
            return [];
        }
    },
});

// Obter turmas onde o usuário é professor
export const getByInstructor = query({
    args: { userId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) return [];

            let targetUserId = args.userId;
            if (!targetUserId) {
                const user = await ctx.db
                    .query("users")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                    .first();
                if (!user) return [];
                targetUserId = user._id;
            }

            const instructorRecords = await ctx.db
                .query("classInstructors")
                .withIndex("by_user", (q) => q.eq("userId", targetUserId!))
                .collect();

            const classes = await Promise.all(
                instructorRecords.map(async (record) => {
                    const cls = await ctx.db.get(record.classId);
                    if (!cls) return null;
                    const course = await ctx.db.get(cls.courseId);
                    const enrollments = await ctx.db
                        .query("classEnrollments")
                        .withIndex("by_class", (q) => q.eq("classId", cls._id))
                        .collect();
                    return {
                        ...cls,
                        course: course ? { _id: course._id, title: (course as any).title, thumbnail: (course as any).thumbnail } : null,
                        enrolledCount: enrollments.filter((e) => e.status === "active").length,
                        instructorRole: record.role,
                        permissions: record.permissions,
                    };
                })
            );

            return classes.filter(Boolean);
        } catch {
            return [];
        }
    },
});

// Obter turmas onde o usuário é aluno
export const getByStudent = query({
    args: { userId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) return [];

            let targetUserId = args.userId;
            if (!targetUserId) {
                const user = await ctx.db
                    .query("users")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                    .first();
                if (!user) return [];
                targetUserId = user._id;
            }

            const enrollments = await ctx.db
                .query("classEnrollments")
                .withIndex("by_user", (q) => q.eq("userId", targetUserId!))
                .collect();

            const classes = await Promise.all(
                enrollments.map(async (enrollment) => {
                    const cls = await ctx.db.get(enrollment.classId);
                    if (!cls) return null;
                    const course = await ctx.db.get(cls.courseId);

                    // Calcular progresso na turma
                    const progress = await ctx.db
                        .query("classProgress")
                        .withIndex("by_class_user", (q) => q.eq("classId", cls._id).eq("userId", targetUserId!))
                        .collect();
                    const completedLessons = progress.filter((p) => p.isCompleted).length;

                    // Obter total de aulas do curso
                    const lessons = await ctx.db
                        .query("lessons")
                        .withIndex("by_course", (q) => q.eq("courseId", cls.courseId))
                        .collect();

                    const progressPercent = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;

                    return {
                        ...cls,
                        course: course ? { _id: course._id, title: (course as any).title, thumbnail: (course as any).thumbnail } : null,
                        enrollmentStatus: enrollment.status,
                        enrolledAt: enrollment.enrolledAt,
                        progressPercent,
                        completedLessons,
                        totalLessons: lessons.length,
                    };
                })
            );

            return classes.filter(Boolean);
        } catch {
            return [];
        }
    },
});

// Obter alunos de uma turma
export const getEnrollments = query({
    args: { classId: v.id("classes") },
    handler: async (ctx, args) => {
        try {
            const enrollments = await ctx.db
                .query("classEnrollments")
                .withIndex("by_class", (q) => q.eq("classId", args.classId))
                .collect();

            const cls = await ctx.db.get(args.classId);
            if (!cls) return [];

            const lessons = await ctx.db
                .query("lessons")
                .withIndex("by_course", (q) => q.eq("courseId", cls.courseId))
                .collect();
            const totalLessons = lessons.length;

            const enrichedEnrollments = await Promise.all(
                enrollments.map(async (enrollment) => {
                    const user = await ctx.db.get(enrollment.userId);
                    if (!user) return null;

                    // Calcular progresso
                    const progress = await ctx.db
                        .query("classProgress")
                        .withIndex("by_class_user", (q) => q.eq("classId", args.classId).eq("userId", enrollment.userId))
                        .collect();
                    const completedLessons = progress.filter((p) => p.isCompleted).length;
                    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

                    // Calcular média de notas
                    const gradedProgress = progress.filter((p) => p.score !== undefined);
                    const averageScore = gradedProgress.length > 0
                        ? Math.round(gradedProgress.reduce((sum, p) => sum + (p.score || 0), 0) / gradedProgress.length)
                        : null;

                    return {
                        ...enrollment,
                        user: {
                            _id: user._id,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            imageUrl: user.imageUrl,
                        },
                        progressPercent,
                        completedLessons,
                        totalLessons,
                        averageScore,
                        lastActivity: progress.length > 0 ? Math.max(...progress.map((p) => p.lastAccessedAt)) : null,
                    };
                })
            );

            return enrichedEnrollments.filter(Boolean);
        } catch {
            return [];
        }
    },
});

// Obter estatísticas da turma
export const getStats = query({
    args: { classId: v.id("classes") },
    handler: async (ctx, args) => {
        try {
            const cls = await ctx.db.get(args.classId);
            if (!cls) return null;

            const enrollments = await ctx.db
                .query("classEnrollments")
                .withIndex("by_class", (q) => q.eq("classId", args.classId))
                .collect();

            const activeEnrollments = enrollments.filter((e) => e.status === "active");
            const completedEnrollments = enrollments.filter((e) => e.status === "completed");

            // Obter total de aulas
            const lessons = await ctx.db
                .query("lessons")
                .withIndex("by_course", (q) => q.eq("courseId", cls.courseId))
                .collect();

            // Calcular progresso médio
            let totalProgress = 0;
            for (const enrollment of activeEnrollments) {
                const progress = await ctx.db
                    .query("classProgress")
                    .withIndex("by_class_user", (q) => q.eq("classId", args.classId).eq("userId", enrollment.userId))
                    .collect();
                const completed = progress.filter((p) => p.isCompleted).length;
                totalProgress += lessons.length > 0 ? (completed / lessons.length) * 100 : 0;
            }
            const averageProgress = activeEnrollments.length > 0 ? Math.round(totalProgress / activeEnrollments.length) : 0;

            return {
                totalEnrolled: activeEnrollments.length,
                pendingEnrollments: enrollments.filter((e) => e.status === "pending").length,
                completedCount: completedEnrollments.length,
                droppedCount: enrollments.filter((e) => e.status === "dropped").length,
                averageProgress,
                totalLessons: lessons.length,
                capacity: cls.capacity,
                spotsAvailable: cls.capacity ? cls.capacity - activeEnrollments.length : null,
            };
        } catch {
            return null;
        }
    },
});

// Obter progresso de um aluno em uma turma
export const getStudentProgress = query({
    args: {
        classId: v.id("classes"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        try {
            const cls = await ctx.db.get(args.classId);
            if (!cls) return null;

            const user = await ctx.db.get(args.userId);
            if (!user) return null;

            const enrollment = await ctx.db
                .query("classEnrollments")
                .withIndex("by_class_user", (q) => q.eq("classId", args.classId).eq("userId", args.userId))
                .first();

            if (!enrollment) return null;

            // Obter módulos e aulas do curso
            const modules = await ctx.db
                .query("modules")
                .withIndex("by_course", (q) => q.eq("courseId", cls.courseId))
                .collect();

            const lessons = await ctx.db
                .query("lessons")
                .withIndex("by_course", (q) => q.eq("courseId", cls.courseId))
                .collect();

            // Obter progresso do aluno
            const progress = await ctx.db
                .query("classProgress")
                .withIndex("by_class_user", (q) => q.eq("classId", args.classId).eq("userId", args.userId))
                .collect();

            // Obter configurações de módulo da turma
            const moduleSettings = await ctx.db
                .query("classModuleSettings")
                .withIndex("by_class", (q) => q.eq("classId", args.classId))
                .collect();

            // Montar estrutura de módulos com aulas e progresso
            const moduleDetails = modules.map((module) => {
                const moduleLessons = lessons.filter((l) => l.moduleId === module._id);
                const settings = moduleSettings.find((s) => s.moduleId === module._id);

                const lessonDetails = moduleLessons.map((lesson) => {
                    const lessonProgress = progress.find((p) => p.lessonId === lesson._id);
                    return {
                        ...lesson,
                        progress: lessonProgress || null,
                        isCompleted: lessonProgress?.isCompleted || false,
                        score: lessonProgress?.score,
                    };
                });

                const completedInModule = lessonDetails.filter((l) => l.isCompleted).length;

                return {
                    ...module,
                    settings,
                    lessons: lessonDetails,
                    completedLessons: completedInModule,
                    totalLessons: moduleLessons.length,
                    progressPercent: moduleLessons.length > 0 ? Math.round((completedInModule / moduleLessons.length) * 100) : 0,
                };
            });

            const totalCompleted = progress.filter((p) => p.isCompleted).length;
            const overallProgress = lessons.length > 0 ? Math.round((totalCompleted / lessons.length) * 100) : 0;

            // Calcular média de notas
            const gradedProgress = progress.filter((p) => p.score !== undefined);
            const averageScore = gradedProgress.length > 0
                ? Math.round(gradedProgress.reduce((sum, p) => sum + (p.score || 0), 0) / gradedProgress.length)
                : null;

            return {
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    imageUrl: user.imageUrl,
                },
                enrollment,
                modules: moduleDetails,
                overallProgress,
                completedLessons: totalCompleted,
                totalLessons: lessons.length,
                averageScore,
                lastActivity: progress.length > 0 ? Math.max(...progress.map((p) => p.lastAccessedAt)) : null,
            };
        } catch {
            return null;
        }
    },
});

// Verificar token de matrícula
export const verifyEnrollmentToken = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        try {
            const tokenRecord = await ctx.db
                .query("enrollmentTokens")
                .withIndex("by_token", (q) => q.eq("token", args.token))
                .first();

            if (!tokenRecord) return { valid: false, error: "Token inválido" };
            if (!tokenRecord.isActive) return { valid: false, error: "Token desativado" };
            if (tokenRecord.expiresAt && tokenRecord.expiresAt < Date.now()) return { valid: false, error: "Token expirado" };
            if (tokenRecord.usageLimit && tokenRecord.usageCount >= tokenRecord.usageLimit) return { valid: false, error: "Token atingiu limite de uso" };

            const cls = await ctx.db.get(tokenRecord.classId);
            if (!cls) return { valid: false, error: "Turma não encontrada" };
            if (!cls.isActive) return { valid: false, error: "Turma inativa" };

            const course = await ctx.db.get(cls.courseId);

            // Verificar capacidade
            const enrollments = await ctx.db
                .query("classEnrollments")
                .withIndex("by_status", (q) => q.eq("classId", cls._id).eq("status", "active"))
                .collect();

            if (cls.capacity && enrollments.length >= cls.capacity) {
                return { valid: false, error: "Turma lotada" };
            }

            return {
                valid: true,
                class: {
                    _id: cls._id,
                    name: cls.name,
                    description: cls.description,
                    startDate: cls.startDate,
                    endDate: cls.endDate,
                },
                course: course ? { _id: course._id, title: (course as any).title, thumbnail: (course as any).thumbnail } : null,
                requiresApproval: cls.requiresApproval,
            };
        } catch {
            return { valid: false, error: "Erro ao verificar token" };
        }
    },
});

// ================================
// MUTATIONS
// ================================

// Criar turma
export const create = mutation({
    args: {
        courseId: v.id("courses"),
        name: v.string(),
        description: v.optional(v.string()),
        startDate: v.number(),
        endDate: v.optional(v.number()),
        capacity: v.optional(v.number()),
        enrollmentType: v.union(
            v.literal("manual"),
            v.literal("open"),
            v.literal("token"),
            v.literal("approval")
        ),
        requiresApproval: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const auth = await requireRole(ctx, ["superadmin", "admin", "professor"]);

        const course = await ctx.db.get(args.courseId);
        if (!course) throw new Error("Curso não encontrado");

        // Verificar permissão de organização
        if (auth.user.role !== "superadmin" && auth.user.organizationId !== course.organizationId) {
            throw new Error("Sem permissão para criar turma neste curso");
        }

        const now = Date.now();

        const classId = await ctx.db.insert("classes", {
            courseId: args.courseId,
            organizationId: course.organizationId,
            name: args.name,
            description: args.description,
            startDate: args.startDate,
            endDate: args.endDate,
            capacity: args.capacity,
            isActive: true,
            enrollmentType: args.enrollmentType,
            requiresApproval: args.requiresApproval ?? false,
            createdAt: now,
            updatedAt: now,
        });

        // Se o criador é professor, adicioná-lo como instrutor principal
        if (auth.user.role === "professor") {
            await ctx.db.insert("classInstructors", {
                classId,
                userId: auth.user._id,
                role: "main",
                permissions: {
                    canManageStudents: true,
                    canEditContent: true,
                    canGrade: true,
                    canViewReports: true,
                },
                assignedAt: now,
            });
        }

        return classId;
    },
});

// Atualizar turma
export const update = mutation({
    args: {
        classId: v.id("classes"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        capacity: v.optional(v.number()),
        isActive: v.optional(v.boolean()),
        enrollmentType: v.optional(v.union(
            v.literal("manual"),
            v.literal("open"),
            v.literal("token"),
            v.literal("approval")
        )),
        requiresApproval: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const auth = await requireRole(ctx, ["superadmin", "admin", "professor"]);

        const cls = await ctx.db.get(args.classId);
        if (!cls) throw new Error("Turma não encontrada");

        // Verificar permissão
        if (auth.user.role === "professor") {
            const isInstructor = await ctx.db
                .query("classInstructors")
                .withIndex("by_class_user", (q) => q.eq("classId", args.classId).eq("userId", auth.user._id))
                .first();
            if (!isInstructor) throw new Error("Você não é instrutor desta turma");
        } else if (auth.user.role === "admin" && auth.user.organizationId !== cls.organizationId) {
            throw new Error("Sem permissão para editar esta turma");
        }

        const { classId, ...updates } = args;
        await ctx.db.patch(classId, {
            ...updates,
            updatedAt: Date.now(),
        });

        return classId;
    },
});

// Excluir turma
export const remove = mutation({
    args: { classId: v.id("classes") },
    handler: async (ctx, args) => {
        const auth = await requireRole(ctx, ["superadmin", "admin"]);

        const cls = await ctx.db.get(args.classId);
        if (!cls) throw new Error("Turma não encontrada");

        if (auth.user.role === "admin" && auth.user.organizationId !== cls.organizationId) {
            throw new Error("Sem permissão para excluir esta turma");
        }

        // Remover dados relacionados
        const enrollments = await ctx.db.query("classEnrollments").withIndex("by_class", (q) => q.eq("classId", args.classId)).collect();
        for (const e of enrollments) await ctx.db.delete(e._id);

        const instructors = await ctx.db.query("classInstructors").withIndex("by_class", (q) => q.eq("classId", args.classId)).collect();
        for (const i of instructors) await ctx.db.delete(i._id);

        const tokens = await ctx.db.query("enrollmentTokens").withIndex("by_class", (q) => q.eq("classId", args.classId)).collect();
        for (const t of tokens) await ctx.db.delete(t._id);

        const settings = await ctx.db.query("classModuleSettings").withIndex("by_class", (q) => q.eq("classId", args.classId)).collect();
        for (const s of settings) await ctx.db.delete(s._id);

        const progress = await ctx.db.query("classProgress").withIndex("by_class_user", (q) => q.eq("classId", args.classId)).collect();
        for (const p of progress) await ctx.db.delete(p._id);

        await ctx.db.delete(args.classId);
    },
});

// Adicionar professor à turma
export const addInstructor = mutation({
    args: {
        classId: v.id("classes"),
        userId: v.id("users"),
        role: v.union(v.literal("main"), v.literal("assistant")),
        permissions: v.optional(v.object({
            canManageStudents: v.boolean(),
            canEditContent: v.boolean(),
            canGrade: v.boolean(),
            canViewReports: v.boolean(),
        })),
    },
    handler: async (ctx, args) => {
        const auth = await requireRole(ctx, ["superadmin", "admin"]);

        const cls = await ctx.db.get(args.classId);
        if (!cls) throw new Error("Turma não encontrada");

        if (auth.user.role === "admin" && auth.user.organizationId !== cls.organizationId) {
            throw new Error("Sem permissão para gerenciar esta turma");
        }

        // Verificar se já é instrutor
        const existing = await ctx.db
            .query("classInstructors")
            .withIndex("by_class_user", (q) => q.eq("classId", args.classId).eq("userId", args.userId))
            .first();

        if (existing) throw new Error("Usuário já é instrutor desta turma");

        // Verificar se o usuário é professor
        const user = await ctx.db.get(args.userId);
        if (!user || (user.role !== "professor" && user.role !== "admin")) {
            throw new Error("Usuário deve ser professor ou admin");
        }

        await ctx.db.insert("classInstructors", {
            classId: args.classId,
            userId: args.userId,
            role: args.role,
            permissions: args.permissions ?? {
                canManageStudents: true,
                canEditContent: args.role === "main",
                canGrade: true,
                canViewReports: true,
            },
            assignedAt: Date.now(),
        });
    },
});

// Remover professor da turma
export const removeInstructor = mutation({
    args: {
        classId: v.id("classes"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const auth = await requireRole(ctx, ["superadmin", "admin"]);

        const cls = await ctx.db.get(args.classId);
        if (!cls) throw new Error("Turma não encontrada");

        if (auth.user.role === "admin" && auth.user.organizationId !== cls.organizationId) {
            throw new Error("Sem permissão para gerenciar esta turma");
        }

        const instructor = await ctx.db
            .query("classInstructors")
            .withIndex("by_class_user", (q) => q.eq("classId", args.classId).eq("userId", args.userId))
            .first();

        if (!instructor) throw new Error("Professor não encontrado na turma");

        await ctx.db.delete(instructor._id);
    },
});

// Inscrever aluno na turma
export const enrollStudent = mutation({
    args: {
        classId: v.id("classes"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const auth = await requireRole(ctx, ["superadmin", "admin", "professor"]);

        const cls = await ctx.db.get(args.classId);
        if (!cls) throw new Error("Turma não encontrada");

        // Verificar permissão
        if (auth.user.role === "professor") {
            const isInstructor = await ctx.db
                .query("classInstructors")
                .withIndex("by_class_user", (q) => q.eq("classId", args.classId).eq("userId", auth.user._id))
                .first();
            if (!isInstructor || !isInstructor.permissions.canManageStudents) {
                throw new Error("Sem permissão para gerenciar alunos desta turma");
            }
        } else if (auth.user.role === "admin" && auth.user.organizationId !== cls.organizationId) {
            throw new Error("Sem permissão para gerenciar esta turma");
        }

        // Verificar se já está inscrito
        const existing = await ctx.db
            .query("classEnrollments")
            .withIndex("by_class_user", (q) => q.eq("classId", args.classId).eq("userId", args.userId))
            .first();

        if (existing) {
            if (existing.status === "active") throw new Error("Aluno já está inscrito");
            if (existing.status === "pending") throw new Error("Aluno aguardando aprovação");
            // Se dropped ou completed, reinscrever
            await ctx.db.patch(existing._id, {
                status: "active",
                enrolledAt: Date.now(),
                enrolledBy: auth.user._id,
                enrolledVia: "manual",
                completedAt: undefined,
            });
            return existing._id;
        }

        // Verificar capacidade
        if (cls.capacity) {
            const activeEnrollments = await ctx.db
                .query("classEnrollments")
                .withIndex("by_status", (q) => q.eq("classId", args.classId).eq("status", "active"))
                .collect();
            if (activeEnrollments.length >= cls.capacity) {
                throw new Error("Turma atingiu capacidade máxima");
            }
        }

        await ctx.db.insert("classEnrollments", {
            classId: args.classId,
            userId: args.userId,
            status: "active",
            enrolledBy: auth.user._id,
            enrolledVia: "manual",
            enrolledAt: Date.now(),
        });
    },
});

// Remover aluno da turma
export const removeStudent = mutation({
    args: {
        classId: v.id("classes"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const auth = await requireRole(ctx, ["superadmin", "admin", "professor"]);

        const cls = await ctx.db.get(args.classId);
        if (!cls) throw new Error("Turma não encontrada");

        // Verificar permissão
        if (auth.user.role === "professor") {
            const isInstructor = await ctx.db
                .query("classInstructors")
                .withIndex("by_class_user", (q) => q.eq("classId", args.classId).eq("userId", auth.user._id))
                .first();
            if (!isInstructor || !isInstructor.permissions.canManageStudents) {
                throw new Error("Sem permissão para gerenciar alunos desta turma");
            }
        }

        const enrollment = await ctx.db
            .query("classEnrollments")
            .withIndex("by_class_user", (q) => q.eq("classId", args.classId).eq("userId", args.userId))
            .first();

        if (!enrollment) throw new Error("Inscrição não encontrada");

        await ctx.db.patch(enrollment._id, { status: "dropped" });
    },
});

// Aprovar inscrição
export const approveEnrollment = mutation({
    args: {
        classId: v.id("classes"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const auth = await requireRole(ctx, ["superadmin", "admin", "professor"]);

        const enrollment = await ctx.db
            .query("classEnrollments")
            .withIndex("by_class_user", (q) => q.eq("classId", args.classId).eq("userId", args.userId))
            .first();

        if (!enrollment) throw new Error("Inscrição não encontrada");
        if (enrollment.status !== "pending") throw new Error("Inscrição não está pendente");

        await ctx.db.patch(enrollment._id, { status: "active" });
    },
});

// Rejeitar inscrição
export const rejectEnrollment = mutation({
    args: {
        classId: v.id("classes"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const auth = await requireRole(ctx, ["superadmin", "admin", "professor"]);

        const enrollment = await ctx.db
            .query("classEnrollments")
            .withIndex("by_class_user", (q) => q.eq("classId", args.classId).eq("userId", args.userId))
            .first();

        if (!enrollment) throw new Error("Inscrição não encontrada");
        if (enrollment.status !== "pending") throw new Error("Inscrição não está pendente");

        await ctx.db.delete(enrollment._id);
    },
});

// Inscrever-se via token
export const enrollWithToken = mutation({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx);

        const tokenRecord = await ctx.db
            .query("enrollmentTokens")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .first();

        if (!tokenRecord) throw new Error("Token inválido");
        if (!tokenRecord.isActive) throw new Error("Token desativado");
        if (tokenRecord.expiresAt && tokenRecord.expiresAt < Date.now()) throw new Error("Token expirado");
        if (tokenRecord.usageLimit && tokenRecord.usageCount >= tokenRecord.usageLimit) throw new Error("Token atingiu limite de uso");

        const cls = await ctx.db.get(tokenRecord.classId);
        if (!cls) throw new Error("Turma não encontrada");
        if (!cls.isActive) throw new Error("Turma inativa");

        // Verificar se já está inscrito
        const existing = await ctx.db
            .query("classEnrollments")
            .withIndex("by_class_user", (q) => q.eq("classId", cls._id).eq("userId", auth.user._id))
            .first();

        if (existing) {
            if (existing.status === "active") throw new Error("Você já está inscrito nesta turma");
            if (existing.status === "pending") throw new Error("Sua inscrição está aguardando aprovação");
        }

        // Verificar capacidade
        if (cls.capacity) {
            const activeEnrollments = await ctx.db
                .query("classEnrollments")
                .withIndex("by_status", (q) => q.eq("classId", cls._id).eq("status", "active"))
                .collect();
            if (activeEnrollments.length >= cls.capacity) throw new Error("Turma lotada");
        }

        // Atualizar contador do token
        await ctx.db.patch(tokenRecord._id, { usageCount: tokenRecord.usageCount + 1 });

        // Criar ou atualizar inscrição
        const status = cls.requiresApproval ? "pending" : "active";

        if (existing) {
            await ctx.db.patch(existing._id, {
                status,
                enrolledAt: Date.now(),
                enrolledVia: "token",
                completedAt: undefined,
            });
            return { classId: cls._id, status };
        }

        await ctx.db.insert("classEnrollments", {
            classId: cls._id,
            userId: auth.user._id,
            status,
            enrolledVia: "token",
            enrolledAt: Date.now(),
        });

        return { classId: cls._id, status };
    },
});

// Criar token de matrícula
export const createEnrollmentToken = mutation({
    args: {
        classId: v.id("classes"),
        name: v.optional(v.string()),
        usageLimit: v.optional(v.number()),
        validityDays: v.optional(v.union(v.literal(7), v.literal(30), v.null())),
    },
    handler: async (ctx, args) => {
        const auth = await requireRole(ctx, ["superadmin", "admin", "professor"]);

        const cls = await ctx.db.get(args.classId);
        if (!cls) throw new Error("Turma não encontrada");

        // Verificar permissão
        if (auth.user.role === "professor") {
            const isInstructor = await ctx.db
                .query("classInstructors")
                .withIndex("by_class_user", (q) => q.eq("classId", args.classId).eq("userId", auth.user._id))
                .first();
            if (!isInstructor) throw new Error("Você não é instrutor desta turma");
        }

        // Gerar token único
        const token = crypto.randomUUID().replace(/-/g, "").substring(0, 12).toUpperCase();

        const now = Date.now();
        let expiresAt: number | undefined;
        if (args.validityDays !== null && args.validityDays !== undefined) {
            expiresAt = now + args.validityDays * 24 * 60 * 60 * 1000;
        }

        const tokenId = await ctx.db.insert("enrollmentTokens", {
            classId: args.classId,
            token,
            name: args.name,
            usageLimit: args.usageLimit,
            usageCount: 0,
            validityDays: args.validityDays,
            expiresAt,
            isActive: true,
            createdBy: auth.user._id,
            createdAt: now,
        });

        return { tokenId, token };
    },
});

// Revogar token de matrícula
export const revokeEnrollmentToken = mutation({
    args: { tokenId: v.id("enrollmentTokens") },
    handler: async (ctx, args) => {
        const auth = await requireRole(ctx, ["superadmin", "admin", "professor"]);

        const token = await ctx.db.get(args.tokenId);
        if (!token) throw new Error("Token não encontrado");

        await ctx.db.patch(args.tokenId, { isActive: false });
    },
});

// Atualizar configurações de módulo da turma
export const updateModuleSettings = mutation({
    args: {
        classId: v.id("classes"),
        moduleId: v.id("modules"),
        isVisible: v.optional(v.boolean()),
        unlockDate: v.optional(v.number()),
        lockDate: v.optional(v.number()),
        customOrder: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const auth = await requireRole(ctx, ["superadmin", "admin", "professor"]);

        const cls = await ctx.db.get(args.classId);
        if (!cls) throw new Error("Turma não encontrada");

        // Verificar permissão
        if (auth.user.role === "professor") {
            const isInstructor = await ctx.db
                .query("classInstructors")
                .withIndex("by_class_user", (q) => q.eq("classId", args.classId).eq("userId", auth.user._id))
                .first();
            if (!isInstructor || !isInstructor.permissions.canEditContent) {
                throw new Error("Sem permissão para editar conteúdo desta turma");
            }
        }

        const existing = await ctx.db
            .query("classModuleSettings")
            .withIndex("by_class_module", (q) => q.eq("classId", args.classId).eq("moduleId", args.moduleId))
            .first();

        const { classId, moduleId, ...updates } = args;

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...updates,
                updatedAt: Date.now(),
            });
        } else {
            await ctx.db.insert("classModuleSettings", {
                classId: args.classId,
                moduleId: args.moduleId,
                isVisible: args.isVisible ?? true,
                unlockDate: args.unlockDate,
                lockDate: args.lockDate,
                customOrder: args.customOrder,
                updatedAt: Date.now(),
            });
        }
    },
});

// Atualizar progresso do aluno na turma
export const updateProgress = mutation({
    args: {
        classId: v.id("classes"),
        lessonId: v.id("lessons"),
        watchedSeconds: v.number(),
        isCompleted: v.boolean(),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx);

        // Verificar se está inscrito na turma
        const enrollment = await ctx.db
            .query("classEnrollments")
            .withIndex("by_class_user", (q) => q.eq("classId", args.classId).eq("userId", auth.user._id))
            .first();

        if (!enrollment || enrollment.status !== "active") {
            throw new Error("Você não está inscrito nesta turma");
        }

        const now = Date.now();

        const existing = await ctx.db
            .query("classProgress")
            .withIndex("by_class_user_lesson", (q) =>
                q.eq("classId", args.classId).eq("userId", auth.user._id).eq("lessonId", args.lessonId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                watchedSeconds: Math.max(existing.watchedSeconds, args.watchedSeconds),
                isCompleted: existing.isCompleted || args.isCompleted,
                completedAt: args.isCompleted && !existing.isCompleted ? now : existing.completedAt,
                lastAccessedAt: now,
            });
        } else {
            await ctx.db.insert("classProgress", {
                classId: args.classId,
                userId: auth.user._id,
                lessonId: args.lessonId,
                watchedSeconds: args.watchedSeconds,
                isCompleted: args.isCompleted,
                completedAt: args.isCompleted ? now : undefined,
                lastAccessedAt: now,
            });
        }

        // Verificar se completou todas as aulas
        if (args.isCompleted) {
            const cls = await ctx.db.get(args.classId);
            if (cls) {
                const lessons = await ctx.db
                    .query("lessons")
                    .withIndex("by_course", (q) => q.eq("courseId", cls.courseId))
                    .collect();

                const progress = await ctx.db
                    .query("classProgress")
                    .withIndex("by_class_user", (q) => q.eq("classId", args.classId).eq("userId", auth.user._id))
                    .collect();

                const completedCount = progress.filter((p) => p.isCompleted).length;

                if (completedCount >= lessons.length) {
                    await ctx.db.patch(enrollment._id, {
                        status: "completed",
                        completedAt: now,
                    });
                }
            }
        }
    },
});

// Dar nota ao aluno
export const gradeStudent = mutation({
    args: {
        classId: v.id("classes"),
        userId: v.id("users"),
        lessonId: v.id("lessons"),
        score: v.number(),
        feedback: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const auth = await requireRole(ctx, ["superadmin", "admin", "professor"]);

        const cls = await ctx.db.get(args.classId);
        if (!cls) throw new Error("Turma não encontrada");

        // Verificar permissão
        if (auth.user.role === "professor") {
            const isInstructor = await ctx.db
                .query("classInstructors")
                .withIndex("by_class_user", (q) => q.eq("classId", args.classId).eq("userId", auth.user._id))
                .first();
            if (!isInstructor || !isInstructor.permissions.canGrade) {
                throw new Error("Sem permissão para dar notas nesta turma");
            }
        }

        const now = Date.now();

        const existing = await ctx.db
            .query("classProgress")
            .withIndex("by_class_user_lesson", (q) =>
                q.eq("classId", args.classId).eq("userId", args.userId).eq("lessonId", args.lessonId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                score: args.score,
                feedback: args.feedback,
                gradedBy: auth.user._id,
                gradedAt: now,
            });
        } else {
            await ctx.db.insert("classProgress", {
                classId: args.classId,
                userId: args.userId,
                lessonId: args.lessonId,
                watchedSeconds: 0,
                isCompleted: false,
                score: args.score,
                feedback: args.feedback,
                gradedBy: auth.user._id,
                gradedAt: now,
                lastAccessedAt: now,
            });
        }
    },
});
