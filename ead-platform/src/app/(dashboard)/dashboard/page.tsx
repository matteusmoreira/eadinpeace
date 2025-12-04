"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    BookOpen,
    Clock,
    Trophy,
    TrendingUp,
    Play,
    ArrowRight,
    Star,
    Users,
    CheckCircle2,
    Flame,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

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

// Mock data - will come from Convex
const mockStats = [
    {
        title: "Cursos em Progresso",
        value: "4",
        description: "+2 esta semana",
        icon: BookOpen,
        trend: "up",
        color: "text-primary",
        bgColor: "bg-primary/10",
    },
    {
        title: "Horas de Estudo",
        value: "32h",
        description: "Este mês",
        icon: Clock,
        trend: "up",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
    },
    {
        title: "Certificados",
        value: "7",
        description: "+1 novo",
        icon: Trophy,
        trend: "up",
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
    },
    {
        title: "Sequência",
        value: "12",
        description: "dias seguidos",
        icon: Flame,
        trend: "up",
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
    },
];

const mockCourses = [
    {
        id: 1,
        title: "Next.js 14 - O Curso Completo",
        instructor: "João Silva",
        progress: 75,
        thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop",
        duration: "12h",
        lessons: 48,
        completedLessons: 36,
    },
    {
        id: 2,
        title: "TypeScript Avançado",
        instructor: "Maria Santos",
        progress: 45,
        thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=225&fit=crop",
        duration: "8h",
        lessons: 32,
        completedLessons: 14,
    },
    {
        id: 3,
        title: "React com Tailwind CSS",
        instructor: "Pedro Costa",
        progress: 20,
        thumbnail: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=400&h=225&fit=crop",
        duration: "6h",
        lessons: 24,
        completedLessons: 5,
    },
];

const mockAchievements = [
    { id: 1, title: "Primeira Aula", icon: "🎯", unlocked: true },
    { id: 2, title: "Maratonista", icon: "🏃", unlocked: true },
    { id: 3, title: "Certificado!", icon: "🏆", unlocked: true },
    { id: 4, title: "100 Horas", icon: "⏰", unlocked: false },
    { id: 5, title: "Top 10", icon: "🥇", unlocked: false },
];

export default function DashboardPage() {
    const { user } = useUser();

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
                    Continue sua jornada de aprendizado. Você está indo muito bem!
                </p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {mockStats.map((stat, index) => (
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
                                <TrendingUp className="h-3 w-3 text-emerald-500" />
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
                    <Button variant="ghost" className="gap-2">
                        Ver todos <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {mockCourses.map((course) => (
                        <Card
                            key={course.id}
                            className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="relative aspect-video overflow-hidden">
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button size="lg" className="gap-2 gradient-bg border-0">
                                        <Play className="h-5 w-5" />
                                        Continuar
                                    </Button>
                                </div>
                                <Badge className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm">
                                    {course.duration}
                                </Badge>
                            </div>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
                                    {course.title}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2">
                                    <span>{course.instructor}</span>
                                    <span>•</span>
                                    <span>{course.completedLessons}/{course.lessons} aulas</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Progresso</span>
                                        <span className="font-medium">{course.progress}%</span>
                                    </div>
                                    <Progress value={course.progress} className="h-2" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </motion.div>

            {/* Achievements Section */}
            <motion.div variants={item}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Conquistas</h2>
                    <Button variant="ghost" className="gap-2">
                        Ver todas <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            {mockAchievements.map((achievement) => (
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
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
