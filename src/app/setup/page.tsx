"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { Loader2, ShieldCheck, Crown, GraduationCap, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type RoleOption = "superadmin" | "admin" | "professor" | "student";

const roleOptions: { value: RoleOption; label: string; description: string; icon: typeof Crown; color: string }[] = [
    {
        value: "superadmin",
        label: "Superadmin",
        description: "Acesso total ao sistema, gerencia todas as organizações",
        icon: Crown,
        color: "text-amber-500",
    },
    {
        value: "admin",
        label: "Administrador",
        description: "Gerencia uma organização, cursos e usuários",
        icon: ShieldCheck,
        color: "text-blue-500",
    },
    {
        value: "professor",
        label: "Professor",
        description: "Cria e gerencia cursos, avalia alunos",
        icon: GraduationCap,
        color: "text-emerald-500",
    },
    {
        value: "student",
        label: "Aluno",
        description: "Acessa cursos e materiais de estudo",
        icon: UserCircle,
        color: "text-purple-500",
    },
];

export default function SetupPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<RoleOption>("student");
    const [result, setResult] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    // Get current user from Convex
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Upsert user mutation
    const upsertUser = useMutation(api.users.upsertFromClerk);

    // Redirect if user already exists
    useEffect(() => {
        if (convexUser) {
            router.push("/dashboard");
        }
    }, [convexUser, router]);

    const handleSetup = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            // Create the user in Convex with the selected role
            await upsertUser({
                clerkId: user.id,
                email: user.emailAddresses[0]?.emailAddress || "",
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                imageUrl: user.imageUrl,
                role: selectedRole,
            });

            setResult(`Sucesso! Sua conta foi criada como ${roleOptions.find(r => r.value === selectedRole)?.label}.`);

            // Redirect after a short delay
            setTimeout(() => {
                router.push("/dashboard");
            }, 1500);
        } catch (error: any) {
            setResult(`Erro: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <p>Você precisa estar logado para acessar esta página.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // If user already exists in Convex, show loading while redirecting
    if (convexUser !== null && convexUser !== undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-2xl gradient-bg flex items-center justify-center">
                        <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">Bem-vindo à Plataforma!</CardTitle>
                    <CardDescription>
                        Configure sua conta para começar
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm"><strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}</p>
                        <p className="text-sm"><strong>Nome:</strong> {user.firstName} {user.lastName}</p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm font-medium">Selecione seu perfil:</p>
                        <div className="grid gap-3">
                            {roleOptions.map((role) => {
                                const Icon = role.icon;
                                return (
                                    <button
                                        key={role.value}
                                        type="button"
                                        onClick={() => setSelectedRole(role.value)}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all",
                                            selectedRole === role.value
                                                ? "border-primary bg-primary/5"
                                                : "border-muted hover:border-muted-foreground/50"
                                        )}
                                    >
                                        <div className={cn("h-10 w-10 rounded-lg bg-muted flex items-center justify-center", role.color)}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">{role.label}</div>
                                            <div className="text-xs text-muted-foreground">{role.description}</div>
                                        </div>
                                        {selectedRole === role.value && (
                                            <div className="h-4 w-4 rounded-full bg-primary" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <Button onClick={handleSetup} disabled={isLoading} className="w-full gap-2">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Criar Conta
                    </Button>

                    {result && (
                        <p className={cn(
                            "text-center font-medium",
                            result.startsWith("Sucesso") ? "text-green-500" : "text-red-500"
                        )}>
                            {result}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
