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
    User,
    Bell,
    Shield,
    Palette,
    Save,
    Camera,
    Loader2,
    Check,
    Moon,
    Sun,
} from "lucide-react";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import { useTheme } from "next-themes";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function SettingsPage() {
    const { user } = useUser();
    const { theme, setTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);

    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        achievements: true,
        courseUpdates: true,
        marketing: false,
    });

    const handleSaveProfile = async () => {
        setIsLoading(true);
        // Simulate saving
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
        toast.success("Perfil atualizado com sucesso!");
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item}>
                <h1 className="text-2xl md:text-3xl font-bold">Configurações</h1>
                <p className="text-muted-foreground">Gerencie suas preferências</p>
            </motion.div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="w-full md:w-auto">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        Perfil
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        Notificações
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="gap-2">
                        <Palette className="h-4 w-4" />
                        Aparência
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Segurança
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6">
                    <motion.div variants={item}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Informações do Perfil</CardTitle>
                                <CardDescription>Atualize suas informações pessoais</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Avatar */}
                                <div className="flex items-center gap-6">
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage src={user?.imageUrl} />
                                        <AvatarFallback className="text-2xl">
                                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
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
                                        <Input id="firstName" defaultValue={user?.firstName || ""} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Sobrenome</Label>
                                        <Input id="lastName" defaultValue={user?.lastName || ""} />
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

                <TabsContent value="notifications" className="mt-6">
                    <motion.div variants={item}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Preferências de Notificação</CardTitle>
                                <CardDescription>Escolha como deseja ser notificado</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Notificações por email</p>
                                            <p className="text-sm text-muted-foreground">
                                                Receba atualizações por email
                                            </p>
                                        </div>
                                        <Switch
                                            checked={notifications.email}
                                            onCheckedChange={(checked) =>
                                                setNotifications({ ...notifications, email: checked })
                                            }
                                        />
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Notificações push</p>
                                            <p className="text-sm text-muted-foreground">
                                                Receba notificações no navegador
                                            </p>
                                        </div>
                                        <Switch
                                            checked={notifications.push}
                                            onCheckedChange={(checked) =>
                                                setNotifications({ ...notifications, push: checked })
                                            }
                                        />
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Conquistas</p>
                                            <p className="text-sm text-muted-foreground">
                                                Notificações de novas conquistas e badges
                                            </p>
                                        </div>
                                        <Switch
                                            checked={notifications.achievements}
                                            onCheckedChange={(checked) =>
                                                setNotifications({ ...notifications, achievements: checked })
                                            }
                                        />
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Atualizações de cursos</p>
                                            <p className="text-sm text-muted-foreground">
                                                Notifique quando houver novo conteúdo
                                            </p>
                                        </div>
                                        <Switch
                                            checked={notifications.courseUpdates}
                                            onCheckedChange={(checked) =>
                                                setNotifications({ ...notifications, courseUpdates: checked })
                                            }
                                        />
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Marketing</p>
                                            <p className="text-sm text-muted-foreground">
                                                Receba novidades e promoções
                                            </p>
                                        </div>
                                        <Switch
                                            checked={notifications.marketing}
                                            onCheckedChange={(checked) =>
                                                setNotifications({ ...notifications, marketing: checked })
                                            }
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>

                <TabsContent value="appearance" className="mt-6">
                    <motion.div variants={item}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Aparência</CardTitle>
                                <CardDescription>Personalize a aparência da plataforma</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <Label>Tema</Label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${theme === "light" ? "border-primary" : "border-muted"
                                                }`}
                                            onClick={() => setTheme("light")}
                                        >
                                            <div className="h-20 bg-white rounded-md border mb-2 flex items-center justify-center">
                                                <Sun className="h-6 w-6 text-amber-500" />
                                            </div>
                                            <p className="text-sm font-medium text-center">Claro</p>
                                        </div>
                                        <div
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${theme === "dark" ? "border-primary" : "border-muted"
                                                }`}
                                            onClick={() => setTheme("dark")}
                                        >
                                            <div className="h-20 bg-slate-900 rounded-md border mb-2 flex items-center justify-center">
                                                <Moon className="h-6 w-6 text-slate-300" />
                                            </div>
                                            <p className="text-sm font-medium text-center">Escuro</p>
                                        </div>
                                        <div
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${theme === "system" ? "border-primary" : "border-muted"
                                                }`}
                                            onClick={() => setTheme("system")}
                                        >
                                            <div className="h-20 bg-gradient-to-r from-white to-slate-900 rounded-md border mb-2 flex items-center justify-center">
                                                <div className="flex">
                                                    <Sun className="h-5 w-5 text-amber-500" />
                                                    <Moon className="h-5 w-5 text-slate-300" />
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium text-center">Sistema</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>

                <TabsContent value="security" className="mt-6">
                    <motion.div variants={item}>
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
