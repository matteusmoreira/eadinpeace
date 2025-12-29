"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Building2,
    Users,
    BookOpen,
    Award,
    TrendingUp,
    BarChart3,
    Loader2,
    GraduationCap,
} from "lucide-react";
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

export default function SuperadminReportsPage() {
    const globalReport = useQuery(api.reports.getGlobalReport);

    const isLoading = globalReport === undefined;

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        Relatórios Globais
                    </h1>
                    <p className="text-muted-foreground">
                        Visão geral de toda a plataforma
                    </p>
                </div>
            </motion.div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-6"
                >
                    {/* Stats Cards */}
                    <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Organizações</p>
                                        <p className="text-3xl font-bold">{globalReport?.summary.totalOrganizations || 0}</p>
                                        <div className="flex items-center gap-1 text-sm text-emerald-500">
                                            <span>{globalReport?.summary.activeOrganizations || 0} ativas</span>
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                        <Building2 className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Usuários</p>
                                        <p className="text-3xl font-bold">{globalReport?.summary.totalUsers || 0}</p>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            <span>Em todas as orgs</span>
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-violet-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Cursos</p>
                                        <p className="text-3xl font-bold">{globalReport?.summary.totalCourses || 0}</p>
                                        <div className="flex items-center gap-1 text-sm text-emerald-500">
                                            <span>{globalReport?.summary.publishedCourses || 0} publicados</span>
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                        <BookOpen className="h-6 w-6 text-emerald-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Certificados</p>
                                        <p className="text-3xl font-bold">{globalReport?.summary.totalCertificates || 0}</p>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Award className="h-4 w-4" />
                                            <span>Emitidos</span>
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                        <Award className="h-6 w-6 text-amber-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Organizações por Plano */}
                        <motion.div variants={item}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Distribuição por Plano</CardTitle>
                                    <CardDescription>Organizações por tipo de assinatura</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                                    <span className="text-sm font-medium">Starter</span>
                                                </div>
                                                <span className="font-bold">{globalReport?.orgsByPlan.starter || 0}</span>
                                            </div>
                                            <Progress
                                                value={globalReport?.summary.totalOrganizations ?
                                                    ((globalReport.orgsByPlan.starter || 0) / globalReport.summary.totalOrganizations) * 100 : 0}
                                                className="h-2 [&>div]:bg-emerald-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-3 w-3 rounded-full bg-primary" />
                                                    <span className="text-sm font-medium">Professional</span>
                                                </div>
                                                <span className="font-bold">{globalReport?.orgsByPlan.professional || 0}</span>
                                            </div>
                                            <Progress
                                                value={globalReport?.summary.totalOrganizations ?
                                                    ((globalReport.orgsByPlan.professional || 0) / globalReport.summary.totalOrganizations) * 100 : 0}
                                                className="h-2"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-3 w-3 rounded-full bg-violet-500" />
                                                    <span className="text-sm font-medium">Enterprise</span>
                                                </div>
                                                <span className="font-bold">{globalReport?.orgsByPlan.enterprise || 0}</span>
                                            </div>
                                            <Progress
                                                value={globalReport?.summary.totalOrganizations ?
                                                    ((globalReport.orgsByPlan.enterprise || 0) / globalReport.summary.totalOrganizations) * 100 : 0}
                                                className="h-2 [&>div]:bg-violet-500"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Top Organizações */}
                        <motion.div variants={item}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top Organizações</CardTitle>
                                    <CardDescription>Por número de usuários</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {globalReport?.topOrgsByUsers && globalReport.topOrgsByUsers.length > 0 ? (
                                        <div className="space-y-4">
                                            {globalReport.topOrgsByUsers.map((org, index) => (
                                                <div key={index} className="flex items-center gap-4">
                                                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">{org.name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {org.users} usuários cadastrados
                                                        </p>
                                                    </div>
                                                    <Badge variant="secondary">
                                                        <Users className="h-3 w-3 mr-1" />
                                                        {org.users}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>Nenhuma organização com usuários</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* User Growth Chart */}
                    <motion.div variants={item}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Crescimento de Usuários</CardTitle>
                                <CardDescription>Novos usuários por mês (últimos 6 meses)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {globalReport?.userGrowth && globalReport.userGrowth.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="flex items-end gap-2 h-40">
                                            {globalReport.userGrowth.map((item) => {
                                                const maxCount = Math.max(...globalReport.userGrowth.map(i => i.count));
                                                const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                                                return (
                                                    <div
                                                        key={item.month}
                                                        className="flex-1 flex flex-col items-center gap-1"
                                                    >
                                                        <span className="text-xs font-medium">{item.count}</span>
                                                        <div
                                                            className="w-full bg-gradient-to-t from-primary to-violet-500 rounded-t-md transition-all duration-500"
                                                            style={{ height: `${Math.max(height, 5)}%` }}
                                                        />
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(item.month + "-01").toLocaleDateString("pt-BR", { month: "short" })}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>Dados de crescimento não disponíveis</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Enrollments Stats */}
                    <motion.div variants={item}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Resumo de Matrículas</CardTitle>
                                <CardDescription>Estatísticas gerais de matrículas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                                        <div className="flex items-center gap-3">
                                            <GraduationCap className="h-8 w-8 text-primary" />
                                            <div>
                                                <p className="text-2xl font-bold">{globalReport?.summary.totalEnrollments || 0}</p>
                                                <p className="text-sm text-muted-foreground">Total de Matrículas</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
                                        <div className="flex items-center gap-3">
                                            <Award className="h-8 w-8 text-emerald-500" />
                                            <div>
                                                <p className="text-2xl font-bold">{globalReport?.summary.totalCertificates || 0}</p>
                                                <p className="text-sm text-muted-foreground">Conclusões</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20">
                                        <div className="flex items-center gap-3">
                                            <TrendingUp className="h-8 w-8 text-violet-500" />
                                            <div>
                                                <p className="text-2xl font-bold">
                                                    {globalReport?.summary.totalEnrollments && globalReport.summary.totalCertificates
                                                        ? Math.round((globalReport.summary.totalCertificates / globalReport.summary.totalEnrollments) * 100)
                                                        : 0}%
                                                </p>
                                                <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
