"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
    AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@convex/_generated/dataModel";

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

// Fallback plans for when no plans exist in database
const fallbackPlans = [
    {
        _id: "starter" as unknown as Id<"subscriptionPlans">,
        name: "Starter",
        description: "Ideal para pequenas organizações",
        price: 9900,
        interval: "monthly" as const,
        maxUsers: 50,
        maxCourses: 10,
        features: ["Suporte por email", "Relatórios básicos"],
        isActive: true,
    },
    {
        _id: "professional" as unknown as Id<"subscriptionPlans">,
        name: "Professional",
        description: "Para organizações em crescimento",
        price: 29900,
        interval: "monthly" as const,
        maxUsers: 500,
        maxCourses: 50,
        features: ["Suporte prioritário", "Relatórios avançados", "API Access"],
        isActive: true,
        popular: true,
    },
    {
        _id: "enterprise" as unknown as Id<"subscriptionPlans">,
        name: "Enterprise",
        description: "Para grandes organizações",
        price: 99900,
        interval: "monthly" as const,
        maxUsers: 10000,
        maxCourses: 500,
        features: ["Suporte 24/7", "Customização", "SLA garantido", "White-label"],
        isActive: true,
    },
];

// Map plan name to literal type
function getPlanType(planName: string): "starter" | "professional" | "enterprise" {
    const normalized = planName.toLowerCase();
    if (normalized.includes("enterprise")) return "enterprise";
    if (normalized.includes("professional") || normalized.includes("pro")) return "professional";
    return "starter";
}

// Format price from cents to BRL
function formatPrice(priceInCents: number, interval: string): string {
    const value = priceInCents / 100;
    const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
    return `${formatted}/${interval === "monthly" ? "mês" : "ano"}`;
}

export default function NewOrganizationPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        logo: "",
        adminFirstName: "",
        adminLastName: "",
        adminEmail: "",
        adminPassword: "",
    });

    // Fetch plans from database
    const plansData = useQuery(api.plans.getAll);
    const createOrganization = useMutation(api.organizations.create);

    // Use real plans or fallback
    const plans = plansData && plansData.length > 0
        ? plansData.filter(p => p.isActive).sort((a, b) => a.price - b.price)
        : fallbackPlans;

    // Set default plan when plans load
    useEffect(() => {
        if (plans.length > 0 && !selectedPlanId) {
            setSelectedPlanId(String(plans[0]._id));
        }
    }, [plans, selectedPlanId]);

    // Get selected plan
    const selectedPlan = plans.find(p => String(p._id) === selectedPlanId);

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

        if (!selectedPlan) {
            toast.error("Selecione um plano");
            return;
        }

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
                plan: getPlanType(selectedPlan.name),
                maxUsers: selectedPlan.maxUsers,
                maxCourses: selectedPlan.maxCourses,
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

    // Determine if a plan should be marked as "popular"
    const isPopular = (plan: typeof plans[0], index: number) => {
        return "popular" in plan ? plan.popular : index === 1;
    };

    // Get color class based on plan index
    const getPlanColor = (index: number) => {
        const colors = [
            "bg-slate-100 dark:bg-slate-800",
            "bg-primary/10",
            "gradient-bg",
        ];
        return colors[index] || colors[0];
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
                            {plansData === undefined ? (
                                <div className="grid gap-4 md:grid-cols-3">
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} className="h-64 w-full" />
                                    ))}
                                </div>
                            ) : plans.length === 0 ? (
                                <div className="p-8 text-center">
                                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="font-semibold mb-2">Nenhum plano disponível</h3>
                                    <p className="text-muted-foreground text-sm mb-4">
                                        Crie planos de assinatura antes de cadastrar organizações.
                                    </p>
                                    <Link href="/superadmin/plans">
                                        <Button>Gerenciar Planos</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-3">
                                    {plans.map((plan, index) => (
                                        <div
                                            key={String(plan._id)}
                                            className={cn(
                                                "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
                                                selectedPlanId === String(plan._id)
                                                    ? "border-primary shadow-lg"
                                                    : "border-muted hover:border-muted-foreground/50"
                                            )}
                                            onClick={() => setSelectedPlanId(String(plan._id))}
                                        >
                                            {isPopular(plan, index) && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                    <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                        <Sparkles className="h-3 w-3" />
                                                        Popular
                                                    </span>
                                                </div>
                                            )}

                                            <div className={cn("h-2 w-full rounded-t-sm mb-3", getPlanColor(index))} />

                                            <h3 className="font-bold">{plan.name}</h3>
                                            <p className="text-2xl font-bold mt-1">
                                                {formatPrice(plan.price, plan.interval)}
                                            </p>

                                            <Separator className="my-3" />

                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    Até {plan.maxUsers.toLocaleString()} usuários
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                    Até {plan.maxCourses} cursos
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

                                            {selectedPlanId === String(plan._id) && (
                                                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                                    <div className="h-2 w-2 rounded-full bg-white" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
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
                            disabled={isLoading || !selectedPlan}
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
