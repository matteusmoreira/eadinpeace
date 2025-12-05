"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ArrowLeft,
    Save,
    Loader2,
    User,
    GraduationCap,
    Users,
    Eye,
    EyeOff,
    RefreshCw,
    Copy,
    Check,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

const roles = [
    {
        value: "professor",
        label: "Professor",
        description: "Cria e ministra cursos",
        icon: GraduationCap,
        color: "bg-amber-500/10 text-amber-500",
    },
    {
        value: "student",
        label: "Aluno",
        description: "Acessa cursos matriculados",
        icon: Users,
        color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    },
];

export default function AdminNewUserPage() {
    const router = useRouter();
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "student" as "professor" | "student",
        imageUrl: "",
        sendInvite: false, // Padrão é criar com senha
    });

    // Get Convex user to get organizationId
    const convexUser = useQuery(api.users.getByClerkId, {
        clerkId: user?.id || ""
    });

    const createUser = useMutation(api.users.create);

    // Gerar senha aleatória
    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData((prev) => ({ ...prev, password }));
    };

    // Copiar credenciais
    const copyCredentials = async () => {
        const text = `Email: ${createdCredentials?.email}\nSenha: ${createdCredentials?.password}`;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Credenciais copiadas!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!convexUser?.organizationId) {
            toast.error("Organização não encontrada");
            return;
        }

        setIsLoading(true);

        try {
            let clerkId: string | undefined;

            // Se não vai enviar convite, criar usuário no Clerk com senha
            if (!formData.sendInvite && formData.password) {
                const response = await fetch("/api/users/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                    }),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || "Erro ao criar usuário no Clerk");
                }

                clerkId = result.clerkId;
            }

            await createUser({
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                role: formData.role,
                organizationId: convexUser.organizationId,
                imageUrl: formData.imageUrl || undefined,
                clerkId: clerkId,
            });

            if (!formData.sendInvite && formData.password) {
                // Salvar credenciais para mostrar ao usuário
                setCreatedCredentials({
                    email: formData.email,
                    password: formData.password,
                });
                toast.success("Usuário criado com sucesso! Copie as credenciais abaixo.");
            } else {
                toast.success("Usuário criado com sucesso!");
                router.push("/admin/users");
            }
        } catch (error: any) {
            toast.error(error.message || "Erro ao criar usuário");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-3xl mx-auto space-y-6"
        >
            {/* Header */}
            <motion.div variants={item} className="flex items-center gap-4">
                <Link href="/admin/users">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Novo Usuário</h1>
                    <p className="text-muted-foreground">
                        Adicione um novo usuário à organização
                    </p>
                </div>
            </motion.div>

            <form onSubmit={handleSubmit}>
                <motion.div variants={item} className="space-y-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Básicas</CardTitle>
                            <CardDescription>
                                Dados pessoais do usuário
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Avatar */}
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={formData.imageUrl || undefined} />
                                    <AvatarFallback className="text-2xl">
                                        {formData.firstName?.[0] || formData.lastName?.[0] || <User className="h-8 w-8" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-2">
                                    <Label htmlFor="imageUrl">URL da Foto (opcional)</Label>
                                    <Input
                                        id="imageUrl"
                                        placeholder="https://..."
                                        value={formData.imageUrl}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Nome *</Label>
                                    <Input
                                        id="firstName"
                                        placeholder="Nome"
                                        value={formData.firstName}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Sobrenome *</Label>
                                    <Input
                                        id="lastName"
                                        placeholder="Sobrenome"
                                        value={formData.lastName}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@exemplo.com"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                                    }
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Role */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Função</CardTitle>
                            <CardDescription>
                                Defina o nível de acesso do usuário
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 md:grid-cols-2">
                                {roles.map((role) => (
                                    <div
                                        key={role.value}
                                        className={cn(
                                            "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
                                            formData.role === role.value
                                                ? "border-primary bg-primary/5"
                                                : "border-muted hover:border-muted-foreground/50"
                                        )}
                                        onClick={() =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                role: role.value as typeof formData.role,
                                            }))
                                        }
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", role.color)}>
                                                <role.icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium">{role.label}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {role.description}
                                                </div>
                                            </div>
                                        </div>
                                        {formData.role === role.value && (
                                            <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                                                <div className="h-2 w-2 rounded-full bg-white" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Options */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Opções de Acesso</CardTitle>
                            <CardDescription>
                                Defina como o usuário irá acessar a plataforma
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Enviar Convite por Email</Label>
                                    <p className="text-sm text-muted-foreground">
                                        O usuário receberá um email para criar sua senha
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.sendInvite}
                                    onCheckedChange={(checked) =>
                                        setFormData((prev) => ({ ...prev, sendInvite: checked, password: "" }))
                                    }
                                />
                            </div>

                            {/* Campo de senha quando não enviar convite */}
                            {!formData.sendInvite && (
                                <>
                                    <Separator />
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Senha *</Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Input
                                                    id="password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Senha do usuário"
                                                    value={formData.password}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({ ...prev, password: e.target.value }))
                                                    }
                                                    required={!formData.sendInvite}
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={generatePassword}
                                                title="Gerar senha aleatória"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            O usuário poderá fazer login imediatamente com esta senha
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Credenciais Criadas */}
                    {createdCredentials && (
                        <Card className="border-emerald-500/50 bg-emerald-500/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-emerald-600">
                                    <Check className="h-5 w-5" />
                                    Usuário Criado com Sucesso!
                                </CardTitle>
                                <CardDescription>
                                    Copie as credenciais abaixo e compartilhe com o usuário
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-background rounded-lg p-4 border space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Email:</span>
                                        <span className="font-mono">{createdCredentials.email}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Senha:</span>
                                        <span className="font-mono">{createdCredentials.password}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={copyCredentials}
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="h-4 w-4 mr-2" />
                                                Copiado!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-4 w-4 mr-2" />
                                                Copiar Credenciais
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => router.push("/admin/users")}
                                        className="gradient-bg border-0"
                                    >
                                        Voltar para Usuários
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Link href="/admin/users">
                            <Button type="button" variant="outline">
                                Cancelar
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            className="gap-2 gradient-bg border-0"
                            disabled={isLoading || !!createdCredentials}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Criar Usuário
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </form>
        </motion.div>
    );
}
