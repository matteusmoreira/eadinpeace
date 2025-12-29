"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft,
    Save,
    Loader2,
    Building2,
    CreditCard,
    Users,
    BookOpen,
    AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

export default function EditOrganizationPage() {
    const params = useParams();
    const organizationId = params.organizationId as Id<"organizations">;
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Convex queries
    const organization = useQuery(api.organizations.getById, { organizationId });
    const updateOrganization = useMutation(api.organizations.update);

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        logo: "",
        primaryColor: "#6366F1",
        plan: "starter" as "starter" | "professional" | "enterprise",
        isActive: true,
    });

    useEffect(() => {
        if (organization) {
            setFormData({
                name: organization.name,
                slug: organization.slug,
                logo: organization.logo || "",
                primaryColor: organization.primaryColor || "#6366F1",
                plan: organization.plan as any,
                isActive: organization.isActive,
            });
        }
    }, [organization]);

    if (organization === undefined) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <Skeleton className="h-10 w-48" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (organization === null) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-2xl font-bold">Organização não encontrada</h2>
                <Link href="/superadmin/organizations" className="mt-4">
                    <Button variant="outline">Voltar para a lista</Button>
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await updateOrganization({
                organizationId,
                name: formData.name,
                slug: formData.slug,
                logo: formData.logo || undefined,
                primaryColor: formData.primaryColor,
                plan: formData.plan,
                isActive: formData.isActive,
            });

            toast.success("Organização atualizada com sucesso!");
            router.push("/superadmin/organizations");
        } catch (error: any) {
            toast.error(error.message || "Erro ao atualizar organização");
        } finally {
            setIsLoading(false);
        }
    };

    const planColors = {
        starter: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        professional: "bg-primary/10 text-primary",
        enterprise: "gradient-bg text-white border-0",
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
                    <h1 className="text-2xl font-bold">Editar Organização</h1>
                    <p className="text-muted-foreground">
                        Edite as configurações de {organization.name}
                    </p>
                </div>
            </motion.div>

            <form onSubmit={handleSubmit}>
                <motion.div variants={item} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Informações Gerais
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome da Organização</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">Slug (URL)</Label>
                                    <Input
                                        id="slug"
                                        value={formData.slug}
                                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="logo">URL do Logo</Label>
                                <Input
                                    id="logo"
                                    value={formData.logo}
                                    onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.value }))}
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="primaryColor">Cor Principal</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="primaryColor"
                                            type="color"
                                            value={formData.primaryColor}
                                            onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                                            className="w-12 h-10 p-1"
                                        />
                                        <Input
                                            value={formData.primaryColor}
                                            onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <div className="flex items-center gap-4 h-10">
                                        <Button
                                            type="button"
                                            variant={formData.isActive ? "default" : "outline"}
                                            onClick={() => setFormData(prev => ({ ...prev, isActive: true }))}
                                            className={formData.isActive ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                                        >
                                            Ativa
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={!formData.isActive ? "destructive" : "outline"}
                                            onClick={() => setFormData(prev => ({ ...prev, isActive: false }))}
                                        >
                                            Inativa
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Plano de Assinatura
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {["starter", "professional", "enterprise"].map((plan) => (
                                    <div
                                        key={plan}
                                        onClick={() => setFormData(prev => ({ ...prev, plan: plan as any }))}
                                        className={cn(
                                            "p-4 rounded-xl border-2 cursor-pointer transition-all",
                                            formData.plan === plan
                                                ? "border-primary bg-primary/5 shadow-md"
                                                : "border-muted hover:border-muted-foreground/50"
                                        )}
                                    >
                                        <Badge className={cn("mb-2 capitalize", planColors[plan as keyof typeof planColors])}>
                                            {plan}
                                        </Badge>
                                        <p className="text-xs text-muted-foreground">
                                            {plan === "starter" && "Até 50 usuários"}
                                            {plan === "professional" && "Até 500 usuários"}
                                            {plan === "enterprise" && "Até 10.000 usuários"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Link href="/superadmin/organizations">
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="gradient-bg border-0 gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Salvar Alterações
                        </Button>
                    </div>
                </motion.div>
            </form>
        </motion.div>
    );
}
