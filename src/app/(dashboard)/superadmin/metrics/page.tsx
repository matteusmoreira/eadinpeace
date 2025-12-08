"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    BookOpen,
    Building2,
    Trophy,
    Clock,
    Loader2,
    GraduationCap,
    Award,
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

export default function SuperadminMetricsPage() {
    const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");

    // Queries
    const users = useQuery(api.users.getAll);
    const organizations = useQuery(api.organizations.getAll);
    const userStats = useQuery(api.users.getGlobalStats, { period });

    const isLoading = users === undefined || organizations === undefined || userStats === undefined;

    // Calculate metrics
    const totalUsers = users?.length || 0;
    const totalOrganizations = organizations?.length || 0;
    const activeUsers = userStats?.active || 0;
    const pendingUsers = userStats?.pending || 0;

    // Use real growth data from backend
    const userGrowth = userStats?.growth?.users || 0;
    const orgGrowth = userStats?.growth?.organizations || 0;
    const activeGrowth = userStats?.growth?.activeUsers || 0;

    // User distribution by role
    const usersByRole = userStats?.byRole || {
        superadmin: 0,
        admin: 0,
        professor: 0,
        student: 0,
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Métricas</h1>
                    <p className="text-muted-foreground">Visão geral do desempenho da plataforma</p>
                </div>
                <Select value={period} onValueChange={(value) => setPeriod(value as "7d" | "30d" | "90d" | "1y")}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7d">Últimos 7 dias</SelectItem>
                        <SelectItem value="30d">Últimos 30 dias</SelectItem>
                        <SelectItem value="90d">Últimos 90 dias</SelectItem>
                        <SelectItem value="1y">Último ano</SelectItem>
                    </SelectContent>
                </Select>
            </motion.div>

            {/* Main Stats */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total de Usuários</p>
                                <p className="text-3xl font-bold">{totalUsers}</p>
                                <div className="flex items-center gap-1 text-emerald-500 text-sm mt-1">
                                    <TrendingUp className="h-4 w-4" />
                                    +{userGrowth}%
                                </div>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Organizações</p>
                                <p className="text-3xl font-bold">{totalOrganizations}</p>
                                <div className="flex items-center gap-1 text-emerald-500 text-sm mt-1">
                                    <TrendingUp className="h-4 w-4" />
                                    +{orgGrowth}%
                                </div>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                                <p className="text-3xl font-bold">{activeUsers}</p>
                                <div className="flex items-center gap-1 text-emerald-500 text-sm mt-1">
                                    <TrendingUp className="h-4 w-4" />
                                    +{activeGrowth}%
                                </div>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Trophy className="h-6 w-6 text-emerald-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pendentes</p>
                                <p className="text-3xl font-bold">{pendingUsers}</p>
                                <div className="flex items-center gap-1 text-amber-500 text-sm mt-1">
                                    <Clock className="h-4 w-4" />
                                    Aguardando
                                </div>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-amber-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* User Distribution */}
            <motion.div variants={item} className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Distribuição por Função</CardTitle>
                        <CardDescription>Usuários agrupados por tipo de acesso</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Object.entries(usersByRole).map(([role, count]) => {
                            const percentage = totalUsers > 0 ? ((count as number) / totalUsers) * 100 : 0;
                            const config = {
                                superadmin: { label: "Super Admin", color: "bg-gradient-to-r from-violet-500 to-purple-500", icon: "👑" },
                                admin: { label: "Administradores", color: "bg-primary", icon: "⚙️" },
                                professor: { label: "Professores", color: "bg-amber-500", icon: "📚" },
                                student: { label: "Alunos", color: "bg-emerald-500", icon: "🎓" },
                            }[role] || { label: role, color: "bg-gray-500", icon: "👤" };

                            return (
                                <div key={role} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span>{config.icon}</span>
                                            <span className="font-medium">{config.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">{count as number}</Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className={`h-full ${config.color} rounded-full transition-all`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Organizações por Plano</CardTitle>
                        <CardDescription>Distribuição de planos contratados</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {["starter", "professional", "enterprise"].map((plan) => {
                            const count = organizations?.filter(o => o.plan === plan).length || 0;
                            const percentage = totalOrganizations > 0 ? (count / totalOrganizations) * 100 : 0;
                            const config = {
                                starter: { label: "Starter", color: "bg-blue-500", icon: "⚡" },
                                professional: { label: "Professional", color: "bg-violet-500", icon: "✨" },
                                enterprise: { label: "Enterprise", color: "bg-amber-500", icon: "👑" },
                            }[plan] || { label: plan, color: "bg-gray-500", icon: "📦" };

                            return (
                                <div key={plan} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span>{config.icon}</span>
                                            <span className="font-medium">{config.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">{count}</Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className={`h-full ${config.color} rounded-full transition-all`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Additional Metrics */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                <BookOpen className="h-7 w-7 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Cursos Ativos</p>
                                <p className="text-2xl font-bold">{userStats?.courses?.published || 0}</p>
                                <p className="text-xs text-muted-foreground">
                                    {userStats?.courses?.total || 0} total em todas organizações
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-xl bg-pink-500/10 flex items-center justify-center">
                                <GraduationCap className="h-7 w-7 text-pink-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Matrículas</p>
                                <p className="text-2xl font-bold">{userStats?.enrollments?.total || 0}</p>
                                <p className="text-xs text-muted-foreground">
                                    {userStats?.enrollments?.completed || 0} concluídas
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                                <Award className="h-7 w-7 text-cyan-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Certificados</p>
                                <p className="text-2xl font-bold">{userStats?.certificates?.total || 0}</p>
                                <p className="text-xs text-muted-foreground">Emitidos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
