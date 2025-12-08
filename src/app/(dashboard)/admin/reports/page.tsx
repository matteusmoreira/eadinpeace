"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    BarChart3,
    Users,
    BookOpen,
    TrendingUp,
    Download,
    Calendar,
    Award,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    FileSpreadsheet,
    GraduationCap,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";

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

export default function ReportsPage() {
    const { user } = useUser();
    const [selectedCourse, setSelectedCourse] = useState<string>("");

    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    const organizationId = convexUser?.organizationId;

    // Buscar relatório da organização
    const orgReport = useQuery(
        api.reports.getOrganizationReport,
        organizationId ? { organizationId } : "skip"
    );

    // Buscar cursos da organização
    const courses = useQuery(
        api.courses.getByOrganization,
        organizationId ? { organizationId } : "skip"
    );

    // Buscar relatório do curso selecionado
    const courseReport = useQuery(
        api.reports.getCourseProgressReport,
        selectedCourse ? { courseId: selectedCourse as any } : "skip"
    );

    const isLoading = orgReport === undefined || courses === undefined;

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const exportToCSV = () => {
        if (!courseReport?.enrollments) return;

        const headers = ["Nome", "Email", "Progresso", "Aulas Concluídas", "Iniciado em", "Concluído em"];
        const rows = courseReport.enrollments.map(e => [
            e.studentName,
            e.studentEmail,
            `${e.progress}%`,
            `${e.completedLessons}/${e.totalLessons}`,
            formatDate(e.startedAt),
            e.completedAt ? formatDate(e.completedAt) : "Em andamento"
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_${courseReport.course.title.replace(/\s+/g, "_")}.csv`;
        link.click();
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
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        Relatórios
                    </h1>
                    <p className="text-muted-foreground">
                        Análise detalhada do desempenho da sua organização
                    </p>
                </div>
            </motion.div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                        <TabsTrigger value="courses">Por Curso</TabsTrigger>
                        <TabsTrigger value="users">Por Usuário</TabsTrigger>
                    </TabsList>

                    {/* Visão Geral */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* Stats Cards */}
                        <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground">Total de Usuários</p>
                                            <p className="text-3xl font-bold">{orgReport?.summary.totalUsers || 0}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                            <Users className="h-6 w-6 text-primary" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground">Total de Cursos</p>
                                            <p className="text-3xl font-bold">{orgReport?.summary.totalCourses || 0}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                            <BookOpen className="h-6 w-6 text-emerald-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground">Matrículas</p>
                                            <p className="text-3xl font-bold">{orgReport?.summary.totalEnrollments || 0}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                                            <GraduationCap className="h-6 w-6 text-violet-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
                                            <p className="text-3xl font-bold">{orgReport?.summary.completionRate || 0}%</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                            <Award className="h-6 w-6 text-amber-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Charts Row */}
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Usuários por Função */}
                            <motion.div variants={item}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Distribuição de Usuários</CardTitle>
                                        <CardDescription>Por função na plataforma</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-3 w-3 rounded-full bg-primary" />
                                                    <span className="text-sm">Administradores</span>
                                                </div>
                                                <span className="font-medium">{orgReport?.usersByRole.admin || 0}</span>
                                            </div>
                                            <Progress
                                                value={orgReport?.summary.totalUsers ?
                                                    ((orgReport.usersByRole.admin || 0) / orgReport.summary.totalUsers) * 100 : 0}
                                                className="h-2"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                                                    <span className="text-sm">Professores</span>
                                                </div>
                                                <span className="font-medium">{orgReport?.usersByRole.professor || 0}</span>
                                            </div>
                                            <Progress
                                                value={orgReport?.summary.totalUsers ?
                                                    ((orgReport.usersByRole.professor || 0) / orgReport.summary.totalUsers) * 100 : 0}
                                                className="h-2 [&>div]:bg-amber-500"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                                    <span className="text-sm">Alunos</span>
                                                </div>
                                                <span className="font-medium">{orgReport?.usersByRole.student || 0}</span>
                                            </div>
                                            <Progress
                                                value={orgReport?.summary.totalUsers ?
                                                    ((orgReport.usersByRole.student || 0) / orgReport.summary.totalUsers) * 100 : 0}
                                                className="h-2 [&>div]:bg-emerald-500"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Cursos mais populares */}
                            <motion.div variants={item}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Cursos Mais Populares</CardTitle>
                                        <CardDescription>Por número de matrículas</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {orgReport?.topCourses && orgReport.topCourses.length > 0 ? (
                                            <div className="space-y-4">
                                                {orgReport.topCourses.map((course, index) => (
                                                    <div key={course.courseId} className="flex items-center gap-4">
                                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium truncate">{course.title}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {course.enrollments} alunos matriculados
                                                            </p>
                                                        </div>
                                                        <Badge variant="secondary">{course.enrollments}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p>Nenhum curso com matrículas ainda</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Tendência de Matrículas */}
                        <motion.div variants={item}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tendência de Matrículas</CardTitle>
                                    <CardDescription>Últimos 6 meses</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {orgReport?.enrollmentTrend && orgReport.enrollmentTrend.length > 0 ? (
                                        <div className="space-y-4">
                                            <div className="flex items-end gap-2 h-40">
                                                {orgReport.enrollmentTrend.map((item, index) => {
                                                    const maxCount = Math.max(...orgReport.enrollmentTrend.map(i => Number(i.count)));
                                                    const height = maxCount > 0 ? (Number(item.count) / maxCount) * 100 : 0;
                                                    return (
                                                        <div
                                                            key={item.month}
                                                            className="flex-1 flex flex-col items-center gap-1"
                                                        >
                                                            <span className="text-xs font-medium">{Number(item.count)}</span>
                                                            <div
                                                                className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-md transition-all duration-500"
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
                                            <p>Dados de tendência não disponíveis</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    {/* Por Curso */}
                    <TabsContent value="courses" className="space-y-6">
                        <motion.div variants={item}>
                            <Card>
                                <CardHeader>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <CardTitle>Relatório por Curso</CardTitle>
                                            <CardDescription>Selecione um curso para ver os detalhes</CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                                                <SelectTrigger className="w-[280px]">
                                                    <SelectValue placeholder="Selecione um curso" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {courses?.map(course => (
                                                        <SelectItem key={course._id} value={course._id}>
                                                            {course.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {courseReport && (
                                                <Button variant="outline" onClick={exportToCSV}>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Exportar CSV
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {!selectedCourse ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p className="text-lg font-medium">Selecione um curso</p>
                                            <p className="text-sm">Escolha um curso acima para visualizar o relatório detalhado</p>
                                        </div>
                                    ) : courseReport === undefined ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : courseReport === null ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <p>Dados não disponíveis para este curso.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Course Summary */}
                                            <div className="grid gap-4 md:grid-cols-4">
                                                <div className="p-4 rounded-lg bg-muted/50">
                                                    <p className="text-sm text-muted-foreground">Matrículas</p>
                                                    <p className="text-2xl font-bold">{courseReport.summary.totalEnrollments}</p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-muted/50">
                                                    <p className="text-sm text-muted-foreground">Progresso Médio</p>
                                                    <p className="text-2xl font-bold">{courseReport.summary.avgProgress}%</p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-muted/50">
                                                    <p className="text-sm text-muted-foreground">Concluídos</p>
                                                    <p className="text-2xl font-bold text-emerald-500">{courseReport.summary.completedCount}</p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-muted/50">
                                                    <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
                                                    <p className="text-2xl font-bold">{courseReport.summary.completionRate}%</p>
                                                </div>
                                            </div>

                                            {/* Students Table */}
                                            <div className="rounded-lg border overflow-hidden">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="bg-muted/50">
                                                                <th className="text-left p-4 font-medium">Aluno</th>
                                                                <th className="text-left p-4 font-medium">Progresso</th>
                                                                <th className="text-left p-4 font-medium">Aulas</th>
                                                                <th className="text-left p-4 font-medium">Último Acesso</th>
                                                                <th className="text-left p-4 font-medium">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y">
                                                            {courseReport.enrollments.map(enrollment => (
                                                                <tr key={enrollment.id} className="hover:bg-muted/30">
                                                                    <td className="p-4">
                                                                        <div>
                                                                            <p className="font-medium">{enrollment.studentName}</p>
                                                                            <p className="text-sm text-muted-foreground">{enrollment.studentEmail}</p>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <Progress value={enrollment.progress} className="w-20 h-2" />
                                                                            <span className="text-sm font-medium">{enrollment.progress}%</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <span className="text-sm">
                                                                            {enrollment.completedLessons}/{enrollment.totalLessons}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <span className="text-sm text-muted-foreground">
                                                                            {formatDate(enrollment.lastAccessedAt)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-4">
                                                                        {enrollment.completedAt ? (
                                                                            <Badge className="bg-emerald-500">Concluído</Badge>
                                                                        ) : enrollment.progress > 0 ? (
                                                                            <Badge variant="secondary">Em Progresso</Badge>
                                                                        ) : (
                                                                            <Badge variant="outline">Não Iniciado</Badge>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    {/* Por Usuário */}
                    <TabsContent value="users" className="space-y-6">
                        <motion.div variants={item}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Relatório por Usuário</CardTitle>
                                    <CardDescription>Análise individual de desempenho (em breve)</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium">Em Desenvolvimento</p>
                                        <p className="text-sm">Esta funcionalidade estará disponível em breve</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>
                </Tabs>
            )}
        </motion.div>
    );
}
