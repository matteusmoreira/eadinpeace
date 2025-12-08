"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    BookOpen,
    Users,
    TrendingUp,
    Play,
    Plus,
    ArrowUpRight,
    Clock,
    Award,
    Eye,
    Loader2,
    GraduationCap,
    HelpCircle,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    FileText,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function ProfessorDashboardPage() {
    const { user } = useUser();

    // Get Convex user
    const convexUser = useQuery(api.users.getByClerkId, {
        clerkId: user?.id || ""
    });

    // Get professor's courses
    const courses = useQuery(
        api.courses.getByInstructor,
        convexUser?._id ? { instructorId: convexUser._id } : "skip"
    );

    // Get grading stats for professor (by organization)
    const gradingStats = useQuery(
        api.quizzesGrading.getGradingStats,
        convexUser?.organizationId ? { organizationId: convexUser.organizationId } : "skip"
    );

    // Get pending grading attempts
    const pendingGrading = useQuery(
        api.quizzesGrading.getPendingGrading,
        convexUser?._id ? { instructorId: convexUser._id } : "skip"
    );

    const isLoading = courses === undefined;

    // Calculate stats
    const totalCourses = courses?.length || 0;
    const publishedCourses = courses?.filter(c => c.isPublished).length || 0;

    // Get courses enriched with stats (we need to use a separate approach)
    const organizationId = convexUser?.organizationId;
    const orgCourses = useQuery(
        api.courses.getByOrganization,
        organizationId ? { organizationId } : "skip"
    );

    // Filter to only instructor's courses
    const myCourses = orgCourses?.filter(c => c.instructorId === convexUser?._id) || [];
    const totalEnrollments = myCourses.reduce((acc, c) => acc + (c.enrollmentCount || 0), 0);
    const totalLessons = myCourses.reduce((acc, c) => acc + (c.lessonCount || 0), 0);

    // Recent courses (last 3)
    const recentCourses = [...myCourses]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 3);

    // Grading stats
    const pendingCount = gradingStats?.pendingGrading || 0;
    const gradedCount = gradingStats?.graded || 0;
    const averageScore = gradingStats?.avgScore || 0;

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours === 0) return `${mins}min`;
        return `${hours}h ${mins}min`;
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        Olá, Professor {user?.firstName}! 👋
                    </h1>
                    <p className="text-muted-foreground">Gerencie seus cursos e acompanhe seus alunos</p>
                </div>
                <Link href="/professor/courses/new">
                    <Button className="gap-2 gradient-bg border-0">
                        <Plus className="h-4 w-4" />
                        Criar Novo Curso
                    </Button>
                </Link>
            </motion.div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    <motion.div variants={item} className="grid gap-4 md:grid-cols-4">
                        <Card className="hover:shadow-lg transition-all">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Meus Cursos</p>
                                        <p className="text-3xl font-bold">{totalCourses}</p>
                                        <p className="text-xs text-emerald-500">
                                            {publishedCourses} publicados
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <BookOpen className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total de Alunos</p>
                                        <p className="text-3xl font-bold">{totalEnrollments}</p>
                                        <p className="text-xs text-muted-foreground">matriculados</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-emerald-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total de Aulas</p>
                                        <p className="text-3xl font-bold">{totalLessons}</p>
                                        <p className="text-xs text-muted-foreground">criadas</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                        <Play className="h-6 w-6 text-amber-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Horas de Conteúdo</p>
                                        <p className="text-3xl font-bold">
                                            {Math.round(myCourses.reduce((acc, c) => acc + c.duration, 0) / 60)}h
                                        </p>
                                        <p className="text-xs text-muted-foreground">total</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                        <Clock className="h-6 w-6 text-violet-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Quiz/Grading Stats Row */}
                    <motion.div variants={item} className="grid gap-4 md:grid-cols-4">
                        <Card className="hover:shadow-lg transition-all border-l-4 border-l-indigo-500">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Quizzes</p>
                                        <p className="text-3xl font-bold">{gradingStats?.totalAttempts || 0}</p>
                                        <p className="text-xs text-muted-foreground">criados</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                        <HelpCircle className="h-6 w-6 text-indigo-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Link href="/professor/quizzes/grading">
                            <Card className={`hover:shadow-lg transition-all cursor-pointer ${pendingCount > 0 ? 'border-l-4 border-l-orange-500' : ''}`}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Pendentes</p>
                                            <p className="text-3xl font-bold">{pendingCount}</p>
                                            <p className="text-xs text-orange-500 font-medium">
                                                {pendingCount > 0 ? "aguardando correção" : "nenhuma pendência"}
                                            </p>
                                        </div>
                                        <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                            <AlertCircle className="h-6 w-6 text-orange-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        <Card className="hover:shadow-lg transition-all">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Corrigidos</p>
                                        <p className="text-3xl font-bold">{gradedCount}</p>
                                        <p className="text-xs text-emerald-500">finalizados</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Média Geral</p>
                                        <p className="text-3xl font-bold">{averageScore.toFixed(0)}%</p>
                                        <p className="text-xs text-muted-foreground">dos alunos</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <BarChart3 className="h-6 w-6 text-blue-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <motion.div variants={item}>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Meus Cursos</CardTitle>
                                        <CardDescription>Cursos mais recentes</CardDescription>
                                    </div>
                                    <Link href="/professor/courses">
                                        <Button variant="ghost" size="sm">Ver todos</Button>
                                    </Link>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {recentCourses.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>Nenhum curso ainda</p>
                                            <Link href="/professor/courses/new">
                                                <Button variant="link" className="mt-2">Criar primeiro curso</Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        recentCourses.map((course) => (
                                            <Link
                                                key={course._id}
                                                href={`/professor/courses/${course._id}`}
                                                className="block"
                                            >
                                                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                            {course.thumbnail ? (
                                                                <img src={course.thumbnail} alt="" className="h-full w-full object-cover rounded-lg" />
                                                            ) : (
                                                                <GraduationCap className="h-6 w-6 text-primary" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium">{course.title}</p>
                                                                <Badge variant={course.isPublished ? "default" : "secondary"} className="text-xs">
                                                                    {course.isPublished ? "Publicado" : "Rascunho"}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                {course.enrollmentCount || 0} alunos • {course.lessonCount || 0} aulas
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div variants={item}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Ações Rápidas</CardTitle>
                                    <CardDescription>O que você quer fazer hoje?</CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-3">
                                    <Link href="/professor/courses/new">
                                        <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Plus className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium">Criar Novo Curso</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Comece um novo curso do zero
                                                </p>
                                            </div>
                                        </Button>
                                    </Link>
                                    <Link href="/professor/courses">
                                        <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
                                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                <Eye className="h-5 w-5 text-emerald-500" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium">Gerenciar Cursos</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Editar, adicionar módulos e aulas
                                                </p>
                                            </div>
                                        </Button>
                                    </Link>
                                    <Link href="/professor/students">
                                        <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
                                            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                <Users className="h-5 w-5 text-amber-500" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium">Ver Alunos</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Acompanhe o progresso dos alunos
                                                </p>
                                            </div>
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
