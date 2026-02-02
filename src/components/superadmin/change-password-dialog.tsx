"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, Key, Copy, RefreshCw, Loader2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import {
    validatePassword,
    getPasswordStrength,
    generateRandomPassword,
} from "@/lib/password-utils";

interface ChangePasswordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: Id<"users">;
    userName: string;
}

export function ChangePasswordDialog({
    open,
    onOpenChange,
    userId,
    userName,
}: ChangePasswordDialogProps) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isChanging, setIsChanging] = useState(false);

    const changePassword = useMutation(api.users.changeUserPassword);

    const passwordStrength = getPasswordStrength(newPassword);
    const passwordValidation = validatePassword(newPassword);
    const passwordsMatch = newPassword === confirmPassword;

    const canSubmit =
        passwordValidation.valid &&
        passwordsMatch &&
        newPassword.length > 0 &&
        !isChanging;

    const handleGeneratePassword = () => {
        const generated = generateRandomPassword(16);
        setNewPassword(generated);
        setConfirmPassword(generated);
        toast.success("Senha gerada com sucesso!");
    };

    const handleCopyPassword = async () => {
        try {
            await navigator.clipboard.writeText(newPassword);
            toast.success("Senha copiada para a área de transferência!");
        } catch {
            toast.error("Erro ao copiar senha");
        }
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;

        setIsChanging(true);
        try {
            const result = await changePassword({
                userId,
                newPassword,
            });

            // Verificar se houve erro na resposta
            if (result && result.error) {
                throw new Error(result.error);
            }

            toast.success(`Senha alterada com sucesso para ${userName}!`, {
                description: result?.message || "O usuário pode fazer login com a nova senha.",
            });

            // Limpar formulário e fechar
            setNewPassword("");
            setConfirmPassword("");
            onOpenChange(false);
        } catch (error: any) {
            console.error("Erro ao alterar senha:", error);
            
            // Verificar se é erro de CLERK_SECRET_KEY não configurada
            const errorMessage = error.message || "";
            if (errorMessage.includes("CLERK_SECRET_KEY")) {
                toast.error("Erro de configuração", {
                    description: "A chave CLERK_SECRET_KEY não está configurada no servidor. Contate o administrador.",
                });
            } else {
                toast.error("Erro ao alterar senha", {
                    description: errorMessage || "Tente novamente mais tarde.",
                });
            }
        } finally {
            setIsChanging(false);
        }
    };

    const getStrengthColor = () => {
        switch (passwordStrength.level) {
            case "strong":
                return "bg-emerald-500";
            case "medium":
                return "bg-amber-500";
            case "weak":
                return "bg-red-500";
            default:
                return "bg-gray-300";
        }
    };

    const getStrengthLabel = () => {
        switch (passwordStrength.level) {
            case "strong":
                return "Forte";
            case "medium":
                return "Média";
            case "weak":
                return "Fraca";
            default:
                return "";
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Alterar Senha</DialogTitle>
                    <DialogDescription>
                        Alterar senha do usuário <strong>{userName}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Nova Senha */}
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nova Senha</Label>
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Digite a nova senha"
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        {/* Indicador de Força */}
                        {newPassword && (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Força da senha:
                                    </span>
                                    <span className="font-medium">
                                        {getStrengthLabel()}
                                    </span>
                                </div>
                                <Progress
                                    value={passwordStrength.score}
                                    className="h-2"
                                    indicatorClassName={getStrengthColor()}
                                />
                                {passwordStrength.suggestions.length > 0 && (
                                    <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                        {passwordStrength.suggestions.slice(0, 2).map((suggestion, i) => (
                                            <li key={i}>• {suggestion}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {passwordValidation.errors.length > 0 && (
                            <p className="text-xs text-destructive">
                                {passwordValidation.errors[0]}
                            </p>
                        )}
                    </div>

                    {/* Confirmar Senha */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Digite novamente a senha"
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full"
                                onClick={() => setShowConfirm(!showConfirm)}
                            >
                                {showConfirm ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        {confirmPassword && !passwordsMatch && (
                            <p className="text-xs text-destructive">
                                As senhas não coincidem
                            </p>
                        )}

                        {confirmPassword && passwordsMatch && (
                            <p className="text-xs text-emerald-600">
                                ✓ As senhas coincidem
                            </p>
                        )}
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleGeneratePassword}
                            className="flex-1 gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Gerar Senha
                        </Button>
                        {newPassword && (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleCopyPassword}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isChanging}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="gap-2"
                    >
                        {isChanging ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Alterando...
                            </>
                        ) : (
                            <>
                                <Key className="h-4 w-4" />
                                Alterar Senha
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
