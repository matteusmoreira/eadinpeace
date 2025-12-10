"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Loader2,
    BookOpen,
    Award,
    Users,
    TrendingUp,
    TrendingDown,
    BarChart3,
    Download,
    Calendar,
    Target,
    CheckCircle,
    Clock,
    AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
};

export default function ClassReportsPage() {
    const params = useParams();
    const pathname = usePathname();
    const classId = params.classId as Id<"classes">;

    const [period, setPeriod] = useState("all");

    // Determine base path (admin or professor)
    const isAdmin = pathname.includes("/admin/");
    const basePath = isAdmin ? "/admin" : "/professor";

    // Queries
    const classDetails = useQuery(api.classes.getById, { classId });
    const enrollments = useQuery(api.classes.getEnrollments, { classId });
    const stats = useQuery(api.classes.getStats, { classId });

    const isLoading = classDetails === undefined || enrollments === undefined;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!classDetails) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-bold mb-2">Turma não encontrada</h2>
                <Link href={`${basePath}/classes`}>
                    <Button>Voltar às turmas</Button>
                </Link>
            </div>
        );
    }

    // Process data for charts and stats
    const activeStudents = (enrollments as any[] ?? []).filter((e) => e?.status === "active");
    const completedStudents = (enrollments as any[] ?? []).filter((e) => e?.status === "completed");
    const droppedStudents = (enrollments as any[] ?? []).filter((e) => e?.status === "dropped");

    // Calculate progress distribution
    const progressRanges = [
        { label: "0-25%", min: 0, max: 25, count: 0, color: "bg-red-500" },
        { label: "26-50%", min: 26, max: 50, count: 0, color: "bg-amber-500" },
        { label: "51-75%", min: 51, max: 75, count: 0, color: "bg-blue-500" },
        { label: "76-100%", min: 76, max: 100, count: 0, color: "bg-emerald-500" },
    ];

    activeStudents.forEach((student: any) => {
        const progress = student.progressPercent || 0;
        const range = progressRanges.find((r) => progress >= r.min && progress <= r.max);
        if (range) range.count++;
    });

    // Calculate grade distribution
    const gradeRanges = [
        { label: "0-59 (F)", min: 0, max: 59, count: 0, color: "bg-red-500" },
        { label: "60-69 (D)", min: 60, max: 69, count: 0, color: "bg-amber-500" },
        { label: "70-79 (C)", min: 70, max: 79, count: 0, color: "bg-yellow-500" },
        { label: "80-89 (B)", min: 80, max: 89, count: 0, color: "bg-blue-500" },
        { label: "90-100 (A)", min: 90, max: 100, count: 0, color: "bg-emerald-500" },
    ];

    const studentsWithGrades = activeStudents.filter((s: any) => s.averageScore !== null);
    studentsWithGrades.forEach((student: any) => {
        const grade = student.averageScore || 0;
        const range = gradeRanges.find((r) => grade >= r.min && grade <= r.max);
        if (range) range.count++;
    });

    // Top performers
    const topPerformers = [...activeStudents]
        .sort((a: any, b: any) => (b.progressPercent || 0) - (a.progressPercent || 0))
        .slice(0, 5);

    // Students at risk (low progress)
    const atRiskStudents = activeStudents
        .filter((s: any) => (s.progressPercent || 0) < 25)
        .sort((a: any, b: any) => (a.progressPercent || 0) - (b.progressPercent || 0));

    const handleExportCSV = () => {
        // Create CSV content
        const headers = ["Nome", "Email", "Progresso (%)", "Nota Média", "Aulas Concluídas", "Última Atividade"];
        const rows = activeStudents.map((s: any) => [
            `${s.user?.firstName} ${s.user?.lastName}`,
            s.user?.email,
            s.progressPercent || 0,
            s.averageScore ?? "N/A",
            s.completedLessons || 0,
            s.lastActivity ? new Date(s.lastActivity).toLocaleDateString("pt-BR") : "N/A",
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.join(",")),
        ].join("\n");

        // Download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `relatorio-${classDetails.name}-${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Header */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href={`${basePath}/classes/${classId}`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Relatórios da Turma</h1>
                        <p className="text-muted-foreground">{classDetails.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
                        <Download className="h-4 w-4" />
                        Exportar CSV
                    </Button>
                </div>
            </motion.div>

            {/* Overview Stats */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{activeStudents.length}</p>
                                <p className="text-xs text-muted-foreground">Alunos Ativos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Award className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{completedStudents.length}</p>
                                <p className="text-xs text-muted-foreground">Concluíram</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.averageProgress || 0}%</p>
                                <p className="text-xs text-muted-foreground">Progresso Médio</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <Target className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {studentsWithGrades.length > 0
                                        ? Math.round(studentsWithGrades.reduce((sum: number, s: any) => sum + (s.averageScore || 0), 0) / studentsWithGrades.length)
                                        : "-"}
                                </p>
                                <p className="text-xs text-muted-foreground">Nota Média</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{atRiskStudents.length}</p>
                                <p className="text-xs text-muted-foreground">Em Risco</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Progress Distribution */}
                <motion.div variants={item}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Distribuição de Progresso</CardTitle>
                            <CardDescription>Quantidade de alunos por faixa de progresso</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {progressRanges.map((range) => (
                                    <div key={range.label} className="flex items-center gap-4">
                                        <div className="w-20 text-sm text-muted-foreground">{range.label}</div>
                                        <div className="flex-1">
                                            <div className="h-8 bg-muted rounded-lg overflow-hidden">
                                                <div
                                                    className={`h-full ${range.color} transition-all duration-500`}
                                                    style={{
                                                        width: `${activeStudents.length > 0 ? (range.count / activeStudents.length) * 100 : 0}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-12 text-right font-medium">{range.count}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Grade Distribution */}
                <motion.div variants={item}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Distribuição de Notas</CardTitle>
                            <CardDescription>Quantidade de alunos por faixa de nota</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {gradeRanges.map((range) => (
                                    <div key={range.label} className="flex items-center gap-4">
                                        <div className="w-24 text-sm text-muted-foreground">{range.label}</div>
                                        <div className="flex-1">
                                            <div className="h-8 bg-muted rounded-lg overflow-hidden">
                                                <div
                                                    className={`h-full ${range.color} transition-all duration-500`}
                                                    style={{
                                                        width: `${studentsWithGrades.length > 0 ? (range.count / studentsWithGrades.length) * 100 : 0}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-12 text-right font-medium">{range.count}</div>
                                    </div>
                                ))}
                                {studentsWithGrades.length === 0 && (
                                    <p className="text-center text-muted-foreground py-4">
                                        Nenhum aluno com notas registradas
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Top Performers */}
                <motion.div variants={item}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-emerald-500" />
                                Melhores Desempenhos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {topPerformers.length > 0 ? (
                                <div className="space-y-3">
                                    {topPerformers.map((student: any, index: number) => (
                                        <div key={student._id} className="flex items-center gap-3">
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? "bg-amber-500" :
                                                    index === 1 ? "bg-gray-400" :
                                                        index === 2 ? "bg-amber-700" : "bg-primary/50"
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">
                                                    {student.user?.firstName} {student.user?.lastName}
                                                </p>
                                                <Progress value={student.progressPercent} className="h-1.5 mt-1" />
                                            </div>
                                            <Badge variant="outline">{student.progressPercent}%</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-4">
                                    Nenhum aluno com progresso registrado
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* At Risk Students */}
                <motion.div variants={item}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                Alunos em Risco
                            </CardTitle>
                            <CardDescription>Alunos com menos de 25% de progresso</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {atRiskStudents.length > 0 ? (
                                <div className="space-y-3">
                                    {atRiskStudents.slice(0, 5).map((student: any) => (
                                        <div key={student._id} className="flex items-center gap-3 p-2 bg-red-500/5 rounded-lg">
                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">
                                                    {student.user?.firstName} {student.user?.lastName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {student.lastActivity
                                                        ? `Última atividade: ${formatDate(student.lastActivity)}`
                                                        : "Sem atividade registrada"}
                                                </p>
                                            </div>
                                            <Badge variant="destructive">{student.progressPercent || 0}%</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
                                    <p className="text-muted-foreground">
                                        Nenhum aluno em risco!
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Full Student Table */}
            <motion.div variants={item}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Relatório Completo</CardTitle>
                        <CardDescription>Visão geral de todos os alunos</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Aluno</TableHead>
                                    <TableHead>Progresso</TableHead>
                                    <TableHead>Aulas</TableHead>
                                    <TableHead>Nota Média</TableHead>
                                    <TableHead>Última Atividade</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Nenhum aluno inscrito
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    activeStudents.map((student: any) => (
                                        <TableRow key={student._id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">
                                                        {student.user?.firstName} {student.user?.lastName}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {student.user?.email}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={student.progressPercent} className="w-16 h-2" />
                                                    <span className="text-sm">{student.progressPercent}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {student.completedLessons}/{student.totalLessons}
                                            </TableCell>
                                            <TableCell>
                                                {student.averageScore !== null ? (
                                                    <span className={student.averageScore >= 70 ? "text-emerald-500" : "text-amber-500"}>
                                                        {student.averageScore}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {student.lastActivity ? formatDate(student.lastActivity) : "-"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    student.progressPercent >= 75 ? "default" :
                                                        student.progressPercent >= 25 ? "secondary" : "destructive"
                                                }>
                                                    {student.progressPercent >= 75 ? "Bom" :
                                                        student.progressPercent >= 25 ? "Regular" : "Baixo"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
