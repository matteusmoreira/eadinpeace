import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAuth, requireRole } from "./authHelpers";

// ================================
// QUERIES
// ================================

// Obter sessões de presença de uma turma
export const getSessionsByClass = query({
    args: { classId: v.id("classes") },
    handler: async (ctx, args) => {
        try {
            const sessions = await ctx.db
                .query("attendanceSessions")
                .withIndex("by_class", (q) => q.eq("classId", args.classId))
                .order("desc")
                .collect();

            // Adicionar contagem de presenças para cada sessão
            const sessionsWithStats = await Promise.all(
                sessions.map(async (session) => {
                    const attendances = await ctx.db
                        .query("attendance")
                        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
                        .collect();

                    const stats = {
                        total: attendances.length,
                        present: attendances.filter((a) => a.status === "present").length,
                        absent: attendances.filter((a) => a.status === "absent").length,
                        late: attendances.filter((a) => a.status === "late").length,
                        excused: attendances.filter((a) => a.status === "excused").length,
                    };

                    const createdBy = await ctx.db.get(session.createdBy);

                    return {
                        ...session,
                        stats,
                        createdByName: createdBy
                            ? `${createdBy.firstName} ${createdBy.lastName}`
                            : "Desconhecido",
                    };
                })
            );

            return sessionsWithStats;
        } catch {
            return [];
        }
    },
});

// Obter presenças de uma sessão específica
export const getAttendanceBySession = query({
    args: { sessionId: v.id("attendanceSessions") },
    handler: async (ctx, args) => {
        try {
            // Obter a sessão para pegar o classId
            const session = await ctx.db.get(args.sessionId);
            if (!session) return { session: null, attendances: [], enrolledStudents: [] };

            // Obter as presenças já marcadas
            const attendances = await ctx.db
                .query("attendance")
                .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
                .collect();

            // Obter alunos matriculados na turma
            const enrollments = await ctx.db
                .query("classEnrollments")
                .withIndex("by_class", (q) => q.eq("classId", session.classId))
                .filter((q) => q.eq(q.field("status"), "active"))
                .collect();

            // Adicionar dados do usuário para cada presença e matrícula
            const attendancesWithUser = await Promise.all(
                attendances.map(async (attendance) => {
                    const user = await ctx.db.get(attendance.userId);
                    const markedBy = await ctx.db.get(attendance.markedBy);
                    return {
                        ...attendance,
                        user: user
                            ? {
                                _id: user._id,
                                firstName: user.firstName,
                                lastName: user.lastName,
                                email: user.email,
                                imageUrl: user.imageUrl,
                            }
                            : null,
                        markedByName: markedBy
                            ? `${markedBy.firstName} ${markedBy.lastName}`
                            : "Desconhecido",
                    };
                })
            );

            const enrolledStudents = await Promise.all(
                enrollments.map(async (enrollment) => {
                    const user = await ctx.db.get(enrollment.userId);
                    // Verificar se já tem presença marcada
                    const existingAttendance = attendances.find(
                        (a) => a.userId === enrollment.userId
                    );
                    return {
                        userId: enrollment.userId,
                        user: user
                            ? {
                                _id: user._id,
                                firstName: user.firstName,
                                lastName: user.lastName,
                                email: user.email,
                                imageUrl: user.imageUrl,
                            }
                            : null,
                        hasAttendance: !!existingAttendance,
                        currentStatus: existingAttendance?.status || null,
                    };
                })
            );

            return {
                session,
                attendances: attendancesWithUser,
                enrolledStudents: enrolledStudents.filter((s) => s.user !== null),
            };
        } catch {
            return { session: null, attendances: [], enrolledStudents: [] };
        }
    },
});

// Obter histórico de presença de um aluno em uma turma
export const getStudentAttendance = query({
    args: {
        classId: v.id("classes"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        try {
            // Obter todas as sessões da turma
            const sessions = await ctx.db
                .query("attendanceSessions")
                .withIndex("by_class", (q) => q.eq("classId", args.classId))
                .order("desc")
                .collect();

            // Para cada sessão, buscar a presença do aluno
            const attendanceHistory = await Promise.all(
                sessions.map(async (session) => {
                    const attendance = await ctx.db
                        .query("attendance")
                        .withIndex("by_session_user", (q) =>
                            q.eq("sessionId", session._id).eq("userId", args.userId)
                        )
                        .first();

                    return {
                        session: {
                            _id: session._id,
                            title: session.title,
                            date: session.date,
                        },
                        status: attendance?.status || "not_marked",
                        notes: attendance?.notes,
                    };
                })
            );

            // Calcular estatísticas
            const totalSessions = sessions.length;
            const present = attendanceHistory.filter((a) => a.status === "present").length;
            const absent = attendanceHistory.filter((a) => a.status === "absent").length;
            const late = attendanceHistory.filter((a) => a.status === "late").length;
            const excused = attendanceHistory.filter((a) => a.status === "excused").length;
            const notMarked = attendanceHistory.filter((a) => a.status === "not_marked").length;

            const attendanceRate =
                totalSessions > 0
                    ? Math.round(((present + late) / totalSessions) * 100)
                    : 0;

            return {
                history: attendanceHistory,
                stats: {
                    totalSessions,
                    present,
                    absent,
                    late,
                    excused,
                    notMarked,
                    attendanceRate,
                },
            };
        } catch {
            return {
                history: [],
                stats: {
                    totalSessions: 0,
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                    notMarked: 0,
                    attendanceRate: 0,
                },
            };
        }
    },
});

// Obter estatísticas de presença da turma
export const getClassAttendanceStats = query({
    args: { classId: v.id("classes") },
    handler: async (ctx, args) => {
        try {
            // Obter todas as sessões
            const sessions = await ctx.db
                .query("attendanceSessions")
                .withIndex("by_class", (q) => q.eq("classId", args.classId))
                .collect();

            // Obter alunos matriculados
            const enrollments = await ctx.db
                .query("classEnrollments")
                .withIndex("by_class", (q) => q.eq("classId", args.classId))
                .filter((q) => q.eq(q.field("status"), "active"))
                .collect();

            // Obter todas as presenças
            let totalPresent = 0;
            let totalAbsent = 0;
            let totalLate = 0;
            let totalExcused = 0;

            for (const session of sessions) {
                const attendances = await ctx.db
                    .query("attendance")
                    .withIndex("by_session", (q) => q.eq("sessionId", session._id))
                    .collect();

                totalPresent += attendances.filter((a) => a.status === "present").length;
                totalAbsent += attendances.filter((a) => a.status === "absent").length;
                totalLate += attendances.filter((a) => a.status === "late").length;
                totalExcused += attendances.filter((a) => a.status === "excused").length;
            }

            const totalRecords = totalPresent + totalAbsent + totalLate + totalExcused;
            const overallAttendanceRate =
                totalRecords > 0
                    ? Math.round(((totalPresent + totalLate) / totalRecords) * 100)
                    : 0;

            // Top alunos com melhor frequência
            const studentStats = await Promise.all(
                enrollments.map(async (enrollment) => {
                    const user = await ctx.db.get(enrollment.userId);
                    let studentPresent = 0;
                    let studentTotal = 0;

                    for (const session of sessions) {
                        const attendance = await ctx.db
                            .query("attendance")
                            .withIndex("by_session_user", (q) =>
                                q.eq("sessionId", session._id).eq("userId", enrollment.userId)
                            )
                            .first();

                        if (attendance) {
                            studentTotal++;
                            if (attendance.status === "present" || attendance.status === "late") {
                                studentPresent++;
                            }
                        }
                    }

                    return {
                        userId: enrollment.userId,
                        name: user ? `${user.firstName} ${user.lastName}` : "Desconhecido",
                        imageUrl: user?.imageUrl,
                        attendanceRate: studentTotal > 0 ? Math.round((studentPresent / studentTotal) * 100) : 0,
                        sessionsAttended: studentPresent,
                        totalSessions: studentTotal,
                    };
                })
            );

            // Ordenar por taxa de frequência
            studentStats.sort((a, b) => b.attendanceRate - a.attendanceRate);

            return {
                totalSessions: sessions.length,
                totalStudents: enrollments.length,
                stats: {
                    present: totalPresent,
                    absent: totalAbsent,
                    late: totalLate,
                    excused: totalExcused,
                },
                overallAttendanceRate,
                studentStats: studentStats.slice(0, 10), // Top 10
            };
        } catch {
            return {
                totalSessions: 0,
                totalStudents: 0,
                stats: {
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                },
                overallAttendanceRate: 0,
                studentStats: [],
            };
        }
    },
});

// ================================
// MUTATIONS
// ================================

// Criar sessão de presença
export const createSession = mutation({
    args: {
        classId: v.id("classes"),
        title: v.optional(v.string()),
        date: v.number(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx);

        const now = Date.now();
        const sessionId = await ctx.db.insert("attendanceSessions", {
            classId: args.classId,
            title: args.title,
            date: args.date,
            notes: args.notes,
            createdBy: auth.user._id,
            createdAt: now,
            updatedAt: now,
        });

        return sessionId;
    },
});

// Atualizar sessão de presença
export const updateSession = mutation({
    args: {
        sessionId: v.id("attendanceSessions"),
        title: v.optional(v.string()),
        date: v.optional(v.number()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireAuth(ctx);

        const session = await ctx.db.get(args.sessionId);
        if (!session) {
            throw new Error("Sessão não encontrada");
        }

        const updates: Partial<typeof session> = {
            updatedAt: Date.now(),
        };

        if (args.title !== undefined) updates.title = args.title;
        if (args.date !== undefined) updates.date = args.date;
        if (args.notes !== undefined) updates.notes = args.notes;

        await ctx.db.patch(args.sessionId, updates);
        return args.sessionId;
    },
});

// Excluir sessão de presença
export const deleteSession = mutation({
    args: { sessionId: v.id("attendanceSessions") },
    handler: async (ctx, args) => {
        await requireAuth(ctx);

        // Excluir todas as presenças da sessão
        const attendances = await ctx.db
            .query("attendance")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .collect();

        for (const attendance of attendances) {
            await ctx.db.delete(attendance._id);
        }

        // Excluir a sessão
        await ctx.db.delete(args.sessionId);
        return true;
    },
});

// Marcar presença individual
export const markAttendance = mutation({
    args: {
        sessionId: v.id("attendanceSessions"),
        userId: v.id("users"),
        status: v.union(
            v.literal("present"),
            v.literal("absent"),
            v.literal("late"),
            v.literal("excused")
        ),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx);

        // Verificar se já existe presença para este aluno nesta sessão
        const existing = await ctx.db
            .query("attendance")
            .withIndex("by_session_user", (q) =>
                q.eq("sessionId", args.sessionId).eq("userId", args.userId)
            )
            .first();

        if (existing) {
            // Atualizar presença existente
            await ctx.db.patch(existing._id, {
                status: args.status,
                notes: args.notes,
                markedBy: auth.user._id,
                markedAt: Date.now(),
            });
            return existing._id;
        } else {
            // Criar nova presença
            const attendanceId = await ctx.db.insert("attendance", {
                sessionId: args.sessionId,
                userId: args.userId,
                status: args.status,
                notes: args.notes,
                markedBy: auth.user._id,
                markedAt: Date.now(),
            });
            return attendanceId;
        }
    },
});

// Marcar presença em lote
export const markBulkAttendance = mutation({
    args: {
        sessionId: v.id("attendanceSessions"),
        attendances: v.array(
            v.object({
                userId: v.id("users"),
                status: v.union(
                    v.literal("present"),
                    v.literal("absent"),
                    v.literal("late"),
                    v.literal("excused")
                ),
                notes: v.optional(v.string()),
            })
        ),
    },
    handler: async (ctx, args) => {
        const auth = await requireAuth(ctx);

        const results: Id<"attendance">[] = [];

        for (const att of args.attendances) {
            // Verificar se já existe presença
            const existing = await ctx.db
                .query("attendance")
                .withIndex("by_session_user", (q) =>
                    q.eq("sessionId", args.sessionId).eq("userId", att.userId)
                )
                .first();

            if (existing) {
                // Atualizar
                await ctx.db.patch(existing._id, {
                    status: att.status,
                    notes: att.notes,
                    markedBy: auth.user._id,
                    markedAt: Date.now(),
                });
                results.push(existing._id);
            } else {
                // Criar
                const id = await ctx.db.insert("attendance", {
                    sessionId: args.sessionId,
                    userId: att.userId,
                    status: att.status,
                    notes: att.notes,
                    markedBy: auth.user._id,
                    markedAt: Date.now(),
                });
                results.push(id);
            }
        }

        return results;
    },
});
