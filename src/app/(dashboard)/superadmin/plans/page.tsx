"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    CreditCard,
    Check,
    Users,
    BookOpen,
    Building2,
    Sparkles,
    Crown,
    Zap,
    Edit,
    Plus,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

// Planos definidos estaticamente (podem ser movidos para o banco depois)
const plans = [
    {
        id: "starter",
        name: "Starter",
        description: "Ideal para pequenas igrejas e ministérios",
        icon: Zap,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        price: 97,
        features: [
            { name: "Até 50 usuários", included: true },
            { name: "Até 10 cursos", included: true },
            { name: "Armazenamento 5GB", included: true },
            { name: "Suporte por email", included: true },
            { name: "Certificados personalizados", included: false },
            { name: "Relatórios avançados", included: false },
            { name: "API de integração", included: false },
        ],
        limits: {
            maxUsers: 50,
            maxCourses: 10,
            storage: "5GB",
        },
    },
    {
        id: "professional",
        name: "Professional",
        description: "Para igrejas em crescimento",
        icon: Sparkles,
        color: "text-violet-500",
        bgColor: "bg-violet-500/10",
        price: 197,
        popular: true,
        features: [
            { name: "Até 200 usuários", included: true },
            { name: "Até 50 cursos", included: true },
            { name: "Armazenamento 20GB", included: true },
            { name: "Suporte prioritário", included: true },
            { name: "Certificados personalizados", included: true },
            { name: "Relatórios avançados", included: true },
            { name: "API de integração", included: false },
        ],
        limits: {
            maxUsers: 200,
            maxCourses: 50,
            storage: "20GB",
        },
    },
    {
        id: "enterprise",
        name: "Enterprise",
        description: "Para grandes organizações",
        icon: Crown,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        price: 497,
        features: [
            { name: "Usuários ilimitados", included: true },
            { name: "Cursos ilimitados", included: true },
            { name: "Armazenamento 100GB", included: true },
            { name: "Suporte 24/7", included: true },
            { name: "Certificados personalizados", included: true },
            { name: "Relatórios avançados", included: true },
            { name: "API de integração", included: true },
        ],
        limits: {
            maxUsers: 9999,
            maxCourses: 9999,
            storage: "100GB",
        },
    },
];

export default function SuperadminPlansPage() {
    const [editingPlan, setEditingPlan] = useState<string | null>(null);

    // Get organizations to show plan distribution
    const organizations = useQuery(api.organizations.getAll);

    // Count organizations by plan
    const planDistribution = {
        starter: organizations?.filter(o => o.plan === "starter").length || 0,
        professional: organizations?.filter(o => o.plan === "professional").length || 0,
        enterprise: organizations?.filter(o => o.plan === "enterprise").length || 0,
    };

    const totalRevenue =
        (planDistribution.starter * 97) +
        (planDistribution.professional * 197) +
        (planDistribution.enterprise * 497);

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Planos</h1>
                    <p className="text-muted-foreground">Gerencie os planos disponíveis para organizações</p>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <CreditCard className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{organizations?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Total Assinantes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Zap className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{planDistribution.starter}</p>
                                <p className="text-sm text-muted-foreground">Starter</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                <Sparkles className="h-6 w-6 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{planDistribution.professional}</p>
                                <p className="text-sm text-muted-foreground">Professional</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <CreditCard className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">R$ {totalRevenue.toLocaleString("pt-BR")}</p>
                                <p className="text-sm text-muted-foreground">Receita Mensal</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Plans Grid */}
            <motion.div variants={item} className="grid gap-6 md:grid-cols-3">
                {plans.map((plan) => (
                    <Card
                        key={plan.id}
                        className={`relative overflow-hidden hover:shadow-lg transition-all ${plan.popular ? "border-primary shadow-lg" : ""
                            }`}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 right-0">
                                <Badge className="rounded-none rounded-bl-lg gradient-bg">
                                    Mais Popular
                                </Badge>
                            </div>
                        )}

                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className={`h-12 w-12 rounded-xl ${plan.bgColor} flex items-center justify-center`}>
                                    <plan.icon className={`h-6 w-6 ${plan.color}`} />
                                </div>
                                <div>
                                    <CardTitle>{plan.name}</CardTitle>
                                    <CardDescription>{plan.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold">R$ {plan.price}</span>
                                <span className="text-muted-foreground">/mês</span>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                {plan.features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className={`h-5 w-5 rounded-full flex items-center justify-center ${feature.included ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"
                                            }`}>
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <span className={feature.included ? "" : "text-muted-foreground line-through"}>
                                            {feature.name}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Organizações ativas</span>
                                    <Badge variant="secondary">
                                        {planDistribution[plan.id as keyof typeof planDistribution]}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Limite de usuários</span>
                                    <span>{plan.limits.maxUsers === 9999 ? "Ilimitado" : plan.limits.maxUsers}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Limite de cursos</span>
                                    <span>{plan.limits.maxCourses === 9999 ? "Ilimitado" : plan.limits.maxCourses}</span>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full gap-2">
                                <Edit className="h-4 w-4" />
                                Editar Plano
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </motion.div>

            {/* Organizations by Plan */}
            <motion.div variants={item}>
                <Card>
                    <CardHeader>
                        <CardTitle>Organizações por Plano</CardTitle>
                        <CardDescription>Lista de organizações agrupadas por plano</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {plans.map((plan) => {
                                const orgsInPlan = organizations?.filter(o => o.plan === plan.id) || [];

                                return (
                                    <div key={plan.id}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <plan.icon className={`h-5 w-5 ${plan.color}`} />
                                            <h3 className="font-medium">{plan.name}</h3>
                                            <Badge variant="secondary">{orgsInPlan.length}</Badge>
                                        </div>

                                        {orgsInPlan.length === 0 ? (
                                            <p className="text-sm text-muted-foreground pl-7">
                                                Nenhuma organização neste plano
                                            </p>
                                        ) : (
                                            <div className="grid gap-2 pl-7">
                                                {orgsInPlan.slice(0, 5).map((org) => (
                                                    <div
                                                        key={org._id}
                                                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm">{org.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Users className="h-3 w-3" />
                                                                {org.maxUsers}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <BookOpen className="h-3 w-3" />
                                                                {org.maxCourses}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {orgsInPlan.length > 5 && (
                                                    <p className="text-sm text-muted-foreground">
                                                        +{orgsInPlan.length - 5} outras organizações
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {plan.id !== "enterprise" && <Separator className="mt-4" />}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
