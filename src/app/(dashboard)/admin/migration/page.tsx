"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Wand2 } from "lucide-react";
import { toast } from "sonner";

export default function MigrationPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ updated: number; message: string } | null>(null);

    const migrateSlug = useMutation(api.users.addSlugToExistingUsers);

    const handleMigration = async () => {
        setIsLoading(true);
        setResult(null);

        try {
            const res = await migrateSlug();
            setResult(res);
            toast.success(res.message);
        } catch (error: any) {
            toast.error(error.message || "Erro ao executar migração");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl mx-auto py-8 px-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5" />
                        Migração de Slugs
                    </CardTitle>
                    <CardDescription>
                        Gera URLs amigáveis para todos os usuários existentes
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">
                            Esta migração vai gerar um <strong>slug</strong> único para cada usuário que ainda não tem.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Exemplo: O usuário &quot;Matteus Bochimpani&quot; terá a URL <code>/aluno/matteus-bochimpani</code>
                        </p>
                    </div>

                    {result && (
                        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <div>
                                    <p className="font-medium text-emerald-600">Migração concluída!</p>
                                    <p className="text-sm text-muted-foreground">{result.message}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={handleMigration}
                        disabled={isLoading}
                        className="w-full"
                        size="lg"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Executando migração...
                            </>
                        ) : (
                            <>
                                <Wand2 className="h-4 w-4 mr-2" />
                                Executar Migração de Slugs
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
