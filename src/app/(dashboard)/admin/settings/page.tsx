"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
    Video,
    Shield,
    Eye,
    EyeOff,
    Save,
    TestTube,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    Settings,
    Cloud,
    Play,
    HelpCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export default function BunnySettingsPage() {
    const { user, isLoading: userLoading } = useCurrentUser();
    const organizationId = user?.organizationId;

    // Form states
    const [apiKey, setApiKey] = useState("");
    const [libraryId, setLibraryId] = useState("");
    const [cdnHostname, setCdnHostname] = useState("");
    const [enabled, setEnabled] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Queries and mutations - Skip if there's no valid organizationId
    const hasValidOrgId = organizationId !== undefined && organizationId !== null;
    const settings = useQuery(
        api.organizationSettings.getSettings,
        hasValidOrgId ? { organizationId } : "skip"
    );
    const updateBunnySettings = useMutation(api.organizationSettings.updateBunnySettings);

    // Load settings into form
    useEffect(() => {
        if (settings) {
            setApiKey(settings.bunnyApiKey || "");
            setLibraryId(settings.bunnyLibraryId || "");
            setCdnHostname(settings.bunnyCdnHostname || "");
            setEnabled(settings.bunnyEnabled || false);
            setHasUnsavedChanges(false);
        }
    }, [settings]);

    // Track changes
    useEffect(() => {
        if (settings) {
            const hasChanges =
                apiKey !== (settings.bunnyApiKey || "") ||
                libraryId !== (settings.bunnyLibraryId || "") ||
                cdnHostname !== (settings.bunnyCdnHostname || "") ||
                enabled !== (settings.bunnyEnabled || false);
            setHasUnsavedChanges(hasChanges);
        }
    }, [apiKey, libraryId, cdnHostname, enabled, settings]);

    const handleSave = async () => {
        if (!organizationId) return;

        setIsSaving(true);
        try {
            await updateBunnySettings({
                organizationId,
                bunnyApiKey: apiKey || undefined,
                bunnyLibraryId: libraryId || undefined,
                bunnyCdnHostname: cdnHostname || undefined,
                bunnyEnabled: enabled,
            });
            toast.success("Configurações salvas com sucesso!");
            setHasUnsavedChanges(false);
        } catch (error: any) {
            toast.error(error.message || "Erro ao salvar configurações");
        } finally {
            setIsSaving(false);
        }
    };

    const handleTest = async () => {
        if (!apiKey || !libraryId) {
            setTestResult({ success: false, message: "API Key e Library ID são obrigatórios" });
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            // Test the connection by making a request to Bunny Stream API
            const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos?page=1&itemsPerPage=1`, {
                method: "GET",
                headers: {
                    "AccessKey": apiKey,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                setTestResult({ success: true, message: "Conexão bem-sucedida! As credenciais estão corretas." });
                toast.success("Teste de conexão bem-sucedido!");
            } else if (response.status === 401) {
                setTestResult({ success: false, message: "Falha na autenticação. Verifique a API Key." });
            } else if (response.status === 404) {
                setTestResult({ success: false, message: "Library não encontrada. Verifique o Library ID." });
            } else {
                const errorText = await response.text();
                setTestResult({ success: false, message: `Erro: ${response.status} - ${errorText}` });
            }
        } catch (error: any) {
            setTestResult({ success: false, message: `Erro de conexão: ${error.message}` });
        } finally {
            setIsTesting(false);
        }
    };

    const isConfigured = !!(apiKey && libraryId);

    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!hasValidOrgId) {
        return (
            <div className="container max-w-4xl mx-auto py-8 px-4">
                <Card className="border-2">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Organização não encontrada</h2>
                            <p className="text-muted-foreground">
                                Você precisa estar associado a uma organização para acessar estas configurações.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                                <Video className="h-5 w-5 text-white" />
                            </div>
                            <span className="truncate">Configurações de Vídeo</span>
                        </h1>
                        <p className="text-muted-foreground text-sm sm:text-base">
                            Configure a integração com o Bunny Stream para streaming de vídeos
                        </p>
                    </div>
                    <Badge
                        variant={isConfigured && enabled ? "default" : "secondary"}
                        className="gap-1 self-start sm:self-auto flex-shrink-0"
                    >
                        {isConfigured && enabled ? (
                            <>
                                <CheckCircle2 className="h-3 w-3" />
                                Configurado
                            </>
                        ) : (
                            <>
                                <AlertCircle className="h-3 w-3" />
                                Não configurado
                            </>
                        )}
                    </Badge>
                </div>

                {/* Main Settings Card */}
                <Card className="border-2">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                                <Cloud className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Bunny Stream</CardTitle>
                                <CardDescription>
                                    Plataforma de streaming de vídeo de alta performance
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Enable/Disable Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium">Ativar Bunny Stream</Label>
                                <p className="text-sm text-muted-foreground">
                                    Permite o upload e streaming de vídeos via Bunny
                                </p>
                            </div>
                            <Switch
                                checked={enabled}
                                onCheckedChange={setEnabled}
                            />
                        </div>

                        <Separator />

                        {/* API Key */}
                        <div className="space-y-2">
                            <Label htmlFor="apiKey" className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                API Key
                            </Label>
                            <div className="relative">
                                <Input
                                    id="apiKey"
                                    type={showApiKey ? "text" : "password"}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="sua-api-key-aqui"
                                    className="pr-10 font-mono"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                >
                                    {showApiKey ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Encontre em: bunny.net → Account → API
                            </p>
                        </div>

                        {/* Library ID */}
                        <div className="space-y-2">
                            <Label htmlFor="libraryId" className="flex items-center gap-2">
                                <Play className="h-4 w-4 text-muted-foreground" />
                                Library ID
                            </Label>
                            <Input
                                id="libraryId"
                                type="text"
                                value={libraryId}
                                onChange={(e) => setLibraryId(e.target.value)}
                                placeholder="12345"
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                Encontre em: bunny.net → Stream → Video Libraries → Selecione sua library
                            </p>
                        </div>

                        {/* CDN Hostname */}
                        <div className="space-y-2">
                            <Label htmlFor="cdnHostname" className="flex items-center gap-2">
                                <Cloud className="h-4 w-4 text-muted-foreground" />
                                CDN Hostname (opcional)
                            </Label>
                            <Input
                                id="cdnHostname"
                                type="text"
                                value={cdnHostname}
                                onChange={(e) => setCdnHostname(e.target.value)}
                                placeholder="vz-xxxxxx.b-cdn.net"
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                Encontre em: Video Library → Delivery → Hostname
                            </p>
                        </div>

                        {/* Test Result */}
                        {testResult && (
                            <Alert variant={testResult.success ? "default" : "destructive"}>
                                {testResult.success ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    <AlertCircle className="h-4 w-4" />
                                )}
                                <AlertTitle>{testResult.success ? "Sucesso" : "Erro"}</AlertTitle>
                                <AlertDescription>{testResult.message}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>

                    <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between border-t pt-6">
                        <Button
                            variant="outline"
                            onClick={handleTest}
                            disabled={isTesting || !apiKey || !libraryId}
                            className="w-full sm:w-auto"
                        >
                            {isTesting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <TestTube className="h-4 w-4 mr-2" />
                            )}
                            Testar Conexão
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !hasUnsavedChanges}
                            className="w-full sm:w-auto"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Salvar Alterações
                        </Button>
                    </CardFooter>
                </Card>

                {/* Help Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <HelpCircle className="h-5 w-5" />
                            Guia de Configuração
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="step1">
                                <AccordionTrigger>1. Criar conta no Bunny.net</AccordionTrigger>
                                <AccordionContent className="space-y-2">
                                    <p>
                                        Acesse{" "}
                                        <a
                                            href="https://bunny.net"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline inline-flex items-center gap-1"
                                        >
                                            bunny.net
                                            <ExternalLink className="h-3 w-3" />
                                        </a>{" "}
                                        e crie uma conta gratuita.
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        O Bunny oferece 14 dias de teste grátis com créditos incluídos.
                                    </p>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="step2">
                                <AccordionTrigger>2. Criar uma Video Library</AccordionTrigger>
                                <AccordionContent className="space-y-2">
                                    <ol className="list-decimal list-inside space-y-1">
                                        <li>No dashboard do Bunny, vá para <strong>Stream</strong></li>
                                        <li>Clique em <strong>Video Libraries</strong></li>
                                        <li>Clique em <strong>Add Video Library</strong></li>
                                        <li>Dê um nome (ex: "EAD Videos") e configure as opções</li>
                                    </ol>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="step3">
                                <AccordionTrigger>3. Obter as credenciais</AccordionTrigger>
                                <AccordionContent className="space-y-3">
                                    <div>
                                        <strong>API Key:</strong>
                                        <p className="text-sm text-muted-foreground">
                                            Vá em Account → API e copie a chave.
                                        </p>
                                    </div>
                                    <div>
                                        <strong>Library ID:</strong>
                                        <p className="text-sm text-muted-foreground">
                                            Na sua Video Library, o ID está na URL ou nas configurações.
                                        </p>
                                    </div>
                                    <div>
                                        <strong>CDN Hostname:</strong>
                                        <p className="text-sm text-muted-foreground">
                                            Na Video Library, vá em Delivery e copie o Hostname.
                                        </p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="pricing">
                                <AccordionTrigger>Preços do Bunny Stream</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="space-y-1 text-sm">
                                        <li>• <strong>Storage:</strong> $0.004/GB/mês</li>
                                        <li>• <strong>Bandwidth:</strong> $0.01/GB (varia por região)</li>
                                        <li>• <strong>Encoding:</strong> Gratuito</li>
                                        <li>• <strong>Trial:</strong> 14 dias grátis</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>

                {/* Documentation Link */}
                <div className="text-center text-sm text-muted-foreground">
                    <a
                        href="https://docs.bunny.net/docs/stream-api-overview"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                        Documentação oficial do Bunny Stream
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
            </motion.div>
        </div>
    );
}
