import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Internal action para atualizar senha de usuário via Clerk Backend API
 * Esta action é chamada via scheduler do Convex para execução assíncrona
 * 
 * IMPORTANTE: Requer CLERK_SECRET_KEY configurada nas variáveis de ambiente do Convex
 * Para configurar: npx convex env set CLERK_SECRET_KEY sk_test_xxx
 */
export const updatePasswordInClerk = internalAction({
    args: {
        clerkUserId: v.string(),
        newPassword: v.string(),
        targetUserId: v.id("users"),
        changedByUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Obter a secret key do ambiente
        const clerkSecretKey = process.env.CLERK_SECRET_KEY;
        if (!clerkSecretKey) {
            console.error("[clerkActions:updatePasswordInClerk] CLERK_SECRET_KEY não configurada");
            throw new Error("CLERK_SECRET_KEY não está configurada nas variáveis de ambiente do Convex");
        }

        try {
            // Chamar Clerk Backend API diretamente via fetch
            const response = await fetch(
                `https://api.clerk.com/v1/users/${args.clerkUserId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${clerkSecretKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        password: args.newPassword,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.errors?.[0]?.message ||
                    errorData.message ||
                    `HTTP ${response.status}: ${response.statusText}`;
                console.error("[clerkActions:updatePasswordInClerk] Erro da API:", errorMessage);
                throw new Error(errorMessage);
            }

            // Sucesso - registrar log de auditoria
            await ctx.runMutation(internal.clerkActions.logPasswordChange, {
                changedByUserId: args.changedByUserId,
                targetUserId: args.targetUserId,
            });

            console.log("[clerkActions:updatePasswordInClerk] Senha atualizada com sucesso para usuário:", args.clerkUserId);
            return { success: true };
        } catch (error: any) {
            console.error("[clerkActions:updatePasswordInClerk] Erro:", error);
            throw new Error(`Erro ao atualizar senha no Clerk: ${error.message || "Erro desconhecido"}`);
        }
    },
});

/**
 * Internal mutation para registrar log de alteração de senha
 */
export const logPasswordChange = internalMutation({
    args: {
        changedByUserId: v.id("users"),
        targetUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("passwordChangeLogs", {
            changedByUserId: args.changedByUserId,
            targetUserId: args.targetUserId,
            timestamp: Date.now(),
        });
    },
});

/**
 * Internal action para deletar usuário no Clerk Backend API
 * Esta action é chamada via scheduler do Convex para execução assíncrona
 * 
 * IMPORTANTE: Requer CLERK_SECRET_KEY configurada nas variáveis de ambiente do Convex
 */
export const deleteUserInClerk = internalAction({
    args: {
        clerkUserId: v.string(),
        deletedByUserId: v.id("users"),
        targetUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Obter a secret key do ambiente
        const clerkSecretKey = process.env.CLERK_SECRET_KEY;
        if (!clerkSecretKey) {
            console.error("[clerkActions:deleteUserInClerk] CLERK_SECRET_KEY não configurada");
            throw new Error("CLERK_SECRET_KEY não está configurada nas variáveis de ambiente do Convex");
        }

        // Não tentar deletar usuários pendentes (que ainda não foram criados no Clerk)
        if (args.clerkUserId.startsWith("pending_")) {
            console.log("[clerkActions:deleteUserInClerk] Usuário pending, ignorando deleção no Clerk");
            return { success: true, skipped: true };
        }

        try {
            // Chamar Clerk Backend API para deletar usuário
            const response = await fetch(
                `https://api.clerk.com/v1/users/${args.clerkUserId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${clerkSecretKey}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.errors?.[0]?.message ||
                    errorData.message ||
                    `HTTP ${response.status}: ${response.statusText}`;
                console.error("[clerkActions:deleteUserInClerk] Erro da API:", errorMessage);
                throw new Error(errorMessage);
            }

            // Registrar log de auditoria
            await ctx.runMutation(internal.clerkActions.logUserDeletion, {
                deletedByUserId: args.deletedByUserId,
                targetUserId: args.targetUserId,
                clerkUserId: args.clerkUserId,
            });

            console.log("[clerkActions:deleteUserInClerk] Usuário deletado com sucesso no Clerk:", args.clerkUserId);
            return { success: true };
        } catch (error: any) {
            console.error("[clerkActions:deleteUserInClerk] Erro:", error);
            throw new Error(`Erro ao deletar usuário no Clerk: ${error.message || "Erro desconhecido"}`);
        }
    },
});

/**
 * Internal mutation para registrar log de deleção de usuário
 */
export const logUserDeletion = internalMutation({
    args: {
        deletedByUserId: v.id("users"),
        targetUserId: v.id("users"),
        clerkUserId: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("userDeletionLogs", {
            deletedByUserId: args.deletedByUserId,
            targetUserId: args.targetUserId,
            clerkUserId: args.clerkUserId,
            timestamp: Date.now(),
        });
    },
});
