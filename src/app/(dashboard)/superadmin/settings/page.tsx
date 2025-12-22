"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    Settings,
    Globe,
    Mail,
    CreditCard,
    Shield,
    Database,
    Save,
    Loader2,
    AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function SuperadminSettingsPage() {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [activeSection, setActiveSection] = useState("");

    // Get current user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get all settings
    const allSettings = useQuery(api.platformSettings.getAll);

    // Mutations
    const updateGeneral = useMutation(api.platformSettings.updateGeneral);
    const updateEmail = useMutation(api.platformSettings.updateEmail);
    const updatePayment = useMutation(api.platformSettings.updatePayment);
    const updateSecurity = useMutation(api.platformSettings.updateSecurity);

    const [generalSettings, setGeneralSettings] = useState({
        platformName: "EAD Pro",
        platformUrl: "https://eadpro.com",
        supportEmail: "suporte@eadpro.com",
        maxFileSize: 50,
        enableRegistration: true,
        maintenanceMode: false,
    });

    const [emailSettings, setEmailSettings] = useState({
        smtpHost: "",
        smtpPort: "587",
        smtpUser: "",
        smtpPassword: "",
        fromEmail: "",
        fromName: "EAD Pro",
        enableEmailNotifications: true,
    });

    const [paymentSettings, setPaymentSettings] = useState({
        stripePublicKey: "",
        stripeSecretKey: "",
        enablePayments: false,
        currency: "BRL",
    });

    const [securitySettings, setSecuritySettings] = useState({
        enable2FA: false,
        sessionTimeout: 60,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        requireUppercase: true,
        requireNumbers: true,
    });

    // Load settings from database
    useEffect(() => {
        if (allSettings) {
            if (allSettings.general) {
                setGeneralSettings(prev => ({
                    ...prev,
                    platformName: allSettings.general.platformName || prev.platformName,
                    platformUrl: allSettings.general.platformUrl || prev.platformUrl,
                    supportEmail: allSettings.general.supportEmail || prev.supportEmail,
                    maxFileSize: allSettings.general.maxFileSize || prev.maxFileSize,
                    enableRegistration: allSettings.general.enableRegistration ?? prev.enableRegistration,
                    maintenanceMode: allSettings.general.maintenanceMode ?? prev.maintenanceMode,
                }));
            }
            if (allSettings.email) {
                setEmailSettings(prev => ({
                    ...prev,
                    smtpHost: allSettings.email.smtpHost || prev.smtpHost,
                    smtpPort: allSettings.email.smtpPort || prev.smtpPort,
                    smtpUser: allSettings.email.smtpUser || prev.smtpUser,
                    smtpPassword: allSettings.email.smtpPassword || prev.smtpPassword,
                    fromEmail: allSettings.email.fromEmail || prev.fromEmail,
                    fromName: allSettings.email.fromName || prev.fromName,
                    enableEmailNotifications: allSettings.email.enableEmailNotifications ?? prev.enableEmailNotifications,
                }));
            }
            if (allSettings.payment) {
                setPaymentSettings(prev => ({
                    ...prev,
                    stripePublicKey: allSettings.payment.stripePublicKey || prev.stripePublicKey,
                    stripeSecretKey: allSettings.payment.stripeSecretKey || prev.stripeSecretKey,
                    enablePayments: allSettings.payment.enablePayments ?? prev.enablePayments,
                    currency: allSettings.payment.currency || prev.currency,
                }));
            }
            if (allSettings.security) {
                setSecuritySettings(prev => ({
                    ...prev,
                    enable2FA: allSettings.security.enable2FA ?? prev.enable2FA,
                    sessionTimeout: allSettings.security.sessionTimeout || prev.sessionTimeout,
                    maxLoginAttempts: allSettings.security.maxLoginAttempts || prev.maxLoginAttempts,
                    passwordMinLength: allSettings.security.passwordMinLength || prev.passwordMinLength,
                    requireUppercase: allSettings.security.requireUppercase ?? prev.requireUppercase,
                    requireNumbers: allSettings.security.requireNumbers ?? prev.requireNumbers,
                }));
            }
        }
    }, [allSettings]);

    const handleSave = async (section: string) => {
        setIsLoading(true);
        setActiveSection(section);
        try {
            switch (section) {
                case "Geral":
                    await updateGeneral({
                        ...generalSettings,
                        userId: convexUser?._id,
                    });
                    break;
                case "Email":
                    await updateEmail({
                        ...emailSettings,
                        userId: convexUser?._id,
                    });
                    break;
                case "Pagamentos":
                    await updatePayment({
                        ...paymentSettings,
                        userId: convexUser?._id,
                    });
                    break;
                case "Segurança":
                    await updateSecurity({
                        ...securitySettings,
                        userId: convexUser?._id,
                    });
                    break;
            }
            toast.success(`Configurações de ${section} salvas com sucesso!`);
        } catch (error) {
            console.error("Erro ao salvar configurações:", error);
            toast.error("Erro ao salvar configurações");
        } finally {
            setIsLoading(false);
            setActiveSection("");
        }
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item}>
                <h1 className="text-2xl md:text-3xl font-bold">Configurações</h1>
                <p className="text-muted-foreground">Gerencie as configurações globais da plataforma</p>
            </motion.div>

            <motion.div variants={item}>
                <Tabs defaultValue="general" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="general" className="gap-2">
                            <Globe className="h-4 w-4" />
                            <span className="hidden sm:inline">Geral</span>
                        </TabsTrigger>
                        <TabsTrigger value="email" className="gap-2">
                            <Mail className="h-4 w-4" />
                            <span className="hidden sm:inline">Email</span>
                        </TabsTrigger>
                        <TabsTrigger value="payment" className="gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span className="hidden sm:inline">Pagamentos</span>
                        </TabsTrigger>
                        <TabsTrigger value="security" className="gap-2">
                            <Shield className="h-4 w-4" />
                            <span className="hidden sm:inline">Segurança</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* General Settings */}
                    <TabsContent value="general">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configurações Gerais</CardTitle>
                                <CardDescription>Configurações básicas da plataforma</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="platformName">Nome da Plataforma</Label>
                                        <Input
                                            id="platformName"
                                            value={generalSettings.platformName}
                                            onChange={(e) => setGeneralSettings(prev => ({ ...prev, platformName: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="platformUrl">URL da Plataforma</Label>
                                        <Input
                                            id="platformUrl"
                                            value={generalSettings.platformUrl}
                                            onChange={(e) => setGeneralSettings(prev => ({ ...prev, platformUrl: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="supportEmail">Email de Suporte</Label>
                                        <Input
                                            id="supportEmail"
                                            type="email"
                                            value={generalSettings.supportEmail}
                                            onChange={(e) => setGeneralSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxFileSize">Tamanho Máx. de Arquivos (MB)</Label>
                                        <Input
                                            id="maxFileSize"
                                            type="number"
                                            value={generalSettings.maxFileSize}
                                            onChange={(e) => setGeneralSettings(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) }))}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Permitir Novos Registros</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Permite que novos usuários se registrem na plataforma
                                            </p>
                                        </div>
                                        <Switch
                                            checked={generalSettings.enableRegistration}
                                            onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, enableRegistration: checked }))}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-amber-500">Modo de Manutenção</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Bloqueia o acesso de usuários à plataforma
                                            </p>
                                        </div>
                                        <Switch
                                            checked={generalSettings.maintenanceMode}
                                            onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={() => handleSave("Geral")} disabled={isLoading}>
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                        Salvar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Email Settings */}
                    <TabsContent value="email">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configurações de Email</CardTitle>
                                <CardDescription>Configure o servidor SMTP para envio de emails</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="smtpHost">Servidor SMTP</Label>
                                        <Input
                                            id="smtpHost"
                                            placeholder="smtp.exemplo.com"
                                            value={emailSettings.smtpHost}
                                            onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="smtpPort">Porta</Label>
                                        <Input
                                            id="smtpPort"
                                            value={emailSettings.smtpPort}
                                            onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="smtpUser">Usuário</Label>
                                        <Input
                                            id="smtpUser"
                                            value={emailSettings.smtpUser}
                                            onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="smtpPassword">Senha</Label>
                                        <Input
                                            id="smtpPassword"
                                            type="password"
                                            value={emailSettings.smtpPassword}
                                            onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="fromEmail">Email de Envio</Label>
                                        <Input
                                            id="fromEmail"
                                            type="email"
                                            placeholder="noreply@seusite.com"
                                            value={emailSettings.fromEmail}
                                            onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fromName">Nome de Exibição</Label>
                                        <Input
                                            id="fromName"
                                            value={emailSettings.fromName}
                                            onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Notificações por Email</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Enviar notificações automáticas por email
                                        </p>
                                    </div>
                                    <Switch
                                        checked={emailSettings.enableEmailNotifications}
                                        onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, enableEmailNotifications: checked }))}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={() => handleSave("Email")} disabled={isLoading}>
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                        Salvar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Payment Settings */}
                    <TabsContent value="payment">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configurações de Pagamento</CardTitle>
                                <CardDescription>Configure as integrações de pagamento</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20 flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                            Atenção com as chaves de API
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Nunca compartilhe suas chaves secretas. Use variáveis de ambiente em produção.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="stripePublicKey">Chave Pública Stripe</Label>
                                        <Input
                                            id="stripePublicKey"
                                            placeholder="pk_..."
                                            value={paymentSettings.stripePublicKey}
                                            onChange={(e) => setPaymentSettings(prev => ({ ...prev, stripePublicKey: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="stripeSecretKey">Chave Secreta Stripe</Label>
                                        <Input
                                            id="stripeSecretKey"
                                            type="password"
                                            placeholder="sk_..."
                                            value={paymentSettings.stripeSecretKey}
                                            onChange={(e) => setPaymentSettings(prev => ({ ...prev, stripeSecretKey: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Habilitar Pagamentos</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Ativar sistema de cobranças e pagamentos
                                        </p>
                                    </div>
                                    <Switch
                                        checked={paymentSettings.enablePayments}
                                        onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, enablePayments: checked }))}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={() => handleSave("Pagamentos")} disabled={isLoading}>
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                        Salvar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Security Settings */}
                    <TabsContent value="security">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configurações de Segurança</CardTitle>
                                <CardDescription>Políticas de segurança e autenticação</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="sessionTimeout">Timeout de Sessão (minutos)</Label>
                                        <Input
                                            id="sessionTimeout"
                                            type="number"
                                            value={securitySettings.sessionTimeout}
                                            onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxLoginAttempts">Máx. Tentativas de Login</Label>
                                        <Input
                                            id="maxLoginAttempts"
                                            type="number"
                                            value={securitySettings.maxLoginAttempts}
                                            onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="passwordMinLength">Tamanho Mínimo de Senha</Label>
                                    <Input
                                        id="passwordMinLength"
                                        type="number"
                                        className="max-w-[200px]"
                                        value={securitySettings.passwordMinLength}
                                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
                                    />
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Autenticação de Dois Fatores (2FA)</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Exigir 2FA para todos os usuários
                                            </p>
                                        </div>
                                        <Switch
                                            checked={securitySettings.enable2FA}
                                            onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, enable2FA: checked }))}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Exigir Letras Maiúsculas</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Senhas devem conter letras maiúsculas
                                            </p>
                                        </div>
                                        <Switch
                                            checked={securitySettings.requireUppercase}
                                            onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, requireUppercase: checked }))}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Exigir Números</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Senhas devem conter números
                                            </p>
                                        </div>
                                        <Switch
                                            checked={securitySettings.requireNumbers}
                                            onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, requireNumbers: checked }))}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={() => handleSave("Segurança")} disabled={isLoading}>
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                        Salvar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </motion.div>
    );
}
