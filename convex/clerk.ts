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
            // Obter a secret key do ambiente
            const clerkSecretKey = process.env.CLERK_SECRET_KEY;
            if (!clerkSecretKey) {
                throw new Error("CLERK_SECRET_KEY não configurada no dashboard do Convex");
            }

            // Atualizar senha no Clerk via API REST
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
                throw new Error(errorData.errors?.[0]?.message || `Erro da API: ${response.statusText}`);
            }

            return { success: true };
        } catch (error: any) {
            console.error("[clerk:updateUserPassword] Erro:", error);
            throw new Error(`Erro ao atualizar senha: ${error.message || "Erro desconhecido"}`);
        }
    },
});
