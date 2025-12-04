"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function SetupPage() {
    const { user, isLoaded } = useUser();
    const [result, setResult] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    // Get current user from Convex
    const convexUser = useQuery(api.users.getByClerkId, {
        clerkId: user?.id || ""
    });

    // Upsert user mutation
    const upsertUser = useMutation(api.users.upsertFromClerk);
    const promote = useMutation(api.users.promoteToSuperadmin);

    const handleSetup = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            // First, create/update the user in Convex
            await upsertUser({
                clerkId: user.id,
                email: user.emailAddresses[0]?.emailAddress || "",
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                imageUrl: user.imageUrl,
                role: "superadmin", // Set as superadmin directly
            });

            setResult(`Sucesso! Você agora é superadmin. Faça logout e login novamente.`);
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

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Setup Inicial</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm"><strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}</p>
                        <p className="text-sm"><strong>Nome:</strong> {user.firstName} {user.lastName}</p>
                        <p className="text-sm"><strong>Clerk ID:</strong> {user.id}</p>
                        {convexUser && (
                            <p className="text-sm"><strong>Role Atual:</strong> {convexUser.role}</p>
                        )}
                    </div>

                    <p className="text-muted-foreground">
                        Clique no botão abaixo para configurar sua conta como superadmin
                    </p>

                    <Button onClick={handleSetup} disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Configurar como Superadmin
                    </Button>

                    {result && (
                        <p className={result.startsWith("Sucesso") ? "text-green-500 font-medium" : "text-red-500"}>
                            {result}
                        </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                        Após configurar, faça logout e login novamente para aplicar as mudanças.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
