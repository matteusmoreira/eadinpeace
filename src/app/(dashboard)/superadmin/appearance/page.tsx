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
    Building,
    Globe
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

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
    const [selectedOrgId, setSelectedOrgId] = useState<string>("global");
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);

    // Refs for file inputs
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    // Get current user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get all organizations
    const organizations = useQuery(api.organizations.getAll) || [];

    // Get global settings
    const globalSettings = useQuery(api.platformSettings.getByKey, { key: "appearance" });

    // Get selected org details
    const selectedOrg = useQuery(
        api.organizations.getById,
        selectedOrgId !== "global" ? { organizationId: selectedOrgId as Id<"organizations"> } : "skip"
    );

    // Mutations
    const updateGlobalAppearance = useMutation(api.platformSettings.updateAppearance);
    const updateOrgAppearance = useMutation(api.organizations.update);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const updateOrgLogo = useMutation(api.organizations.updateLogo);
    const updateOrgFavicon = useMutation(api.organizations.updateFavicon);

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

    // Update settings when selection changes or data loads
    useEffect(() => {
        if (selectedOrgId === "global") {
            if (globalSettings) {
                setSettings({
                    primaryColor: globalSettings.primaryColor || "#8B5CF6",
                    secondaryColor: globalSettings.secondaryColor || "#A78BFA",
                    theme: globalSettings.theme || "system",
                    font: globalSettings.font || "inter",
                    enableDarkMode: globalSettings.enableDarkMode ?? true,
                    enableAnimations: globalSettings.enableAnimations ?? true,
                    borderRadius: globalSettings.borderRadius || "0.5",
                    logoUrl: globalSettings.logoUrl || "",
                    faviconUrl: globalSettings.faviconUrl || "",
                });
            }
        } else {
            if (selectedOrg) {
                setSettings({
                    primaryColor: selectedOrg.primaryColor || "#8B5CF6",
                    secondaryColor: selectedOrg.secondaryColor || "",
                    theme: selectedOrg.theme || "system",
                    font: selectedOrg.font || "inter",
                    enableDarkMode: selectedOrg.enableDarkMode ?? true,
                    enableAnimations: selectedOrg.enableAnimations ?? true,
                    borderRadius: selectedOrg.borderRadius || "0.5",
                    logoUrl: selectedOrg.logo || "",
                    faviconUrl: selectedOrg.favicon || "",
                });
            }
        }
    }, [selectedOrgId, globalSettings, selectedOrg]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            if (selectedOrgId === "global") {
                await updateGlobalAppearance({
                    ...settings,
                    userId: convexUser?._id,
                });
                toast.success("Configurações globais salvas com sucesso!");
            } else {
                await updateOrgAppearance({
                    organizationId: selectedOrgId as Id<"organizations">,
                    primaryColor: settings.primaryColor,
                    secondaryColor: settings.secondaryColor,
                    theme: settings.theme,
                    font: settings.font,
                    enableDarkMode: settings.enableDarkMode,
                    enableAnimations: settings.enableAnimations,
                    borderRadius: settings.borderRadius,
                    // Logos are handled separately via upload, but string URLs can be saved here if manually edited? 
                    // Usually we don't let users edit the URL string directly for images.
                });
                toast.success(`Configurações de ${selectedOrg?.name} salvas com sucesso!`);
            }
        } catch (error) {
            console.error("Erro ao salvar configurações:", error);
            toast.error("Erro ao salvar configurações");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: "logo" | "favicon") => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validation
        if (file.size > 2 * 1024 * 1024) { // 2MB
            toast.error("O arquivo deve ter no máximo 2MB");
            return;
        }

        const isLogo = type === "logo";
        const setUploading = isLogo ? setIsUploadingLogo : setIsUploadingFavicon;

        setUploading(true);

        try {
            // 1. Get upload URL
            const postUrl = await generateUploadUrl();

            // 2. Upload file
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) throw new Error("Falha no upload");

            const { storageId } = await result.json();

            // 3. Save to DB
            if (selectedOrgId === "global") {
                // For global, we use the regular update mutation with storageId which is now supported
                await updateGlobalAppearance({
                    userId: convexUser?._id,
                    [isLogo ? "logoStorageId" : "faviconStorageId"]: storageId
                });
                // Success for global
            } else {
                if (isLogo) {
                    const url = await updateOrgLogo({
                        organizationId: selectedOrgId as Id<"organizations">,
                        storageId
                    });
                    setSettings(prev => ({ ...prev, logoUrl: url }));
                } else {
                    const url = await updateOrgFavicon({
                        organizationId: selectedOrgId as Id<"organizations">,
                        storageId
                    });
                    setSettings(prev => ({ ...prev, faviconUrl: url }));
                }
            }

            toast.success("Imagem atualizada com sucesso!");
        } catch (error) {
            console.error("Erro no upload:", error);
            toast.error("Erro ao atualizar imagem");
        } finally {
            setUploading(false);
            // Reset input
            if (event.target) event.target.value = "";
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
                    <p className="text-muted-foreground">Personalize a aparência da plataforma e organizações</p>
                </div>
                <div className="flex items-center gap-4">
                    <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Selecione o escopo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="global">
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    <span>Global (Padrão)</span>
                                </div>
                            </SelectItem>
                            {organizations?.map((org) => (
                                <SelectItem key={org._id} value={org._id}>
                                    <div className="flex items-center gap-2">
                                        <Building className="h-4 w-4" />
                                        <span>{org.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={handleSave} disabled={isLoading} className="gap-2 gradient-bg border-0">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Salvar
                    </Button>
                </div>
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
                            <CardDescription>Defina as cores principais para {selectedOrgId === "global" ? "toda a plataforma" : selectedOrg?.name}</CardDescription>
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
                                    <input
                                        type="file"
                                        ref={logoInputRef}
                                        className="hidden"
                                        accept="image/png,image/jpeg,image/svg+xml"
                                        onChange={(e) => handleFileUpload(e, "logo")}
                                    />
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer relative ${selectedOrgId === "global" ? "opacity-50 cursor-not-allowed" : ""}`}
                                        onClick={() => selectedOrgId !== "global" && logoInputRef.current?.click()}
                                    >
                                        {isUploadingLogo && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                            </div>
                                        )}
                                        {settings.logoUrl ? (
                                            <img src={settings.logoUrl} alt="Logo" className="max-h-16 mx-auto" />
                                        ) : (
                                            <>
                                                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedOrgId === "global" ? "Selecione uma organização para upload" : "Arraste uma imagem ou clique para selecionar"}
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
                                    <input
                                        type="file"
                                        ref={faviconInputRef}
                                        className="hidden"
                                        accept="image/png,image/x-icon"
                                        onChange={(e) => handleFileUpload(e, "favicon")}
                                    />
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer relative ${selectedOrgId === "global" ? "opacity-50 cursor-not-allowed" : ""}`}
                                        onClick={() => selectedOrgId !== "global" && faviconInputRef.current?.click()}
                                    >
                                        {isUploadingFavicon && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                            </div>
                                        )}
                                        {settings.faviconUrl ? (
                                            <img src={settings.faviconUrl} alt="Favicon" className="max-h-16 mx-auto" />
                                        ) : (
                                            <>
                                                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedOrgId === "global" ? "Selecione uma organização para upload" : "Arraste uma imagem ou clique para selecionar"}
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
