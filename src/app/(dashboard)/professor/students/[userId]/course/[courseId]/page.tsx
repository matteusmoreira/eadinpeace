"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    ArrowLeft,
    Loader2,
    BookOpen,
    CheckCircle,
    FileText,
    Video,
    HelpCircle,
    TrendingUp,
    Target,
    Clock,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
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

const lessonTypeIcons: Record<string, any> = {
    video: Video,
    text: FileText,
    pdf: FileText,
    exam: HelpCircle,
    assignment: FileText,
};

export default function StudentCourseProgressPage() {
    const params = useParams();
    const userId = params.userId as Id<"users">;
    const courseId = params.courseId as Id<"courses">;

    // Queries
    const progressData = useQuery(api.enrollments.getStudentCourseDetails, { userId, courseId });
    const course = useQuery(api.courses.getById, { courseId });

    if (progressData === undefined || course === undefined) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (progressData === null || course === null) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-bold mb-2">Dados não encontrados</h2>
                <Link href="/professor/students">
                    <Button>Voltar para Meus Alunos</Button>
                </Link>
            </div>
        );
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatDateTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const user = progressData.student;
    const modules = progressData.modules || [];
    const enrollment = progressData.enrollment;

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Header */}
            <motion.div variants={item} className="flex items-center gap-4">
                <Link href="/professor/students">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold">Progresso do Aluno</h1>
                    <p className="text-muted-foreground">
                        Curso: {course.title}
                    </p>
                </div>
            </motion.div>

            {/* Student Info */}
            <motion.div variants={item}>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={user.imageUrl} />
                                    <AvatarFallback className="text-2xl">
                                        {user.firstName?.[0] || ""}
                                        {user.lastName?.[0] || ""}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-xl font-bold">
                                        {user.firstName} {user.lastName}
                                    </h2>
                                    <p className="text-muted-foreground">{user.email}</p>
                                    <div className="flex gap-2 mt-2">
                                        <Badge variant={enrollment?.completedAt ? "default" : "secondary"}>
                                            {enrollment?.completedAt ? "Concluído" : "Em andamento"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <Separator orientation="vertical" className="hidden md:block h-20" />

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                                <div className="text-center">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                                        <TrendingUp className="h-6 w-6 text-primary" />
                                    </div>
                                    <p className="text-2xl font-bold">{progressData.overallProgress}%</p>
                                    <p className="text-xs text-muted-foreground">Progresso</p>
                                </div>
                                <div className="text-center">
                                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                                        <CheckCircle className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <p className="text-2xl font-bold">{progressData.completedLessons}</p>
                                    <p className="text-xs text-muted-foreground">Aulas Concluídas</p>
                                </div>
                                <div className="text-center">
                                    <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
                                        <Target className="h-6 w-6 text-amber-500" />
                                    </div>
                                    <p className="text-2xl font-bold">{progressData.averageScore ?? "-"}</p>
                                    <p className="text-xs text-muted-foreground">Nota Média</p>
                                </div>
                                <div className="text-center">
                                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                                        <Clock className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <p className="text-2xl font-bold">
                                        {progressData.lastActivity ? formatDate(progressData.lastActivity) : "-"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Última Atividade</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Progress Overview */}
            <motion.div variants={item}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Progresso Geral
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>{progressData.completedLessons} de {progressData.totalLessons} aulas concluídas</span>
                                <span className="font-medium">{progressData.overallProgress}%</span>
                            </div>
                            <Progress value={progressData.overallProgress} className="h-3" />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Modules & Lessons */}
            <motion.div variants={item}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Detalhes por Módulo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {modules.map((module: any, index: number) => {
                                const ModuleIcon = module.completedLessons === module.totalLessons
                                    ? CheckCircle
                                    : BookOpen;

                                return (
                                    <AccordionItem key={module._id} value={module._id}>
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${module.completedLessons === module.totalLessons
                                                    ? "bg-emerald-500/10"
                                                    : "bg-primary/10"
                                                    }`}>
                                                    <ModuleIcon className={`h-4 w-4 ${module.completedLessons === module.totalLessons
                                                        ? "text-emerald-500"
                                                        : "text-primary"
                                                        }`} />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="font-medium">
                                                        Módulo {index + 1}: {module.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {module.completedLessons}/{module.totalLessons} aulas • {module.progressPercent}%
                                                    </p>
                                                </div>
                                                <Progress value={module.progressPercent} className="w-24 h-2 hidden md:block" />
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pl-11 space-y-2">
                                                {module.lessons?.map((lesson: any) => {
                                                    const LessonIcon = lessonTypeIcons[lesson.type] || FileText;
                                                    const isGradable = ["exam", "assignment"].includes(lesson.type);

                                                    return (
                                                        <div
                                                            key={lesson._id}
                                                            className={`flex items-center gap-3 p-3 rounded-lg ${lesson.isCompleted ? "bg-emerald-500/5" : "bg-muted/50"
                                                                }`}
                                                        >
                                                            <div className={`h-8 w-8 rounded flex items-center justify-center ${lesson.isCompleted ? "bg-emerald-500/10" : "bg-muted"
                                                                }`}>
                                                                {lesson.isCompleted ? (
                                                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                                ) : (
                                                                    <LessonIcon className="h-4 w-4 text-muted-foreground" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-medium text-sm">{lesson.title}</p>
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {lesson.type === "video" ? "Vídeo" :
                                                                            lesson.type === "text" ? "Texto" :
                                                                                lesson.type === "pdf" ? "PDF" :
                                                                                    lesson.type === "exam" ? "Prova" : "Tarefa"}
                                                                    </Badge>
                                                                    {lesson.lastAccessedAt && (
                                                                        <span>
                                                                            Último acesso: {formatDateTime(lesson.lastAccessedAt)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {isGradable && (
                                                                <div className="flex items-center gap-2">
                                                                    {lesson.score !== undefined ? (
                                                                        <Badge
                                                                            variant={lesson.score >= 70 ? "default" : "secondary"}
                                                                            className={lesson.score >= 70 ? "bg-emerald-500" : ""}
                                                                        >
                                                                            Nota: {lesson.score}
                                                                        </Badge>
                                                                    ) : lesson.isCompleted ? (
                                                                        <Badge variant="outline">Aguardando nota</Badge>
                                                                    ) : null}
                                                                </div>
                                                            )}
                                                            {!isGradable && lesson.isCompleted && (
                                                                <Badge variant="outline" className="text-emerald-500">
                                                                    Concluído
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>

                        {modules.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Nenhum módulo disponível</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
