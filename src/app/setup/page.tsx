"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { Loader2, GraduationCap, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SetupPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string>("");
    const [isError, setIsError] = useState(false);

    // Get current user from Convex by email (to check if pre-registered)
    const preRegisteredUser = useQuery(
        api.users.getByEmail,
        user?.emailAddresses[0]?.emailAddress ? { email: user.emailAddresses[0].emailAddress } : "skip"
    );

    // Get current user from Convex by clerkId
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Upsert user mutation
    const upsertUser = useMutation(api.users.upsertFromClerk);

    // Redirect if user already exists and is active
    useEffect(() => {
        if (convexUser && convexUser.isActive) {
            router.push("/dashboard");
        }
    }, [convexUser, router]);

    // Auto-setup if user is pre-registered
    useEffect(() => {
        if (isLoaded && user && preRegisteredUser && !isLoading && !result) {
            // User was pre-registered by superadmin, auto-complete setup
            if (preRegisteredUser.clerkId.startsWith("pending_")) {
                handleAutoSetup();
            }
        }
    }, [isLoaded, user, preRegisteredUser, isLoading, result]);

    const handleAutoSetup = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            // Create/update the user in Convex - this will preserve role and org from superadmin
            await upsertUser({
                clerkId: user.id,
                email: user.emailAddresses[0]?.emailAddress || "",
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                imageUrl: user.imageUrl,
            });

            setResult("Conta ativada com sucesso! Redirecionando...");
            setIsError(false);
            toast.success("Bem-vindo! Sua conta foi ativada.");

            // Redirect after a short delay
            setTimeout(() => {
                router.push("/dashboard");
            }, 1500);
        } catch (error: any) {
            setResult(`Erro ao ativar conta: ${error.message}`);
            setIsError(true);
            toast.error(error.message || "Erro ao ativar conta");
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualSetup = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            // This will only work if it's the first user (bootstrap)
            await upsertUser({
                clerkId: user.id,
                email: user.emailAddresses[0]?.emailAddress || "",
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                imageUrl: user.imageUrl,
            });

            setResult("Conta criada com sucesso! Redirecionando...");
            setIsError(false);
            toast.success("Bem-vindo! Sua conta foi criada.");

            // Redirect after a short delay
            setTimeout(() => {
                router.push("/dashboard");
            }, 1500);
        } catch (error: any) {
            setResult(`Erro: ${error.message}`);
            setIsError(true);
            toast.error(error.message || "Erro ao criar conta");
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

    // If user already exists in Convex and is active, show loading while redirecting
    if (convexUser && convexUser.isActive) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const userEmail = user.emailAddresses[0]?.emailAddress;
    const isPreRegistered = preRegisteredUser && preRegisteredUser.clerkId.startsWith("pending_");
    const isFirstUser = !preRegisteredUser; // If no users exist yet, this is the first user

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-2xl gradient-bg flex items-center justify-center">
                        <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">Bem-vindo à Plataforma!</CardTitle>
                    <CardDescription>
                        {isPreRegistered 
                            ? "Ativando sua conta pré-cadastrada..."
                            : isFirstUser 
                                ? "Configure sua conta para começar"
                                : "Verificando seu acesso..."
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm"><strong>Email:</strong> {userEmail}</p>
                        <p className="text-sm"><strong>Nome:</strong> {user.firstName} {user.lastName}</p>
                    </div>

                    {isPreRegistered ? (
                        // User is pre-registered - show auto-setup in progress
                        <div className="text-center space-y-4">
                            <div className="flex items-center justify-center gap-2 text-primary">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Ativando sua conta...</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Seu perfil foi pré-configurado pelo administrador. 
                                Aguarde enquanto ativamos sua conta.
                            </p>
                        </div>
                    ) : isFirstUser ? (
                        // First user - allow creating account (will be superadmin)
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>Primeiro acesso detectado!</strong><br />
                                    Como você é o primeiro usuário, sua conta será criada automaticamente.
                                </p>
                            </div>
                            <Button 
                                onClick={handleManualSetup} 
                                disabled={isLoading} 
                                className="w-full gap-2"
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Criar Minha Conta
                            </Button>
                        </div>
                    ) : (
                        // Not pre-registered and not first user - show error
                        <div className="space-y-4">
                            <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                        Conta não encontrada
                                    </p>
                                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                        Este email não está cadastrado na plataforma. 
                                        Entre em contato com o administrador para solicitar acesso.
                                    </p>
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                onClick={() => router.push("/")} 
                                className="w-full"
                            >
                                Voltar para o início
                            </Button>
                        </div>
                    )}

                    {result && (
                        <div className={`flex items-center justify-center gap-2 ${isError ? 'text-red-500' : 'text-green-500'}`}>
                            {isError ? (
                                <AlertCircle className="h-5 w-5" />
                            ) : (
                                <CheckCircle2 className="h-5 w-5" />
                            )}
                            <p className="font-medium">{result}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
