"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Trophy,
    Clock,
    CheckCircle2,
    XCircle,
    Play,
    BookOpen,
    Target,
    AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";

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

export default function StudentQuizzesPage() {
    const { user, isLoading: isUserLoading } = useCurrentUser();

    const quizzesData = useQuery(
        api.quizzes.getStudentQuizzes,
        user ? { userId: user._id } : "skip"
    );

    const isLoading = isUserLoading || quizzesData === undefined;

    // Stats for display
    const stats = quizzesData
        ? [
            { label: "Provas Disponíveis", value: String(quizzesData.stats.available), icon: BookOpen, color: "text-primary" },
            { label: "Concluídos", value: String(quizzesData.stats.completed), icon: CheckCircle2, color: "text-emerald-500" },
            { label: "Taxa de Aprovação", value: `${quizzesData.stats.approvalRate}%`, icon: Target, color: "text-amber-500" },
            { label: "Melhor Nota", value: `${quizzesData.stats.bestScore}%`, icon: Trophy, color: "text-violet-500" },
        ]
        : [];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-72" />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardContent className="pt-6">
                                <Skeleton className="h-16 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="space-y-4">
                    <Skeleton className="h-6 w-40" />
                    <div className="grid gap-4 md:grid-cols-2">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i}>
                                <CardContent className="pt-6">
                                    <Skeleton className="h-40 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const quizzes = quizzesData?.quizzes || [];

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={item}>
                <h1 className="text-2xl md:text-3xl font-bold">Provas</h1>
                <p className="text-muted-foreground">
                    Teste seus conhecimentos com provas interativas
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
                <h2 className="text-lg font-semibold">Provas Disponíveis</h2>

                {quizzes.length === 0 ? (
                    <Card className="p-8">
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Nenhuma prova disponível</h3>
                                <p className="text-muted-foreground text-sm">
                                    Matricule-se em cursos para ter acesso às provas disponíveis.
                                </p>
                            </div>
                            <Link href="/student/courses">
                                <Button className="gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    Explorar Cursos
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {quizzes.map((quiz) => (
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
                                                {quiz.courseName}
                                                {quiz.lessonName && ` • ${quiz.lessonName}`}
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
                                        {quiz.timeLimit && (
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                {quiz.timeLimit} min
                                            </div>
                                        )}
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
                                                {quiz.attempts} tentativa{quiz.attempts !== 1 && "s"}
                                                {quiz.lastAttempt && ` • Última: ${quiz.lastAttempt}`}
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
                                            {quiz.status === "pending" ? "Iniciar Prova" : "Refazer Prova"}
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
