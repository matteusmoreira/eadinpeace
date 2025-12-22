"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    FileText,
    Download,
    AlertTriangle,
    CheckCircle2,
    Clock,
    BookOpen,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    GraduationCap,
    Target,
    Award,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Id } from "@convex/_generated/dataModel";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    Cell,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

const COLORS = {
    excellent: "#22c55e",
    good: "#3b82f6",
    average: "#f59e0b",
    below: "#ef4444",
};

export default function ProfessorResultsPage() {
    const { user } = useUser();
    const [selectedCourseId, setSelectedCourseId] = useState<Id<"courses"> | "all">("all");
    const [selectedClassId, setSelectedClassId] = useState<Id<"classes"> | "all">("all");
    const [activeTab, setActiveTab] = useState("overview");

    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get summary stats
    const summary = useQuery(
        api.results.getSummary,
        convexUser ? {
            courseId: selectedCourseId !== "all" ? selectedCourseId : undefined,
            classId: selectedClassId !== "all" ? selectedClassId : undefined,
        } : "skip"
    );

    // Get results by course
    const courseResults = useQuery(
        api.results.getByCourse,
        convexUser?._id ? { instructorId: convexUser._id } : "skip"
    );

    // Get quiz results
    const quizResults = useQuery(
        api.results.getQuizResults,
        convexUser ? {
            courseId: selectedCourseId !== "all" ? selectedCourseId : undefined,
            classId: selectedClassId !== "all" ? selectedClassId : undefined,
        } : "skip"
    );

    // Get score distribution
    const distribution = useQuery(
        api.results.getScoreDistribution,
        convexUser ? {
            courseId: selectedCourseId !== "all" ? selectedCourseId : undefined,
            classId: selectedClassId !== "all" ? selectedClassId : undefined,
        } : "skip"
    );

    // Get low performers
    const lowPerformers = useQuery(
        api.results.getLowPerformers,
        convexUser ? {
            courseId: selectedCourseId !== "all" ? selectedCourseId : undefined,
            threshold: 60,
        } : "skip"
    );

    // Get historical comparison
    const historical = useQuery(
        api.results.getHistoricalComparison,
        convexUser ? {
            courseId: selectedCourseId !== "all" ? selectedCourseId : undefined,
            classId: selectedClassId !== "all" ? selectedClassId : undefined,
        } : "skip"
    );

    // Get classes for filter
    const classes = useQuery(
        api.classes.getByInstructor,
        convexUser?._id ? { userId: convexUser._id } : "skip"
    );

    const isLoading = !summary || !courseResults;

    // Export to Excel
    const exportToExcel = () => {
        if (!courseResults || !quizResults) return;

        const wb = XLSX.utils.book_new();

        // Summary sheet
        const summaryData = [
            ["Resumo de Resultados Acadêmicos"],
            [""],
            ["Métrica", "Valor"],
            ["Total de Avaliações", summary?.totalAttempts || 0],
            ["Média Geral", `${summary?.averageScore || 0}%`],
            ["Taxa de Aprovação", `${summary?.approvalRate || 0}%`],
            ["Pendentes de Correção", summary?.pendingGrading || 0],
            ["Total de Alunos", summary?.totalStudents || 0],
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");

        // Courses sheet
        const coursesData = [
            ["Curso", "Alunos", "Quizzes", "Média", "Taxa de Conclusão", "Pendentes"],
            ...courseResults.map(c => [
                c.title,
                c.totalStudents,
                c.totalQuizzes,
                `${c.averageScore}%`,
                `${c.completionRate}%`,
                c.pendingGrading,
            ]),
        ];
        const wsCourses = XLSX.utils.aoa_to_sheet(coursesData);
        XLSX.utils.book_append_sheet(wb, wsCourses, "Por Curso");

        // Quizzes sheet
        const quizzesData = [
            ["Quiz", "Curso", "Tentativas", "Corrigidos", "Média", "Pendentes"],
            ...quizResults.map(q => [
                q.title,
                q.courseName,
                q.totalAttempts,
                q.gradedAttempts,
                `${q.averageScore}%`,
                q.pendingGrading,
            ]),
        ];
        const wsQuizzes = XLSX.utils.aoa_to_sheet(quizzesData);
        XLSX.utils.book_append_sheet(wb, wsQuizzes, "Por Quiz");

        // Low performers sheet
        if (lowPerformers && lowPerformers.length > 0) {
            const lowData = [
                ["Nome", "Email", "Média", "Quizzes", "Status"],
                ...lowPerformers.map(s => [
                    s.name,
                    s.email,
                    `${s.averageScore}%`,
                    s.quizzesTaken,
                    s.status === "critical" ? "Crítico" : "Atenção",
                ]),
            ];
            const wsLow = XLSX.utils.aoa_to_sheet(lowData);
            XLSX.utils.book_append_sheet(wb, wsLow, "Baixo Desempenho");
        }

        XLSX.writeFile(wb, `Resultados_Academicos_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Export to PDF
    const exportToPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Title
        doc.setFontSize(20);
        doc.text("Resultados Acadêmicos", pageWidth / 2, 20, { align: "center" });

        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 28, { align: "center" });

        // Summary
        doc.setFontSize(14);
        doc.text("Resumo Geral", 14, 45);

        doc.setFontSize(10);
        let y = 55;
        doc.text(`Total de Avaliações: ${summary?.totalAttempts || 0}`, 14, y);
        doc.text(`Média Geral: ${summary?.averageScore || 0}%`, 14, y + 7);
        doc.text(`Taxa de Aprovação: ${summary?.approvalRate || 0}%`, 14, y + 14);
        doc.text(`Pendentes de Correção: ${summary?.pendingGrading || 0}`, 14, y + 21);
        doc.text(`Total de Alunos: ${summary?.totalStudents || 0}`, 14, y + 28);

        // Historical comparison
        if (historical) {
            y += 45;
            doc.setFontSize(14);
            doc.text("Comparativo com Período Anterior", 14, y);
            doc.setFontSize(10);
            doc.text(`Período Atual (30 dias): ${historical.currentPeriod.average}% (${historical.currentPeriod.total} avaliações)`, 14, y + 10);
            doc.text(`Período Anterior (30-60 dias): ${historical.previousPeriod.average}% (${historical.previousPeriod.total} avaliações)`, 14, y + 17);
            doc.text(`Variação: ${historical.change > 0 ? '+' : ''}${historical.change}%`, 14, y + 24);
        }

        // Courses
        if (courseResults && courseResults.length > 0) {
            y += 45;
            doc.setFontSize(14);
            doc.text("Resultados por Curso", 14, y);
            doc.setFontSize(10);
            y += 10;

            courseResults.forEach((course, index) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(`${index + 1}. ${course.title}`, 14, y);
                doc.text(`   Alunos: ${course.totalStudents} | Média: ${course.averageScore}% | Conclusão: ${course.completionRate}%`, 14, y + 6);
                y += 15;
            });
        }

        // Low performers
        if (lowPerformers && lowPerformers.length > 0) {
            if (y > 230) {
                doc.addPage();
                y = 20;
            } else {
                y += 10;
            }

            doc.setFontSize(14);
            doc.text("Alunos com Baixo Desempenho", 14, y);
            doc.setFontSize(10);
            y += 10;

            lowPerformers.slice(0, 10).forEach((student, index) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                const status = student.status === "critical" ? "[CRÍTICO]" : "[ATENÇÃO]";
                doc.text(`${index + 1}. ${student.name} - ${student.averageScore}% ${status}`, 14, y);
                y += 7;
            });
        }

        doc.save(`Resultados_Academicos_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Header */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Resultados Acadêmicos</h1>
                    <p className="text-muted-foreground">
                        Acompanhe o desempenho dos alunos em seus cursos
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={exportToExcel}>
                        <Download className="h-4 w-4" />
                        Excel
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={exportToPDF}>
                        <FileText className="h-4 w-4" />
                        PDF
                    </Button>
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div variants={item} className="flex flex-wrap gap-4">
                <Select
                    value={selectedCourseId}
                    onValueChange={(value) => setSelectedCourseId(value as Id<"courses"> | "all")}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filtrar por curso" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os cursos</SelectItem>
                        {courseResults?.map((course) => (
                            <SelectItem key={course._id} value={course._id}>
                                {course.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={selectedClassId}
                    onValueChange={(value) => setSelectedClassId(value as Id<"classes"> | "all")}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filtrar por turma" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as turmas</SelectItem>
                        {classes?.filter(cls => cls !== null).map((cls) => (
                            <SelectItem key={cls._id} value={cls._id}>
                                {cls.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </motion.div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="hover:shadow-lg transition-all">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Avaliações</p>
                                        <p className="text-3xl font-bold">{summary?.totalAttempts || 0}</p>
                                        <p className="text-xs text-muted-foreground">realizadas</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <FileText className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Média Geral</p>
                                        <p className="text-3xl font-bold">{summary?.averageScore || 0}%</p>
                                        {historical && (
                                            <p className={`text-xs flex items-center gap-1 ${historical.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {historical.change >= 0 ? (
                                                    <ArrowUpRight className="h-3 w-3" />
                                                ) : (
                                                    <ArrowDownRight className="h-3 w-3" />
                                                )}
                                                {Math.abs(historical.change)}% vs. anterior
                                            </p>
                                        )}
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <BarChart3 className="h-6 w-6 text-blue-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Taxa de Aprovação</p>
                                        <p className="text-3xl font-bold">{summary?.approvalRate || 0}%</p>
                                        <p className="text-xs text-muted-foreground">≥ 60 pontos</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={`hover:shadow-lg transition-all ${(summary?.pendingGrading || 0) > 0 ? 'border-l-4 border-l-orange-500' : ''}`}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Pendentes</p>
                                        <p className="text-3xl font-bold">{summary?.pendingGrading || 0}</p>
                                        <p className="text-xs text-orange-500">
                                            {(summary?.pendingGrading || 0) > 0 ? "aguardando correção" : "nenhuma pendência"}
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                        <Clock className="h-6 w-6 text-orange-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Tabs */}
                    <motion.div variants={item}>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
                                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                                <TabsTrigger value="courses">Por Curso</TabsTrigger>
                                <TabsTrigger value="quizzes">Por Quiz</TabsTrigger>
                                <TabsTrigger value="alerts">Alertas</TabsTrigger>
                            </TabsList>

                            {/* Overview Tab */}
                            <TabsContent value="overview" className="space-y-6 mt-6">
                                <div className="grid gap-6 lg:grid-cols-2">
                                    {/* Score Distribution Chart */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Distribuição de Notas</CardTitle>
                                            <CardDescription>Quantidade de alunos por faixa de nota</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {distribution?.distribution && distribution.distribution.length > 0 ? (
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={distribution.distribution}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="range" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                                                            {distribution.distribution.map((entry, index) => {
                                                                const rangeStart = parseInt(entry.range.split('-')[0]);
                                                                let color = COLORS.below;
                                                                if (rangeStart >= 90) color = COLORS.excellent;
                                                                else if (rangeStart >= 70) color = COLORS.good;
                                                                else if (rangeStart >= 60) color = COLORS.average;
                                                                return <Cell key={`cell-${index}`} fill={color} />;
                                                            })}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                                    <p>Sem dados suficientes</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Timeline Chart */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Evolução das Notas</CardTitle>
                                            <CardDescription>Média diária nos últimos 30 dias</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {distribution?.timeline && distribution.timeline.length > 0 ? (
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <LineChart data={distribution.timeline}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis
                                                            dataKey="date"
                                                            tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                        />
                                                        <YAxis domain={[0, 100]} />
                                                        <Tooltip
                                                            labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                                                            formatter={(value: number) => [`${value}%`, 'Média']}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="averageScore"
                                                            stroke="hsl(var(--primary))"
                                                            strokeWidth={2}
                                                            dot={{ fill: "hsl(var(--primary))" }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                                    <p>Sem dados suficientes</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Historical Comparison */}
                                {historical && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5" />
                                                Comparativo Histórico
                                            </CardTitle>
                                            <CardDescription>
                                                Comparação entre os últimos 30 dias e o período anterior
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid gap-4 md:grid-cols-3">
                                                <div className="p-4 rounded-lg bg-muted/50">
                                                    <p className="text-sm text-muted-foreground">Período Atual (30 dias)</p>
                                                    <p className="text-2xl font-bold">{historical.currentPeriod.average}%</p>
                                                    <p className="text-xs text-muted-foreground">{historical.currentPeriod.total} avaliações</p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-muted/50">
                                                    <p className="text-sm text-muted-foreground">Período Anterior</p>
                                                    <p className="text-2xl font-bold">{historical.previousPeriod.average}%</p>
                                                    <p className="text-xs text-muted-foreground">{historical.previousPeriod.total} avaliações</p>
                                                </div>
                                                <div className={`p-4 rounded-lg ${historical.change >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                                    <p className="text-sm text-muted-foreground">Variação</p>
                                                    <p className={`text-2xl font-bold flex items-center gap-1 ${historical.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {historical.change >= 0 ? (
                                                            <TrendingUp className="h-5 w-5" />
                                                        ) : (
                                                            <TrendingDown className="h-5 w-5" />
                                                        )}
                                                        {historical.change > 0 ? '+' : ''}{historical.change}%
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {historical.change >= 0 ? 'Melhora' : 'Queda'} no desempenho
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* Courses Tab */}
                            <TabsContent value="courses" className="space-y-4 mt-6">
                                {courseResults && courseResults.length > 0 ? (
                                    <div className="grid gap-4">
                                        {courseResults.map((course) => (
                                            <Card key={course._id} className="hover:shadow-md transition-all">
                                                <CardContent className="pt-6">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                                                                {course.thumbnail ? (
                                                                    <img
                                                                        src={course.thumbnail}
                                                                        alt={course.title}
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <BookOpen className="h-7 w-7 text-primary" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold text-lg">{course.title}</h3>
                                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                    <span className="flex items-center gap-1">
                                                                        <Users className="h-4 w-4" />
                                                                        {course.totalStudents} alunos
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <FileText className="h-4 w-4" />
                                                                        {course.totalQuizzes} quizzes
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-center">
                                                                <p className="text-2xl font-bold">{course.averageScore}%</p>
                                                                <p className="text-xs text-muted-foreground">Média</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-2xl font-bold">{course.completionRate}%</p>
                                                                <p className="text-xs text-muted-foreground">Conclusão</p>
                                                            </div>
                                                            {course.pendingGrading > 0 && (
                                                                <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">
                                                                    {course.pendingGrading} pendentes
                                                                </Badge>
                                                            )}
                                                            <Link href={`/professor/courses/${course._id}`}>
                                                                <Button variant="ghost" size="sm">
                                                                    <ArrowUpRight className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <Card>
                                        <CardContent className="py-12 text-center">
                                            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                            <p className="text-muted-foreground">Nenhum curso encontrado</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* Quizzes Tab */}
                            <TabsContent value="quizzes" className="space-y-4 mt-6">
                                {quizResults && quizResults.length > 0 ? (
                                    <div className="grid gap-4">
                                        {quizResults.map((quiz) => (
                                            <Card key={quiz._id} className="hover:shadow-md transition-all">
                                                <CardContent className="pt-6">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold">{quiz.title}</h3>
                                                                <Badge variant="outline">{quiz.type}</Badge>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">{quiz.courseName}</p>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-center">
                                                                <p className="text-xl font-bold">{quiz.totalAttempts}</p>
                                                                <p className="text-xs text-muted-foreground">Tentativas</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-xl font-bold">{quiz.averageScore}%</p>
                                                                <p className="text-xs text-muted-foreground">Média</p>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <div className="flex flex-col items-center">
                                                                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                                                    <span className="text-xs">{quiz.distribution.excellent}</span>
                                                                </div>
                                                                <div className="flex flex-col items-center">
                                                                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                                                    <span className="text-xs">{quiz.distribution.good}</span>
                                                                </div>
                                                                <div className="flex flex-col items-center">
                                                                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                                                    <span className="text-xs">{quiz.distribution.average}</span>
                                                                </div>
                                                                <div className="flex flex-col items-center">
                                                                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                                                    <span className="text-xs">{quiz.distribution.below}</span>
                                                                </div>
                                                            </div>
                                                            {quiz.pendingGrading > 0 && (
                                                                <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">
                                                                    {quiz.pendingGrading} pendentes
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <Card>
                                        <CardContent className="py-12 text-center">
                                            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                            <p className="text-muted-foreground">Nenhum quiz encontrado</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* Alerts Tab */}
                            <TabsContent value="alerts" className="space-y-4 mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                                            Alunos com Baixo Desempenho
                                        </CardTitle>
                                        <CardDescription>
                                            Alunos com média abaixo de 60% que precisam de atenção
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {lowPerformers && lowPerformers.length > 0 ? (
                                            <div className="space-y-3">
                                                {lowPerformers.map((student) => (
                                                    <div
                                                        key={student._id}
                                                        className={`flex items-center justify-between p-4 rounded-lg ${student.status === 'critical' ? 'bg-red-500/10 border border-red-500/20' : 'bg-orange-500/10 border border-orange-500/20'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                                                {student.imageUrl ? (
                                                                    <img
                                                                        src={student.imageUrl}
                                                                        alt={student.name}
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{student.name}</p>
                                                                <p className="text-sm text-muted-foreground">{student.email}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <p className={`text-lg font-bold ${student.status === 'critical' ? 'text-red-500' : 'text-orange-500'}`}>
                                                                    {student.averageScore}%
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {student.quizzesTaken} quizzes
                                                                </p>
                                                            </div>
                                                            <Badge variant={student.status === "critical" ? "destructive" : "secondary"}>
                                                                {student.status === "critical" ? "Crítico" : "Atenção"}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center">
                                                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
                                                <p className="text-muted-foreground">
                                                    Nenhum aluno com baixo desempenho identificado
                                                </p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Todos os alunos estão com média acima de 60%
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
}
