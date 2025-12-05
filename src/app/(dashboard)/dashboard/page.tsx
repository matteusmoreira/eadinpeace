"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
    BookOpen,
    Clock,
    Trophy,
    TrendingUp,
    Play,
    ArrowRight,
    Users,
    CheckCircle2,
    Flame,
    GraduationCap,
    Award,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import Link from "next/link";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <Skeleton className="aspect-video" />
                        <CardHeader>
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user } = useUser();

    // Get user from Convex
    const convexUser = useQuery(api.users.getByClerkId, {
        clerkId: user?.id || ""
    });

    // Get user stats
    const userStats = useQuery(api.users.getStats,
        convexUser ? { userId: convexUser._id } : "skip"
    );

    // Get user enrollments
    const enrollments = useQuery(api.enrollments.getByUser,
        convexUser ? { userId: convexUser._id } : "skip"
    );

    // Get achievements
    const achievements = useQuery(api.gamification.getUserAchievements,
        convexUser ? { userId: convexUser._id } : "skip"
    );

    // Get all achievements for display
    const allAchievements = useQuery(api.gamification.getAll);

    // Loading state
    if (!user || convexUser === undefined) {
        return <DashboardSkeleton />;
    }

    // Build stats from real data
    const stats = [
        {
            title: "Cursos em Progresso",
            value: String(userStats?.coursesInProgress || 0),
            description: "cursos ativos",
            icon: BookOpen,
            color: "text-primary",
            bgColor: "bg-primary/10",
        },
        {
            title: "Cursos Concluídos",
            value: String(userStats?.coursesCompleted || 0),
            description: "finalizados",
            icon: GraduationCap,
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
        },
        {
            title: "Certificados",
            value: String(userStats?.certificates || 0),
            description: "conquistados",
            icon: Award,
            color: "text-amber-500",
            bgColor: "bg-amber-500/10",
        },
        {
            title: "Sequência",
            value: String(userStats?.currentStreak || 0),
            description: "dias seguidos",
            icon: Flame,
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
        },
    ];

    // Map achievements
    const achievementItems = allAchievements?.slice(0, 5).map(achievement => {
        const isUnlocked = achievements?.some(ua => ua.achievementId === achievement._id);
        const iconMap: Record<string, string> = {
            play: "🎯",
            trophy: "🏆",
            star: "⭐",
            crown: "👑",
            flame: "🔥",
            fire: "🔥",
        };
        return {
            id: achievement._id,
            title: achievement.name,
            icon: iconMap[achievement.icon] || "🎯",
            unlocked: isUnlocked,
        };
    }) || [];

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Welcome Header */}
            <motion.div variants={item} className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold">
                    Olá, <span className="gradient-text">{user?.firstName || "Estudante"}</span>! 👋
                </h1>
                <p className="text-muted-foreground">
                    {userStats?.coursesInProgress
                        ? "Continue sua jornada de aprendizado. Você está indo muito bem!"
                        : "Bem-vindo! Comece sua jornada de aprendizado matriculando-se em um curso."}
                </p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <Card
                        key={index}
                        className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-muted-foreground">
                                    {stat.description}
                                </span>
                            </div>
                        </CardContent>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </Card>
                ))}
            </motion.div>

            {/* Continue Learning Section */}
            <motion.div variants={item}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Continuar Aprendendo</h2>
                    <Link href="/student/courses">
                        <Button variant="ghost" className="gap-2">
                            Ver todos <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {enrollments && enrollments.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {enrollments.slice(0, 3).map((enrollment: any) => (
                            <Card
                                key={enrollment._id}
                                className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="relative aspect-video overflow-hidden bg-muted">
                                    {enrollment.course?.thumbnail ? (
                                        <img
                                            src={enrollment.course.thumbnail}
                                            alt={enrollment.course?.title || "Course"}
                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <BookOpen className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Link href={`/student/courses/${enrollment.courseId}/learn`}>
                                            <Button size="lg" className="gap-2 gradient-bg border-0">
                                                <Play className="h-5 w-5" />
                                                Continuar
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
                                        {enrollment.course?.title || "Curso"}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                        <span>{enrollment.completedLessons?.length || 0} aulas concluídas</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Progresso</span>
                                            <span className="font-medium">{enrollment.progress || 0}%</span>
                                        </div>
                                        <Progress value={enrollment.progress || 0} className="h-2" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="p-12 text-center">
                        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Nenhum curso em andamento</h3>
                        <p className="text-muted-foreground mb-4">
                            Explore nosso catálogo e comece a aprender hoje!
                        </p>
                        <Link href="/student/search">
                            <Button className="gradient-bg border-0">
                                Explorar Cursos
                            </Button>
                        </Link>
                    </Card>
                )}
            </motion.div>

            {/* Achievements Section */}
            <motion.div variants={item}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Conquistas</h2>
                    <Link href="/student/achievements">
                        <Button variant="ghost" className="gap-2">
                            Ver todas <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        {achievementItems.length > 0 ? (
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                {achievementItems.map((achievement) => (
                                    <div
                                        key={achievement.id}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ${achievement.unlocked
                                                ? "bg-primary/10 hover:bg-primary/20"
                                                : "bg-muted opacity-50"
                                            }`}
                                    >
                                        <span className="text-3xl">{achievement.icon}</span>
                                        <span className="text-xs font-medium text-center">
                                            {achievement.title}
                                        </span>
                                        {achievement.unlocked && (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">
                                    Complete cursos para desbloquear conquistas!
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
