import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ================================
// CONTENT DRIPPING - GOTEJAMENTO DE CONTEÚDO
// ================================

/**
 * Verifica se um usuário tem acesso a um módulo ou lição específica
 * baseado nas regras de gotejamento do curso
 */
export const checkContentAccess = query({
    args: {
        userId: v.id("users"),
        courseId: v.id("courses"),
        moduleId: v.optional(v.id("modules")),
        lessonId: v.optional(v.id("lessons")),
    },
    handler: async (ctx, args) => {
        // Buscar curso
        const course = await ctx.db.get(args.courseId);
        if (!course) {
            return { hasAccess: false, reason: "Curso não encontrado" };
        }

        // Se não há gotejamento configurado ou é "free", acesso liberado
        const dripType = course.dripType || "free";
        if (dripType === "free") {
            return { hasAccess: true };
        }

        // Buscar inscrição do usuário
        const enrollment = await ctx.db
            .query("enrollments")
            .withIndex("by_user_course", (q) =>
                q.eq("userId", args.userId).eq("courseId", args.courseId)
            )
            .unique();

        if (!enrollment) {
            return { hasAccess: false, reason: "Não matriculado no curso" };
        }

        const enrollmentDate = enrollment.startedAt;
        const now = Date.now();

        // Se for verificação de módulo
        if (args.moduleId) {
            const module = await ctx.db.get(args.moduleId);
            if (!module) {
                return { hasAccess: false, reason: "Módulo não encontrado" };
            }

            // Modo sequencial: verificar se módulos anteriores foram concluídos
            if (dripType === "sequential") {
                const allModules = await ctx.db
                    .query("modules")
                    .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
                    .collect();

                const sortedModules = allModules.sort((a, b) => a.order - b.order);
                const currentModuleIndex = sortedModules.findIndex(m => m._id === args.moduleId);

                if (currentModuleIndex === 0) {
                    return { hasAccess: true }; // Primeiro módulo sempre disponível
                }

                // Verificar se o módulo anterior foi concluído
                for (let i = 0; i < currentModuleIndex; i++) {
                    const prevModule = sortedModules[i];
                    const moduleLessons = await ctx.db
                        .query("lessons")
                        .withIndex("by_module", (q) => q.eq("moduleId", prevModule._id))
                        .collect();

                    const completedLessons = enrollment.completedLessons || [];
                    const allLessonsCompleted = moduleLessons.every(lesson =>
                        completedLessons.some(cl => cl === lesson._id)
                    );

                    if (!allLessonsCompleted) {
                        return {
                            hasAccess: false,
                            reason: `Complete o módulo "${prevModule.title}" primeiro`,
                        };
                    }
                }
                return { hasAccess: true };
            }

            // Modo por data
            if (dripType === "date" && module.releaseDate) {
                if (now < module.releaseDate) {
                    return {
                        hasAccess: false,
                        unlockDate: module.releaseDate,
                        reason: "Conteúdo será liberado em breve",
                    };
                }
                return { hasAccess: true };
            }

            // Modo dias após inscrição
            if (dripType === "days_after" && module.daysAfterEnrollment) {
                const unlockDate = enrollmentDate + (module.daysAfterEnrollment * 24 * 60 * 60 * 1000);
                if (now < unlockDate) {
                    return {
                        hasAccess: false,
                        unlockDate,
                        reason: `Disponível ${module.daysAfterEnrollment} dias após a inscrição`,
                    };
                }
                return { hasAccess: true };
            }
        }

        // Se for verificação de lição
        if (args.lessonId) {
            const lesson = await ctx.db.get(args.lessonId);
            if (!lesson) {
                return { hasAccess: false, reason: "Lição não encontrada" };
            }

            // Lições gratuitas sempre disponíveis
            if (lesson.isFree) {
                return { hasAccess: true };
            }

            // Verificar primeiro o acesso ao módulo (lógica inline para evitar chamada recursiva)
            const module = await ctx.db.get(lesson.moduleId);
            if (!module) {
                return { hasAccess: false, reason: "Módulo não encontrado" };
            }

            // Verificar regras do módulo baseado no tipo de gotejamento
            if (dripType === "sequential") {
                const allModules = await ctx.db
                    .query("modules")
                    .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
                    .collect();
                const sortedModules = allModules.sort((a, b) => a.order - b.order);
                const moduleIndex = sortedModules.findIndex(m => m._id === lesson.moduleId);

                // Verificar módulos anteriores
                for (let i = 0; i < moduleIndex; i++) {
                    const prevModule = sortedModules[i];
                    const prevModuleLessons = await ctx.db
                        .query("lessons")
                        .withIndex("by_module", (q) => q.eq("moduleId", prevModule._id))
                        .collect();
                    const completedLessons = enrollment.completedLessons || [];
                    const allPrevCompleted = prevModuleLessons.every(l =>
                        completedLessons.some(cl => cl === l._id)
                    );
                    if (!allPrevCompleted) {
                        return {
                            hasAccess: false,
                            reason: `Complete o módulo "${prevModule.title}" primeiro`,
                        };
                    }
                }
            } else if (dripType === "date" && module.releaseDate && now < module.releaseDate) {
                return {
                    hasAccess: false,
                    unlockDate: module.releaseDate,
                    reason: "Módulo será liberado em breve",
                };
            } else if (dripType === "days_after" && module.daysAfterEnrollment) {
                const moduleUnlockDate = enrollmentDate + (module.daysAfterEnrollment * 24 * 60 * 60 * 1000);
                if (now < moduleUnlockDate) {
                    return {
                        hasAccess: false,
                        unlockDate: moduleUnlockDate,
                        reason: `Módulo disponível ${module.daysAfterEnrollment} dias após a inscrição`,
                    };
                }
            }

            // Modo sequencial: verificar se lições anteriores foram concluídas
            if (dripType === "sequential") {
                const moduleLessons = await ctx.db
                    .query("lessons")
                    .withIndex("by_module", (q) => q.eq("moduleId", lesson.moduleId))
                    .collect();

                const sortedLessons = moduleLessons.sort((a, b) => a.order - b.order);
                const currentLessonIndex = sortedLessons.findIndex(l => l._id === args.lessonId);

                if (currentLessonIndex === 0) {
                    return { hasAccess: true }; // Primeira lição do módulo sempre disponível
                }

                // Verificar se a lição anterior foi concluída
                const prevLesson = sortedLessons[currentLessonIndex - 1];
                const completedLessons = enrollment.completedLessons || [];
                if (!completedLessons.some(cl => cl === prevLesson._id)) {
                    return {
                        hasAccess: false,
                        reason: `Complete a lição "${prevLesson.title}" primeiro`,
                    };
                }
                return { hasAccess: true };
            }

            // Modo por data (configuração específica da lição)
            if (dripType === "date" && lesson.releaseDate) {
                if (now < lesson.releaseDate) {
                    return {
                        hasAccess: false,
                        unlockDate: lesson.releaseDate,
                        reason: "Conteúdo será liberado em breve",
                    };
                }
                return { hasAccess: true };
            }

            // Modo dias após inscrição (configuração específica da lição)
            if (dripType === "days_after" && lesson.daysAfterEnrollment) {
                const unlockDate = enrollmentDate + (lesson.daysAfterEnrollment * 24 * 60 * 60 * 1000);
                if (now < unlockDate) {
                    return {
                        hasAccess: false,
                        unlockDate,
                        reason: `Disponível ${lesson.daysAfterEnrollment} dias após a inscrição`,
                    };
                }
                return { hasAccess: true };
            }
        }

        // Por padrão, liberar acesso
        return { hasAccess: true };
    },
});

/**
 * Retorna o conteúdo do curso com informações de acesso para cada módulo/lição
 */
export const getCourseContentWithAccess = query({
    args: {
        userId: v.id("users"),
        courseId: v.id("courses"),
    },
    handler: async (ctx, args) => {
        const course = await ctx.db.get(args.courseId);
        if (!course) {
            return null;
        }

        const dripType = course.dripType || "free";

        // Buscar inscrição
        const enrollment = await ctx.db
            .query("enrollments")
            .withIndex("by_user_course", (q) =>
                q.eq("userId", args.userId).eq("courseId", args.courseId)
            )
            .unique();

        const enrollmentDate = enrollment?.startedAt || Date.now();
        const completedLessons = enrollment?.completedLessons || [];
        const now = Date.now();

        // Buscar módulos
        const modules = await ctx.db
            .query("modules")
            .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
            .collect();

        const sortedModules = modules.sort((a, b) => a.order - b.order);

        let previousModulesCompleted = true;

        const modulesWithAccess = await Promise.all(
            sortedModules.map(async (module, moduleIndex) => {
                // Buscar lições do módulo
                const lessons = await ctx.db
                    .query("lessons")
                    .withIndex("by_module", (q) => q.eq("moduleId", module._id))
                    .collect();

                const sortedLessons = lessons.sort((a, b) => a.order - b.order);

                // Verificar acesso ao módulo
                let moduleHasAccess = true;
                let moduleUnlockDate: number | undefined;
                let moduleReason: string | undefined;

                if (dripType === "sequential") {
                    moduleHasAccess = moduleIndex === 0 || previousModulesCompleted;
                    if (!moduleHasAccess) {
                        moduleReason = "Complete os módulos anteriores";
                    }
                } else if (dripType === "date" && module.releaseDate) {
                    moduleHasAccess = now >= module.releaseDate;
                    moduleUnlockDate = module.releaseDate;
                } else if (dripType === "days_after" && module.daysAfterEnrollment) {
                    moduleUnlockDate = enrollmentDate + (module.daysAfterEnrollment * 24 * 60 * 60 * 1000);
                    moduleHasAccess = now >= moduleUnlockDate;
                }

                let previousLessonCompleted = true;

                const lessonsWithAccess = sortedLessons.map((lesson, lessonIndex) => {
                    let lessonHasAccess = moduleHasAccess;
                    let lessonUnlockDate = moduleUnlockDate;
                    let lessonReason = moduleReason;

                    // Lições gratuitas sempre disponíveis
                    if (lesson.isFree) {
                        lessonHasAccess = true;
                        lessonUnlockDate = undefined;
                        lessonReason = undefined;
                    } else if (lessonHasAccess) {
                        // Verificar regras específicas da lição
                        if (dripType === "sequential") {
                            lessonHasAccess = lessonIndex === 0 || previousLessonCompleted;
                            if (!lessonHasAccess) {
                                lessonReason = "Complete a lição anterior";
                            }
                        } else if (dripType === "date" && lesson.releaseDate) {
                            lessonHasAccess = now >= lesson.releaseDate;
                            lessonUnlockDate = lesson.releaseDate;
                        } else if (dripType === "days_after" && lesson.daysAfterEnrollment) {
                            lessonUnlockDate = enrollmentDate + (lesson.daysAfterEnrollment * 24 * 60 * 60 * 1000);
                            lessonHasAccess = now >= lessonUnlockDate;
                        }
                    }

                    const isCompleted = completedLessons.some(cl => cl === lesson._id);
                    previousLessonCompleted = isCompleted;

                    return {
                        ...lesson,
                        hasAccess: lessonHasAccess,
                        unlockDate: lessonUnlockDate,
                        reason: lessonReason,
                        isCompleted,
                    };
                });

                // Verificar se todas as lições do módulo foram concluídas
                const allModuleLessonsCompleted = sortedLessons.every(lesson =>
                    completedLessons.some(cl => cl === lesson._id)
                );
                previousModulesCompleted = previousModulesCompleted && allModuleLessonsCompleted;

                return {
                    ...module,
                    hasAccess: moduleHasAccess,
                    unlockDate: moduleUnlockDate,
                    reason: moduleReason,
                    lessons: lessonsWithAccess,
                };
            })
        );

        return {
            ...course,
            modules: modulesWithAccess,
        };
    },
});
