"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Trophy,
    Clock,
    CheckCircle2,
    XCircle,
    Play,
    BookOpen,
    Target,
    TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

// Mock quizzes data
const mockQuizzes = [
    {
        id: "quiz1",
        title: "Fundamentos de JavaScript",
        courseName: "JavaScript do Zero",
        lessonName: "Variáveis e Tipos de Dados",
        questions: 5,
        timeLimit: 10,
        passingScore: 70,
        attempts: 2,
        bestScore: 80,
        lastAttempt: "Há 2 dias",
        status: "passed",
    },
    {
        id: "quiz2",
        title: "Funções e Escopo",
        courseName: "JavaScript do Zero",
        lessonName: "Funções",
        questions: 8,
        timeLimit: 15,
        passingScore: 70,
        attempts: 1,
        bestScore: 62,
        lastAttempt: "Há 5 dias",
        status: "failed",
    },
    {
        id: "quiz3",
        title: "Arrays e Objetos",
        courseName: "JavaScript do Zero",
        lessonName: "Estruturas de Dados",
        questions: 10,
        timeLimit: 20,
        passingScore: 70,
        attempts: 0,
        bestScore: null,
        lastAttempt: null,
        status: "pending",
    },
    {
        id: "quiz4",
        title: "Introdução ao React",
        courseName: "React do Zero ao Avançado",
        lessonName: "Primeiros Passos",
        questions: 6,
        timeLimit: 12,
        passingScore: 70,
        attempts: 0,
        bestScore: null,
        lastAttempt: null,
        status: "pending",
    },
];

const stats = [
    { label: "Quizzes Disponíveis", value: "12", icon: BookOpen, color: "text-primary" },
    { label: "Concluídos", value: "4", icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Taxa de Aprovação", value: "75%", icon: Target, color: "text-amber-500" },
    { label: "Melhor Nota", value: "95%", icon: Trophy, color: "text-violet-500" },
];

export default function StudentQuizzesPage() {
    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={item}>
                <h1 className="text-2xl md:text-3xl font-bold">Avaliações</h1>
                <p className="text-muted-foreground">
                    Teste seus conhecimentos com quizzes interativos
                </p>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all duration-300">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                                <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </motion.div>

            {/* Quizzes List */}
            <motion.div variants={item} className="space-y-4">
                <h2 className="text-lg font-semibold">Quizzes Disponíveis</h2>

                <div className="grid gap-4 md:grid-cols-2">
                    {mockQuizzes.map((quiz) => (
                        <Card
                            key={quiz.id}
                            className={cn(
                                "group hover:shadow-lg transition-all duration-300",
                                quiz.status === "passed" && "border-emerald-200 dark:border-emerald-800",
                                quiz.status === "failed" && "border-amber-200 dark:border-amber-800"
                            )}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-base">{quiz.title}</CardTitle>
                                        <CardDescription className="line-clamp-1">
                                            {quiz.courseName} • {quiz.lessonName}
                                        </CardDescription>
                                    </div>
                                    {quiz.status === "passed" && (
                                        <Badge className="bg-emerald-500 shrink-0">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Aprovado
                                        </Badge>
                                    )}
                                    {quiz.status === "failed" && (
                                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 shrink-0">
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Tentar Novamente
                                        </Badge>
                                    )}
                                    {quiz.status === "pending" && (
                                        <Badge variant="outline" className="shrink-0">
                                            Pendente
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Quiz Info */}
                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <BookOpen className="h-3.5 w-3.5" />
                                        {quiz.questions} questões
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        {quiz.timeLimit} min
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Target className="h-3.5 w-3.5" />
                                        Mínimo {quiz.passingScore}%
                                    </div>
                                </div>

                                {/* Best Score */}
                                {quiz.bestScore !== null && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Melhor nota</span>
                                            <span className={cn(
                                                "font-medium",
                                                quiz.bestScore >= quiz.passingScore ? "text-emerald-500" : "text-amber-500"
                                            )}>
                                                {quiz.bestScore}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={quiz.bestScore}
                                            className={cn(
                                                "h-2",
                                                quiz.bestScore >= quiz.passingScore
                                                    ? "[&>div]:bg-emerald-500"
                                                    : "[&>div]:bg-amber-500"
                                            )}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {quiz.attempts} tentativa{quiz.attempts !== 1 && "s"} • Última: {quiz.lastAttempt}
                                        </p>
                                    </div>
                                )}

                                {/* CTA */}
                                <Link href={`/student/quiz/${quiz.id}`}>
                                    <Button
                                        className={cn(
                                            "w-full gap-2",
                                            quiz.status === "pending" && "gradient-bg border-0"
                                        )}
                                        variant={quiz.status === "pending" ? "default" : "outline"}
                                    >
                                        <Play className="h-4 w-4" />
                                        {quiz.status === "pending" ? "Iniciar Quiz" : "Refazer Quiz"}
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}
