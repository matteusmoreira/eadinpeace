"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    User,
    Shield,
    Palette,
    Save,
    Camera,
    Loader2,
    Check,
    Moon,
    Sun,
    RefreshCw,
    Upload,
    Image as ImageIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import { useTheme } from "@/components/providers/theme-provider";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

const presetColors = [
    { name: "Roxo", primary: "#8B5CF6", secondary: "#A78BFA" },
    { name: "Azul", primary: "#3B82F6", secondary: "#60A5FA" },
    { name: "Verde", primary: "#10B981", secondary: "#34D399" },
    { name: "Rosa", primary: "#EC4899", secondary: "#F472B6" },
    { name: "Laranja", primary: "#F97316", secondary: "#FB923C" },
    { name: "Vermelho", primary: "#EF4444", secondary: "#F87171" },
];

const fontOptions = [
    { value: "inter", label: "Inter" },
    { value: "roboto", label: "Roboto" },
    { value: "poppins", label: "Poppins" },
    { value: "open-sans", label: "Open Sans" },
    { value: "lato", label: "Lato" },
];

export default function SettingsPage() {
    const { user } = useUser();
    const { theme, setTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [isAppearanceLoading, setIsAppearanceLoading] = useState(false);

    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get appearance settings
    const appearanceSettings = useQuery(api.platformSettings.getByKey, { key: "appearance" });

    // Mutations
    const updateUser = useMutation(api.users.update);
    const updateAppearance = useMutation(api.platformSettings.updateAppearance);

    const [formData, setFormData] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
    });



    const [appearanceForm, setAppearanceForm] = useState({
        primaryColor: "#8B5CF6",
        secondaryColor: "#A78BFA",
        theme: "system",
        font: "inter",
        enableDarkMode: true,
        enableAnimations: true,
        borderRadius: "0.5",
        logoUrl: "",
        faviconUrl: "",
    });

    // Load appearance settings from database
    useEffect(() => {
        if (appearanceSettings) {
            setAppearanceForm(prev => ({
                ...prev,
                primaryColor: appearanceSettings.primaryColor || prev.primaryColor,
                secondaryColor: appearanceSettings.secondaryColor || prev.secondaryColor,
                theme: appearanceSettings.theme || prev.theme,
                font: appearanceSettings.font || prev.font,
                enableDarkMode: appearanceSettings.enableDarkMode ?? prev.enableDarkMode,
                enableAnimations: appearanceSettings.enableAnimations ?? prev.enableAnimations,
                borderRadius: appearanceSettings.borderRadius || prev.borderRadius,
                logoUrl: appearanceSettings.logoUrl || prev.logoUrl,
                faviconUrl: appearanceSettings.faviconUrl || prev.faviconUrl,
            }));
        }
    }, [appearanceSettings]);

    const handleSaveProfile = async () => {
        if (!convexUser?._id) {
            toast.error("Usuário não encontrado");
            return;
        }

        setIsLoading(true);
        try {
            await updateUser({
                userId: convexUser._id,
                firstName: formData.firstName,
                lastName: formData.lastName,
            });
            toast.success("Perfil atualizado com sucesso!");
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            toast.error("Erro ao atualizar perfil");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAppearance = async () => {
        setIsAppearanceLoading(true);
        try {
            await updateAppearance({
                ...appearanceForm,
                userId: convexUser?._id,
            });
            toast.success("Configurações de aparência salvas com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar configurações:", error);
            toast.error("Erro ao salvar configurações");
        } finally {
            setIsAppearanceLoading(false);
        }
    };

    const applyPreset = (preset: typeof presetColors[0]) => {
        setAppearanceForm(prev => ({
            ...prev,
            primaryColor: preset.primary,
            secondaryColor: preset.secondary,
        }));
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item}>
                <h1 className="text-2xl md:text-3xl font-bold">Configurações</h1>
                <p className="text-muted-foreground">Gerencie suas preferências</p>
            </motion.div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="w-full md:w-auto flex overflow-x-auto">
                    <TabsTrigger value="profile" className="gap-1 sm:gap-2 flex-1 md:flex-initial text-xs sm:text-sm">
                        <User className="h-4 w-4" />
                        Perfil
                    </TabsTrigger>

                    <TabsTrigger value="appearance" className="gap-1 sm:gap-2 flex-1 md:flex-initial text-xs sm:text-sm">
                        <Palette className="h-4 w-4" />
                        <span className="hidden sm:inline">Aparência</span>
                        <span className="sm:hidden">Tema</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-1 sm:gap-2 flex-1 md:flex-initial text-xs sm:text-sm">
                        <Shield className="h-4 w-4" />
                        <span className="hidden sm:inline">Segurança</span>
                        <span className="sm:hidden">Seg.</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Informações do Perfil</CardTitle>
                                <CardDescription>Atualize suas informações pessoais</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Avatar */}
                                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                                        <AvatarImage src={user?.imageUrl} />
                                        <AvatarFallback className="text-xl sm:text-2xl">
                                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-center sm:text-left">
                                        <Button variant="outline" className="gap-2">
                                            <Camera className="h-4 w-4" />
                                            Alterar Foto
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            JPG, PNG ou GIF. Máximo 5MB.
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Form */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">Nome</Label>
                                        <Input
                                            id="firstName"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Sobrenome</Label>
                                        <Input
                                            id="lastName"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        defaultValue={user?.emailAddresses?.[0]?.emailAddress || ""}
                                        disabled
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        O email é gerenciado pelo Clerk e não pode ser alterado aqui.
                                    </p>
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={handleSaveProfile} disabled={isLoading} className="gap-2">
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                        Salvar Alterações
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>



                <TabsContent value="appearance" className="mt-6">
                    <div className="space-y-6">
                        {/* Header with Save Button */}
                        <div className="flex justify-end">
                            <Button onClick={handleSaveAppearance} disabled={isAppearanceLoading} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                                {isAppearanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Salvar Alterações
                            </Button>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Colors Card */}
                            <Card className="bg-card text-card-foreground border">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-foreground">
                                        <Palette className="h-5 w-5" />
                                        Cores
                                    </CardTitle>
                                    <CardDescription>Defina as cores principais da plataforma</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <Label className="mb-3 block">Presets</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {presetColors.map((preset) => (
                                                <button
                                                    key={preset.name}
                                                    onClick={() => applyPreset(preset)}
                                                    className="group flex items-center gap-2 px-3 py-2 rounded-lg border bg-background hover:border-primary transition-colors"
                                                >
                                                    <div
                                                        className="h-4 w-4 rounded-full"
                                                        style={{ backgroundColor: preset.primary }}
                                                    />
                                                    <span className="text-sm text-foreground">{preset.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="primaryColor">Cor Primária</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="primaryColor"
                                                    type="color"
                                                    value={appearanceForm.primaryColor}
                                                    onChange={(e) => setAppearanceForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                                                    className="h-10 w-14 p-1 cursor-pointer"
                                                />
                                                <Input
                                                    value={appearanceForm.primaryColor}
                                                    onChange={(e) => setAppearanceForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                                                    className="font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="secondaryColor">Cor Secundária</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="secondaryColor"
                                                    type="color"
                                                    value={appearanceForm.secondaryColor}
                                                    onChange={(e) => setAppearanceForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                                                    className="h-10 w-14 p-1 cursor-pointer"
                                                />
                                                <Input
                                                    value={appearanceForm.secondaryColor}
                                                    onChange={(e) => setAppearanceForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                                                    className="font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preview */}
                                    <div className="p-4 rounded-lg border">
                                        <p className="text-sm text-muted-foreground mb-3">Preview</p>
                                        <div className="flex gap-2">
                                            <Button
                                                style={{ backgroundColor: appearanceForm.primaryColor }}
                                                className="border-0"
                                            >
                                                Botão Primário
                                            </Button>
                                            <Button
                                                variant="outline"
                                                style={{ borderColor: appearanceForm.primaryColor, color: appearanceForm.primaryColor }}
                                            >
                                                Botão Secundário
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Theme & Typography Card */}
                            <Card className="bg-card text-card-foreground border">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-foreground">
                                        <Sun className="h-5 w-5" />
                                        Tema & Tipografia
                                    </CardTitle>
                                    <CardDescription>Configure o tema e fontes</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Tema Padrão</Label>
                                        <div className="flex gap-2">
                                            {[
                                                { value: "light", label: "Claro", icon: Sun },
                                                { value: "dark", label: "Escuro", icon: Moon },
                                                { value: "system", label: "Sistema", icon: RefreshCw },
                                            ].map((option) => (
                                                <Button
                                                    key={option.value}
                                                    variant={appearanceForm.theme === option.value ? "default" : "outline"}
                                                    onClick={() => {
                                                        setAppearanceForm(prev => ({ ...prev, theme: option.value }));
                                                        setTheme(option.value as "light" | "dark" | "system");
                                                    }}
                                                    className="flex-1 gap-2"
                                                >
                                                    <option.icon className="h-4 w-4" />
                                                    {option.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="font">Fonte</Label>
                                        <Select
                                            value={appearanceForm.font}
                                            onValueChange={(value) => setAppearanceForm(prev => ({ ...prev, font: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {fontOptions.map((font) => (
                                                    <SelectItem key={font.value} value={font.value}>
                                                        {font.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="borderRadius">Arredondamento dos Cantos</Label>
                                        <Select
                                            value={appearanceForm.borderRadius}
                                            onValueChange={(value) => setAppearanceForm(prev => ({ ...prev, borderRadius: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0">Nenhum</SelectItem>
                                                <SelectItem value="0.25">Sutil</SelectItem>
                                                <SelectItem value="0.5">Médio</SelectItem>
                                                <SelectItem value="0.75">Arredondado</SelectItem>
                                                <SelectItem value="1">Muito Arredondado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Permitir Modo Escuro</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Usuários podem alternar entre modo claro e escuro
                                                </p>
                                            </div>
                                            <Switch
                                                checked={appearanceForm.enableDarkMode}
                                                onCheckedChange={(checked) => setAppearanceForm(prev => ({ ...prev, enableDarkMode: checked }))}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Animações</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Ativar animações e transições suaves
                                                </p>
                                            </div>
                                            <Switch
                                                checked={appearanceForm.enableAnimations}
                                                onCheckedChange={(checked) => setAppearanceForm(prev => ({ ...prev, enableAnimations: checked }))}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Logo & Favicon Card */}
                            <Card className="md:col-span-2 bg-card text-card-foreground border">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-foreground">
                                        <ImageIcon className="h-5 w-5" />
                                        Logo & Favicon
                                    </CardTitle>
                                    <CardDescription>Personalize a identidade visual</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-4">
                                            <Label>Logo</Label>
                                            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                                                {appearanceForm.logoUrl ? (
                                                    <img src={appearanceForm.logoUrl} alt="Logo" className="max-h-16 mx-auto" />
                                                ) : (
                                                    <>
                                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                                        <p className="text-sm text-muted-foreground">
                                                            Arraste uma imagem ou clique para selecionar
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            PNG, SVG ou JPG (max. 2MB)
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Label>Favicon</Label>
                                            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                                                {appearanceForm.faviconUrl ? (
                                                    <img src={appearanceForm.faviconUrl} alt="Favicon" className="max-h-16 mx-auto" />
                                                ) : (
                                                    <>
                                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                                        <p className="text-sm text-muted-foreground">
                                                            Arraste uma imagem ou clique para selecionar
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            ICO ou PNG (32x32 ou 64x64)
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="security" className="mt-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Segurança</CardTitle>
                                <CardDescription>Gerencie a segurança da sua conta</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                <Check className="h-5 w-5 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-emerald-600">Conta verificada</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Sua conta está protegida pelo Clerk
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div>
                                        <h3 className="font-medium mb-2">Sessões Ativas</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Gerencie os dispositivos onde você está logado
                                        </p>
                                        <div className="p-4 rounded-lg border">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">Este dispositivo</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Último acesso: agora
                                                    </p>
                                                </div>
                                                <Button variant="outline" size="sm">
                                                    Atual
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div>
                                        <h3 className="font-medium mb-2">Alterar Senha</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            A alteração de senha é feita através do Clerk
                                        </p>
                                        <Button variant="outline">
                                            Gerenciar no Clerk
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}

