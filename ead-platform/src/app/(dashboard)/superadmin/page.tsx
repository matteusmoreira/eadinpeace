"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Building2,
    Users,
    BookOpen,
    DollarSign,
    Plus,
    ArrowUpRight,
    Activity,
    TrendingUp,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

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

const planColors = {
    starter: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    professional: "bg-primary/10 text-primary",
    enterprise: "gradient-bg text-white border-0",
};

export default function SuperadminDashboardPage() {
    // Convex queries
    const orgStats = useQuery(api.organizations.getGlobalStats);
    const userStats = useQuery(api.users.getGlobalStats);
    const organizations = useQuery(api.organizations.getAll);

    const isLoading = orgStats === undefined || userStats === undefined;

    // Recent organizations (last 5)
    const recentOrganizations = (organizations || [])
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("pt-BR");
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Visão geral da plataforma
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/superadmin/organizations/new">
                        <Button variant="outline" className="gap-2">
                            <Building2 className="h-4 w-4" />
                            Nova Organização
                        </Button>
                    </Link>
                    <Link href="/superadmin/users/new">
                        <Button className="gap-2 gradient-bg border-0">
                            <Users className="h-4 w-4" />
                            Novo Usuário
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* Stats */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="hover:shadow-lg transition-all duration-300">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Organizações</p>
                                        <p className="text-3xl font-bold">{orgStats?.totalOrganizations || 0}</p>
                                        <div className="flex items-center gap-1 text-sm text-emerald-500">
                                            <ArrowUpRight className="h-4 w-4" />
                                            <span>{orgStats?.activeOrganizations || 0} ativas</span>
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Building2 className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all duration-300">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Usuários</p>
                                        <p className="text-3xl font-bold">{userStats?.total || 0}</p>
                                        <div className="flex items-center gap-1 text-sm text-emerald-500">
                                            <ArrowUpRight className="h-4 w-4" />
                                            <span>{userStats?.active || 0} ativos</span>
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-emerald-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all duration-300">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Cursos</p>
                                        <p className="text-3xl font-bold">{orgStats?.totalCourses || 0}</p>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <TrendingUp className="h-4 w-4" />
                                            <span>Em toda plataforma</span>
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                        <BookOpen className="h-6 w-6 text-amber-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all duration-300">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Receita Mensal</p>
                                        <p className="text-3xl font-bold">
                                            R$ {(
                                                (orgStats?.byPlan?.starter || 0) * 99 +
                                                (orgStats?.byPlan?.professional || 0) * 299 +
                                                (orgStats?.byPlan?.enterprise || 0) * 999
                                            ).toLocaleString("pt-BR")}
                                        </p>
                                        <div className="flex items-center gap-1 text-sm text-emerald-500">
                                            <ArrowUpRight className="h-4 w-4" />
                                            <span>Estimativa</span>
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                        <DollarSign className="h-6 w-6 text-violet-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Recent Organizations */}
                        <motion.div variants={item}>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Organizações Recentes</CardTitle>
                                        <CardDescription>Últimas organizações cadastradas</CardDescription>
                                    </div>
                                    <Link href="/superadmin/organizations">
                                        <Button variant="ghost" size="sm">Ver todas</Button>
                                    </Link>
                                </CardHeader>
                                <CardContent>
                                    {recentOrganizations.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Building2 className="h-8 w-8 mx-auto mb-2" />
                                            <p>Nenhuma organização ainda</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {recentOrganizations.map((org) => (
                                                <div
                                                    key={org._id}
                                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                                            {org.logo ? (
                                                                <img src={org.logo} alt={org.name} className="h-8 w-8 rounded" />
                                                            ) : (
                                                                <Building2 className="h-5 w-5 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{org.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {org.userCount || 0} usuários • {formatDate(org.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge className={planColors[org.plan]}>
                                                        {org.plan}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* User Stats by Role */}
                        <motion.div variants={item}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Usuários por Função</CardTitle>
                                    <CardDescription>Distribuição de roles na plataforma</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {[
                                            { role: "superadmin", label: "Super Admins", count: userStats?.byRole?.superadmin || 0, color: "bg-gradient-to-r from-violet-500 to-purple-500" },
                                            { role: "admin", label: "Admins", count: userStats?.byRole?.admin || 0, color: "bg-primary" },
                                            { role: "professor", label: "Professores", count: userStats?.byRole?.professor || 0, color: "bg-amber-500" },
                                            { role: "student", label: "Alunos", count: userStats?.byRole?.student || 0, color: "bg-emerald-500" },
                                        ].map((stat) => {
                                            const total = userStats?.total || 1;
                                            const percentage = Math.round((stat.count / total) * 100);
                                            return (
                                                <div key={stat.role} className="space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span>{stat.label}</span>
                                                        <span className="font-medium">{stat.count}</span>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${stat.color} transition-all duration-500`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Plans Distribution */}
                        <motion.div variants={item}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Distribuição de Planos</CardTitle>
                                    <CardDescription>Organizações por tipo de plano</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { plan: "starter", label: "Starter", count: orgStats?.byPlan?.starter || 0, price: "R$ 99" },
                                            { plan: "professional", label: "Professional", count: orgStats?.byPlan?.professional || 0, price: "R$ 299" },
                                            { plan: "enterprise", label: "Enterprise", count: orgStats?.byPlan?.enterprise || 0, price: "R$ 999" },
                                        ].map((stat) => (
                                            <div
                                                key={stat.plan}
                                                className="text-center p-4 rounded-lg bg-muted/50"
                                            >
                                                <p className="text-3xl font-bold">{stat.count}</p>
                                                <p className="text-sm font-medium">{stat.label}</p>
                                                <p className="text-xs text-muted-foreground">{stat.price}/mês</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div variants={item}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Ações Rápidas</CardTitle>
                                    <CardDescription>Atalhos para tarefas comuns</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-3">
                                    <Link href="/superadmin/organizations/new">
                                        <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                                            <Building2 className="h-5 w-5" />
                                            <span>Nova Organização</span>
                                        </Button>
                                    </Link>
                                    <Link href="/superadmin/users/new">
                                        <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                                            <Users className="h-5 w-5" />
                                            <span>Novo Usuário</span>
                                        </Button>
                                    </Link>
                                    <Link href="/superadmin/organizations">
                                        <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                                            <Activity className="h-5 w-5" />
                                            <span>Ver Organizações</span>
                                        </Button>
                                    </Link>
                                    <Link href="/superadmin/users">
                                        <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                                            <TrendingUp className="h-5 w-5" />
                                            <span>Ver Usuários</span>
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </>
            )}
        </motion.div>
    );
}
