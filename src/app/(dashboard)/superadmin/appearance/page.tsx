"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Palette,
    Sun,
    Moon,
    Upload,
    Save,
    Loader2,
    Image as ImageIcon,
    RefreshCw,
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

export default function SuperadminAppearancePage() {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(false);

    // Get current user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get appearance settings
    const appearanceSettings = useQuery(api.platformSettings.getByKey, { key: "appearance" });

    // Mutation
    const updateAppearance = useMutation(api.platformSettings.updateAppearance);

    const [settings, setSettings] = useState({
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

    // Load settings from database
    useEffect(() => {
        if (appearanceSettings) {
            setSettings(prev => ({
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

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateAppearance({
                ...settings,
                userId: convexUser?._id,
            });
            toast.success("Configurações de aparência salvas com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar configurações:", error);
            toast.error("Erro ao salvar configurações");
        } finally {
            setIsLoading(false);
        }
    };

    const applyPreset = (preset: typeof presetColors[0]) => {
        setSettings(prev => ({
            ...prev,
            primaryColor: preset.primary,
            secondaryColor: preset.secondary,
        }));
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Aparência</h1>
                    <p className="text-muted-foreground">Personalize a aparência da plataforma</p>
                </div>
                <Button onClick={handleSave} disabled={isLoading} className="gap-2 gradient-bg border-0">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar Alterações
                </Button>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Colors */}
                <motion.div variants={item}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
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
                                            className="group flex items-center gap-2 px-3 py-2 rounded-lg border hover:border-primary transition-colors"
                                        >
                                            <div
                                                className="h-4 w-4 rounded-full"
                                                style={{ backgroundColor: preset.primary }}
                                            />
                                            <span className="text-sm">{preset.name}</span>
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
                                            value={settings.primaryColor}
                                            onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                                            className="h-10 w-14 p-1 cursor-pointer"
                                        />
                                        <Input
                                            value={settings.primaryColor}
                                            onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
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
                                            value={settings.secondaryColor}
                                            onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                                            className="h-10 w-14 p-1 cursor-pointer"
                                        />
                                        <Input
                                            value={settings.secondaryColor}
                                            onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
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
                                        style={{ backgroundColor: settings.primaryColor }}
                                        className="border-0"
                                    >
                                        Botão Primário
                                    </Button>
                                    <Button
                                        variant="outline"
                                        style={{ borderColor: settings.primaryColor, color: settings.primaryColor }}
                                    >
                                        Botão Secundário
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Theme & Typography */}
                <motion.div variants={item}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
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
                                            variant={settings.theme === option.value ? "default" : "outline"}
                                            onClick={() => setSettings(prev => ({ ...prev, theme: option.value }))}
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
                                    value={settings.font}
                                    onValueChange={(value) => setSettings(prev => ({ ...prev, font: value }))}
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
                                    value={settings.borderRadius}
                                    onValueChange={(value) => setSettings(prev => ({ ...prev, borderRadius: value }))}
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
                                        checked={settings.enableDarkMode}
                                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableDarkMode: checked }))}
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
                                        checked={settings.enableAnimations}
                                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableAnimations: checked }))}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Logo & Favicon */}
                <motion.div variants={item} className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
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
                                        {settings.logoUrl ? (
                                            <img src={settings.logoUrl} alt="Logo" className="max-h-16 mx-auto" />
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
                                        {settings.faviconUrl ? (
                                            <img src={settings.faviconUrl} alt="Favicon" className="max-h-16 mx-auto" />
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
                </motion.div>
            </div>
        </motion.div>
    );
}
