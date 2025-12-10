"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Users,
    GraduationCap,
    Calendar,
    Loader2,
    BookOpen,
    Play,
    Award,
    Clock,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
};

const statusLabels: Record<string, { label: string; color: string }> = {
    active: { label: "Em Andamento", color: "text-blue-500" },
    pending: { label: "Aguardando Aprovação", color: "text-amber-500" },
    completed: { label: "Concluída", color: "text-emerald-500" },
    dropped: { label: "Desistente", color: "text-red-500" },
};

export default function StudentClassesPage() {
    // Get classes where user is enrolled
    const classes = useQuery(api.classes.getByStudent, {});

    const isLoading = classes === undefined;

    // Separate by status
    const activeClasses = (classes ?? []).filter((c: any) => c.enrollmentStatus === "active");
    const pendingClasses = (classes ?? []).filter((c: any) => c.enrollmentStatus === "pending");
    const completedClasses = (classes ?? []).filter((c: any) => c.enrollmentStatus === "completed");

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item}>
                <h1 className="text-2xl md:text-3xl font-bold">Minhas Turmas</h1>
                <p className="text-muted-foreground">Acompanhe seu progresso nas turmas em que está inscrito</p>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{activeClasses.length}</p>
                                <p className="text-sm text-muted-foreground">Em Andamento</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Award className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{completedClasses.length}</p>
                                <p className="text-sm text-muted-foreground">Concluídas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{pendingClasses.length}</p>
                                <p className="text-sm text-muted-foreground">Aguardando</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (classes ?? []).length === 0 ? (
                <motion.div variants={item} className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Você ainda não está inscrito em nenhuma turma</h3>
                    <p className="text-muted-foreground mb-4">
                        Você pode ser inscrito por um professor ou usar um link de matrícula
                    </p>
                    <Link href="/student/courses">
                        <Button className="gap-2">
                            <BookOpen className="h-4 w-4" />
                            Explorar Cursos
                        </Button>
                    </Link>
                </motion.div>
            ) : (
                <div className="space-y-6">
                    {/* Pending Classes */}
                    {pendingClasses.length > 0 && (
                        <motion.div variants={item}>
                            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-amber-500" />
                                Aguardando Aprovação
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {pendingClasses.map((cls: any) => (
                                    <Card key={cls._id} className="border-amber-500/30">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                                    <Clock className="h-6 w-6 text-amber-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-medium">{cls.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{cls.course?.title}</p>
                                                    <Badge variant="secondary" className="mt-2">
                                                        Aguardando aprovação do professor
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Active Classes */}
                    {activeClasses.length > 0 && (
                        <motion.div variants={item}>
                            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                Em Andamento
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {activeClasses.map((cls: any) => (
                                    <Card key={cls._id} className="hover:shadow-lg transition-all overflow-hidden">
                                        {/* Header */}
                                        <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 relative">
                                            {cls.course?.thumbnail ? (
                                                <img
                                                    src={cls.course.thumbnail}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <BookOpen className="h-12 w-12 text-primary/40" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <h3 className="font-semibold text-white line-clamp-1">{cls.name}</h3>
                                                <p className="text-sm text-white/80 line-clamp-1">{cls.course?.title}</p>
                                            </div>
                                        </div>

                                        <CardContent className="p-4 space-y-4">
                                            {/* Progress */}
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-muted-foreground">Progresso</span>
                                                    <span className="font-medium">{cls.progressPercent}%</span>
                                                </div>
                                                <Progress value={cls.progressPercent} className="h-2" />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {cls.completedLessons} de {cls.totalLessons} aulas concluídas
                                                </p>
                                            </div>

                                            {/* Info */}
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {formatDate(cls.startDate)}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <Link href={`/student/classes/${cls._id}/learn`}>
                                                <Button className="w-full gap-2 gradient-bg border-0">
                                                    <Play className="h-4 w-4" />
                                                    Continuar Estudando
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Completed Classes */}
                    {completedClasses.length > 0 && (
                        <motion.div variants={item}>
                            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Award className="h-5 w-5 text-emerald-500" />
                                Concluídas
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {completedClasses.map((cls: any) => (
                                    <Card key={cls._id} className="border-emerald-500/30">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                    <Award className="h-6 w-6 text-emerald-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-medium">{cls.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{cls.course?.title}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/50">
                                                            100% Concluído
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
