"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    BookOpen,
    Trophy,
    Clock,
    Flame,
    Play,
    ArrowRight,
    Award,
    Target,
    TrendingUp,
    Loader2,
    GraduationCap,
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

export default function StudentDashboardPage() {
    const { user } = useUser();

    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get user stats
    const stats = useQuery(
        api.users.getStats,
        convexUser?._id ? { userId: convexUser._id } : "skip"
    );

    // Get user enrollments
    const enrollments = useQuery(
        api.enrollments.getByUser,
        convexUser?._id ? { userId: convexUser._id } : "skip"
    );

    const isLoading = !convexUser || stats === undefined;

    // Sort enrollments by last accessed
    const sortedEnrollments = [...(enrollments || [])]
        .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);

    const inProgressCourses = sortedEnrollments.filter(e => !e.completedAt);
    const recentCourse = inProgressCourses[0];

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Welcome Header */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        Olá, {user?.firstName || "Aluno"}! 👋
                    </h1>
                    <p className="text-muted-foreground">
                        Continue sua jornada de aprendizado
                    </p>
                </div>
                <Link href="/student/courses">
                    <Button className="gap-2 gradient-bg border-0">
                        <BookOpen className="h-4 w-4" />
                        Explorar Cursos
                    </Button>
                </Link>
            </motion.div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <motion.div variants={item} className="grid gap-4 md:grid-cols-4">
                        <Card className="hover:shadow-lg transition-all">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <BookOpen className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold">{stats?.coursesInProgress || 0}</p>
                                        <p className="text-sm text-muted-foreground">Em Progresso</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <Trophy className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold">{stats?.coursesCompleted || 0}</p>
                                        <p className="text-sm text-muted-foreground">Concluídos</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                        <Award className="h-6 w-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold">{stats?.certificates || 0}</p>
                                        <p className="text-sm text-muted-foreground">Certificados</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                        <Flame className="h-6 w-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold">{stats?.currentStreak || 0}</p>
                                        <p className="text-sm text-muted-foreground">Dias de Streak</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Continue Learning */}
                    {recentCourse && (
                        <motion.div variants={item}>
                            <Card className="overflow-hidden">
                                <div className="md:flex">
                                    <div className="md:w-1/3 aspect-video md:aspect-auto bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                        {recentCourse.course?.thumbnail ? (
                                            <img
                                                src={recentCourse.course.thumbnail}
                                                alt={recentCourse.course.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <GraduationCap className="h-16 w-16 text-primary/30" />
                                        )}
                                    </div>
                                    <div className="flex-1 p-6">
                                        <Badge variant="secondary" className="mb-2">Continue de onde parou</Badge>
                                        <h3 className="text-xl font-bold mb-2">{recentCourse.course?.title}</h3>
                                        <p className="text-muted-foreground mb-4 line-clamp-2">
                                            {recentCourse.course?.description}
                                        </p>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="flex-1">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>Progresso</span>
                                                    <span className="font-medium">{recentCourse.progress}%</span>
                                                </div>
                                                <Progress value={recentCourse.progress} className="h-2" />
                                            </div>
                                        </div>
                                        <Link href={`/student/courses/${recentCourse.courseId}`}>
                                            <Button className="gap-2 gradient-bg border-0">
                                                <Play className="h-4 w-4" />
                                                Continuar Assistindo
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* Courses in Progress */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <motion.div variants={item}>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Meus Cursos</CardTitle>
                                        <CardDescription>Cursos em andamento</CardDescription>
                                    </div>
                                    <Link href="/student/courses">
                                        <Button variant="ghost" size="sm" className="gap-1">
                                            Ver todos <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <CardContent>
                                    {inProgressCourses.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>Nenhum curso em andamento</p>
                                            <Link href="/student/courses">
                                                <Button variant="link" className="mt-2">
                                                    Explorar cursos
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {inProgressCourses.slice(0, 3).map((enrollment) => (
                                                <Link
                                                    key={enrollment._id}
                                                    href={`/student/courses/${enrollment.courseId}`}
                                                    className="block"
                                                >
                                                    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                            <BookOpen className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium line-clamp-1">
                                                                {enrollment.course?.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Progress value={enrollment.progress} className="h-1.5 flex-1" />
                                                                <span className="text-xs text-muted-foreground">
                                                                    {enrollment.progress}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="icon">
                                                            <Play className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Achievements */}
                        <motion.div variants={item}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Conquistas</CardTitle>
                                    <CardDescription>Suas medalhas e certificados</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-4">
                                        {stats?.coursesCompleted > 0 && (
                                            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/5">
                                                <div className="h-12 w-12 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center mb-2">
                                                    <Trophy className="h-6 w-6 text-amber-500" />
                                                </div>
                                                <p className="text-xs font-medium">Primeiro Curso</p>
                                            </div>
                                        )}
                                        {stats?.currentStreak >= 7 && (
                                            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-500/5">
                                                <div className="h-12 w-12 mx-auto rounded-full bg-orange-500/20 flex items-center justify-center mb-2">
                                                    <Flame className="h-6 w-6 text-orange-500" />
                                                </div>
                                                <p className="text-xs font-medium">7 Dias Seguidos</p>
                                            </div>
                                        )}
                                        {stats?.certificates > 0 && (
                                            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
                                                <div className="h-12 w-12 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
                                                    <Award className="h-6 w-6 text-emerald-500" />
                                                </div>
                                                <p className="text-xs font-medium">Certificado</p>
                                            </div>
                                        )}
                                    </div>

                                    {stats?.achievements === 0 && stats?.coursesCompleted === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>Comece a estudar para desbloquear conquistas!</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </>
            )}
        </motion.div>
    );
}
