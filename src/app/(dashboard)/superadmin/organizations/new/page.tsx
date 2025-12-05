"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    Save,
    Loader2,
    Building2,
    CreditCard,
    Users,
    BookOpen,
    Sparkles,
    Lock,
    Eye,
    EyeOff,
    RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
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

const plans = [
    {
        value: "starter" as const,
        label: "Starter",
        price: "R$ 99/mês",
        users: "Até 50 usuários",
        courses: "Até 10 cursos",
        color: "bg-slate-100 dark:bg-slate-800",
        features: ["Suporte por email", "Relatórios básicos"],
    },
    {
        value: "professional" as const,
        label: "Professional",
        price: "R$ 299/mês",
        users: "Até 500 usuários",
        courses: "Até 50 cursos",
        color: "bg-primary/10",
        popular: true,
        features: ["Suporte prioritário", "Relatórios avançados", "API Access"],
    },
    {
        value: "enterprise" as const,
        label: "Enterprise",
        price: "R$ 999/mês",
        users: "Até 10.000 usuários",
        courses: "Até 500 cursos",
        color: "gradient-bg",
        features: ["Suporte 24/7", "Customização", "SLA garantido", "White-label"],
    },
];

export default function NewOrganizationPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        logo: "",
        plan: "starter" as "starter" | "professional" | "enterprise",
        adminFirstName: "",
        adminLastName: "",
        adminEmail: "",
        adminPassword: "",
    });

    // Convex
    const createOrganization = useMutation(api.organizations.create);

    // Gerar senha aleatória
    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData((prev) => ({ ...prev, adminPassword: password }));
    };

    // Auto-generate slug from name
    useEffect(() => {
        const slug = formData.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        setFormData((prev) => ({ ...prev, slug }));
    }, [formData.name]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let adminClerkId: string | undefined;

            // Se informou dados do admin com senha, criar usuário no Clerk primeiro
            if (formData.adminEmail && formData.adminPassword && formData.adminFirstName && formData.adminLastName) {
                const response = await fetch("/api/users/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: formData.adminEmail,
                        password: formData.adminPassword,
                        firstName: formData.adminFirstName,
                        lastName: formData.adminLastName,
                    }),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || "Erro ao criar administrador");
                }

                adminClerkId = result.clerkId;
                toast.success("Administrador criado com sucesso!");
            }

            await createOrganization({
                name: formData.name,
                slug: formData.slug,
                logo: formData.logo || undefined,
                plan: formData.plan,
                adminEmail: formData.adminEmail || undefined,
                adminFirstName: formData.adminFirstName || undefined,
                adminLastName: formData.adminLastName || undefined,
                adminClerkId: adminClerkId,
            });

            toast.success("Organização criada com sucesso!");
            router.push("/superadmin/organizations");
        } catch (error: any) {
            toast.error(error.message || "Erro ao criar organização");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-4xl mx-auto space-y-6"
        >
            {/* Header */}
            <motion.div variants={item} className="flex items-center gap-4">
                <Link href="/superadmin/organizations">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Nova Organização</h1>
                    <p className="text-muted-foreground">
                        Cadastre uma nova organização na plataforma
                    </p>
                </div>
            </motion.div>

            <form onSubmit={handleSubmit}>
                <motion.div variants={item} className="space-y-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Informações Básicas
                            </CardTitle>
                            <CardDescription>
                                Dados da organização
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome da Organização *</Label>
                                    <Input
                                        id="name"
                                        placeholder="Ex: Escola ABC"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, name: e.target.value }))
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">Slug (URL) *</Label>
                                    <Input
                                        id="slug"
                                        placeholder="escola-abc"
                                        value={formData.slug}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, slug: e.target.value }))
                                        }
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        URL: {formData.slug || "slug"}.ead-platform.com
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="logo">URL do Logo (opcional)</Label>
                                <Input
                                    id="logo"
                                    placeholder="https://..."
                                    value={formData.logo}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, logo: e.target.value }))
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Plan Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Plano
                            </CardTitle>
                            <CardDescription>
                                Selecione o plano da organização
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                {plans.map((plan) => (
                                    <div
                                        key={plan.value}
                                        className={cn(
                                            "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
                                            formData.plan === plan.value
                                                ? "border-primary shadow-lg"
                                                : "border-muted hover:border-muted-foreground/50"
                                        )}
                                        onClick={() =>
                                            setFormData((prev) => ({ ...prev, plan: plan.value }))
                                        }
                                    >
                                        {plan.popular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                    <Sparkles className="h-3 w-3" />
                                                    Popular
                                                </span>
                                            </div>
                                        )}

                                        <div className={cn("h-2 w-full rounded-t-sm mb-3", plan.color)} />

                                        <h3 className="font-bold">{plan.label}</h3>
                                        <p className="text-2xl font-bold mt-1">{plan.price}</p>

                                        <Separator className="my-3" />

                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                {plan.users}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                {plan.courses}
                                            </div>
                                        </div>

                                        <ul className="mt-3 space-y-1">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <span className="text-emerald-500">✓</span>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>

                                        {formData.plan === plan.value && (
                                            <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                                <div className="h-2 w-2 rounded-full bg-white" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Admin Account */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5" />
                                Administrador Inicial (Opcional)
                            </CardTitle>
                            <CardDescription>
                                Crie a conta do primeiro administrador da organização com acesso imediato
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="adminFirstName">Nome</Label>
                                    <Input
                                        id="adminFirstName"
                                        placeholder="Nome"
                                        value={formData.adminFirstName}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, adminFirstName: e.target.value }))
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="adminLastName">Sobrenome</Label>
                                    <Input
                                        id="adminLastName"
                                        placeholder="Sobrenome"
                                        value={formData.adminLastName}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, adminLastName: e.target.value }))
                                        }
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="adminEmail">Email</Label>
                                    <Input
                                        id="adminEmail"
                                        type="email"
                                        placeholder="admin@organizacao.com"
                                        value={formData.adminEmail}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, adminEmail: e.target.value }))
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="adminPassword">Senha</Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                id="adminPassword"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Senha do administrador"
                                                value={formData.adminPassword}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({ ...prev, adminPassword: e.target.value }))
                                                }
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
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                O administrador poderá fazer login imediatamente com o email e senha definidos
                            </p>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Link href="/superadmin/organizations">
                            <Button type="button" variant="outline">
                                Cancelar
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            className="gap-2 gradient-bg border-0"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Criar Organização
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </form>
        </motion.div>
    );
}
