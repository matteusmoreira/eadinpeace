"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Flame, Star, BookOpen, Clock } from "lucide-react";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

const stats = [
    { label: "Cursos em Andamento", value: "3", icon: BookOpen, color: "text-primary" },
    { label: "Cursos Concluídos", value: "5", icon: Trophy, color: "text-emerald-500" },
    { label: "Horas de Estudo", value: "48h", icon: Clock, color: "text-amber-500" },
    { label: "Sequência Atual", value: "7 dias", icon: Flame, color: "text-orange-500" },
];

const coursesProgress = [
    { title: "JavaScript do Zero", progress: 75, totalLessons: 42, completedLessons: 32 },
    { title: "React Avançado", progress: 45, totalLessons: 38, completedLessons: 17 },
    { title: "Node.js e APIs", progress: 20, totalLessons: 30, completedLessons: 6 },
];

export default function StudentProgressPage() {
    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item}>
                <h1 className="text-2xl md:text-3xl font-bold">Meu Progresso</h1>
                <p className="text-muted-foreground">Acompanhe sua jornada de aprendizado</p>
            </motion.div>

            <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className={`h-12 w-12 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
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

            <motion.div variants={item}>
                <Card>
                    <CardHeader>
                        <CardTitle>Cursos em Andamento</CardTitle>
                        <CardDescription>Continue de onde parou</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {coursesProgress.map((course, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{course.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {course.completedLessons} de {course.totalLessons} aulas
                                        </p>
                                    </div>
                                    <Badge variant={course.progress >= 70 ? "default" : "secondary"}>
                                        {course.progress}%
                                    </Badge>
                                </div>
                                <Progress value={course.progress} className="h-2" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={item}>
                <Card>
                    <CardHeader>
                        <CardTitle>Conquistas</CardTitle>
                        <CardDescription>Suas medalhas e badges</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            {[
                                { name: "Primeiro Curso", icon: "🎓" },
                                { name: "Semana Perfeita", icon: "🔥" },
                                { name: "Quiz Master", icon: "⭐" },
                                { name: "Early Bird", icon: "🌅" },
                            ].map((badge, i) => (
                                <div key={i} className="flex flex-col items-center p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                    <span className="text-3xl mb-2">{badge.icon}</span>
                                    <span className="text-sm font-medium">{badge.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
