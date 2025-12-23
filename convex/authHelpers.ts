import { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { DataModel } from "./_generated/dataModel";
import { Id } from "./_generated/dataModel";

type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

/**
 * Resultado da verificação de autenticação
 */
export interface AuthResult {
    identity: {
        subject: string;
        email?: string;
    };
    user: {
        _id: Id<"users">;
        clerkId: string;
        email: string;
        firstName: string;
        lastName: string;
        role: "superadmin" | "admin" | "professor" | "student";
        organizationId?: Id<"organizations">;
        isActive: boolean;
    };
}

/**
 * Verifica se o usuário está autenticado e retorna seus dados.
 * Lança erro se não autenticado ou usuário não encontrado.
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<AuthResult> {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Não autenticado");
    }

    const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();

    if (!user) {
        throw new Error("Usuário não encontrado no sistema");
    }

    if (user.isActive === false) {
        throw new Error("Usuário inativo");
    }

    return {
        identity: {
            subject: identity.subject,
            email: identity.email,
        },
        user: user as AuthResult["user"],
    };
}

/**
 * Verifica se o usuário está autenticado e pertence à organização especificada.
 * Superadmins podem acessar qualquer organização.
 */
export async function requireAuthWithOrg(
    ctx: QueryCtx | MutationCtx,
    organizationId: Id<"organizations">
): Promise<AuthResult> {
    const auth = await requireAuth(ctx);

    // Superadmins podem acessar qualquer organização
    if (auth.user.role === "superadmin") {
        return auth;
    }

    // Verificar se o usuário pertence à organização
    if (auth.user.organizationId !== organizationId) {
        throw new Error("Acesso negado: você não pertence a esta organização");
    }

    return auth;
}

/**
 * Verifica se o usuário tem uma das roles especificadas.
 */
export async function requireRole(
    ctx: QueryCtx | MutationCtx,
    allowedRoles: Array<"superadmin" | "admin" | "professor" | "student">
): Promise<AuthResult> {
    const auth = await requireAuth(ctx);

    if (!allowedRoles.includes(auth.user.role)) {
        throw new Error(`Acesso negado: requer role ${allowedRoles.join(" ou ")}`);
    }

    return auth;
}

/**
 * Verifica se o usuário é o próprio dono do recurso ou tem permissão admin.
 */
export async function requireOwnerOrAdmin(
    ctx: QueryCtx | MutationCtx,
    resourceUserId: Id<"users">
): Promise<AuthResult> {
    const auth = await requireAuth(ctx);

    if (auth.user.role === "superadmin") {
        return auth;
    }

    if (auth.user.role === "admin") {
        const targetUser = await ctx.db.get(resourceUserId);
        if (!targetUser) {
            throw new Error("Usuário não encontrado");
        }
        if (!auth.user.organizationId || targetUser.organizationId !== auth.user.organizationId) {
            throw new Error("Acesso negado: recurso de outra organização");
        }
        return auth;
    }

    // Verificar se é o próprio usuário
    if (auth.user._id !== resourceUserId) {
        throw new Error("Acesso negado: você só pode acessar seus próprios dados");
    }

    return auth;
}

/**
 * Verifica se o usuário pode modificar um curso (instrutor do curso ou admin).
 */
export async function requireCourseAccess(
    ctx: QueryCtx | MutationCtx,
    courseId: Id<"courses">
): Promise<AuthResult & { course: NonNullable<Awaited<ReturnType<typeof ctx.db.get>>> }> {
    const auth = await requireAuth(ctx);

    const course = await ctx.db.get(courseId);
    if (!course) {
        throw new Error("Curso não encontrado");
    }

    // Superadmins podem acessar qualquer curso
    if (auth.user.role === "superadmin") {
        return { ...auth, course };
    }

    // Verificar se pertence à mesma organização
    if (auth.user.organizationId !== course.organizationId) {
        throw new Error("Acesso negado: curso de outra organização");
    }

    // Admins podem acessar cursos de sua organização
    if (auth.user.role === "admin") {
        return { ...auth, course };
    }

    // Professores precisam ser o instrutor do curso
    if (auth.user.role === "professor" && course.instructorId !== auth.user._id) {
        throw new Error("Acesso negado: você não é o instrutor deste curso");
    }

    return { ...auth, course };
}
