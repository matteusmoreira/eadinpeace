"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Target, Flame, BookOpen, Clock, Loader2, Play, Award } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function StudentProgressPage() {
    const { user } = useUser();

    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get enrollments with courses
    const enrollments = useQuery(
        api.enrollments.getByUser,
        convexUser?._id ? { userId: convexUser._id } : "skip"
    );

    // Get study streak
    const streak = useQuery(
        api.enrollments.getStreak,
        convexUser?._id ? { userId: convexUser._id } : "skip"
    );

    // Get certificates
    const certificates = useQuery(
        api.certificates.getByUser,
        convexUser?._id ? { userId: convexUser._id } : "skip"
    );

    const isLoading = enrollments === undefined;

    // Calculate stats
    const inProgressCourses = enrollments?.filter(e => e.progress > 0 && e.progress < 100) || [];
    const completedCourses = enrollments?.filter(e => e.progress === 100) || [];

    // Calculate total hours (from completed lessons)
    const totalHours = Math.floor(
        (enrollments?.reduce((acc, e) => {
            const courseDuration = e.course?.duration || 0;
            const progressPercentage = e.progress / 100;
            return acc + (courseDuration * progressPercentage);
        }, 0) || 0) / 3600
    );

    const stats = [
        {
            label: "Cursos Concluídos",
            value: completedCourses.length.toString(),
            icon: Trophy,
            color: "text-emerald-500 bg-emerald-500/10"
        },
        {
            label: "Horas de Estudo",
            value: `${totalHours}h`,
            icon: Clock,
            color: "text-amber-500 bg-amber-500/10"
        },
        {
            label: "Sequência Atual",
            value: `${streak?.currentStreak || 0} dias`,
            icon: Flame,
            color: "text-orange-500 bg-orange-500/10"
        },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item}>
                <h1 className="text-2xl md:text-3xl font-bold">Meu Progresso</h1>
                <p className="text-muted-foreground">Acompanhe sua jornada de aprendizado</p>
            </motion.div>

            {/* Stats Cards */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
                {stats.map((stat, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </motion.div>

            {/* Streak Card */}
            {streak && streak.currentStreak > 0 && (
                <motion.div variants={item}>
                    <Card className="border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-amber-500/5">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                                        <Flame className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold">{streak.currentStreak} dias</p>
                                        <p className="text-muted-foreground">Sequência de estudos</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Maior sequência</p>
                                    <p className="text-lg font-bold">{streak.longestStreak} dias</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}



            {/* Completed Courses */}
            {completedCourses.length > 0 && (
                <motion.div variants={item}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-emerald-500" />
                                Cursos Concluídos
                            </CardTitle>
                            <CardDescription>Parabéns pelos seus certificados!</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                {completedCourses.map((enrollment) => (
                                    <div
                                        key={enrollment._id}
                                        className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
                                            <Award className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{enrollment.course?.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Concluído em {enrollment.completedAt
                                                    ? new Date(enrollment.completedAt).toLocaleDateString("pt-BR")
                                                    : "-"
                                                }
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {certificates && certificates.length > 0 && (
                                <div className="mt-4 text-center">
                                    <Link href="/student/certificates">
                                        <Button variant="outline" className="gap-2">
                                            <Award className="h-4 w-4" />
                                            Ver Certificados
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Achievements */}
            <motion.div variants={item}>
                <Card>
                    <CardHeader>
                        <CardTitle>Conquistas</CardTitle>
                        <CardDescription>Suas medalhas e badges</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            {[
                                {
                                    name: "Primeiro Curso",
                                    icon: "🎓",
                                    unlocked: (enrollments?.length || 0) > 0,
                                    description: "Matricule-se em seu primeiro curso"
                                },
                                {
                                    name: "Semana Perfeita",
                                    icon: "🔥",
                                    unlocked: (streak?.currentStreak || 0) >= 7,
                                    description: "Estude por 7 dias seguidos"
                                },
                                {
                                    name: "Certificado",
                                    icon: "🏆",
                                    unlocked: (certificates?.length || 0) > 0,
                                    description: "Complete seu primeiro curso"
                                },
                                {
                                    name: "Estudante Dedicado",
                                    icon: "⭐",
                                    unlocked: totalHours >= 10,
                                    description: "Estude por 10 horas"
                                },
                            ].map((badge, i) => (
                                <div
                                    key={i}
                                    className={`flex flex-col items-center p-4 rounded-lg transition-colors ${badge.unlocked
                                        ? "bg-primary/10 hover:bg-primary/20"
                                        : "bg-muted/50 opacity-50"
                                        }`}
                                    title={badge.description}
                                >
                                    <span className="text-3xl mb-2">{badge.icon}</span>
                                    <span className="text-sm font-medium">{badge.name}</span>
                                    {!badge.unlocked && (
                                        <span className="text-xs text-muted-foreground mt-1">Bloqueado</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
