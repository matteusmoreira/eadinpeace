import { action } from "./_generated/server";
import { v } from "convex/values";
import { requireRole } from "./authHelpers";

/**
 * Action para atualizar senha de usuário via Clerk API
 * IMPORTANTE: Requer CLERK_SECRET_KEY configurada no environment
 */
export const updateUserPassword = action({
    args: {
        clerkUserId: v.string(),
        newPassword: v.string(),
    },
    handler: async (ctx, args) => {
        // Validação básica de senha
        if (args.newPassword.length < 8) {
            throw new Error("A senha deve ter no mínimo 8 caracteres");
        }

        try {
            // Importar Clerk SDK dinamicamente
            const { clerkClient } = await import("@clerk/nextjs/server");

            // Atualizar senha no Clerk
            const client = await clerkClient();
            await client.users.updateUser(args.clerkUserId, {
                password: args.newPassword,
            });

            return { success: true };
        } catch (error: any) {
            console.error("[clerk:updateUserPassword] Erro:", error);
            throw new Error(`Erro ao atualizar senha: ${error.message || "Erro desconhecido"}`);
        }
    },
});
