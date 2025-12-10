"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
    Award,
    Clock,
    CheckCircle,
    XCircle,
    Play,
    FileText,
    Video,
    HelpCircle,
    Calendar,
    TrendingUp,
    Target,
    Edit3,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
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
    quiz: HelpCircle,
    exam: HelpCircle,
    assignment: FileText,
};

export default function StudentProgressPage() {
    const params = useParams();
    const pathname = usePathname();
    const classId = params.classId as Id<"classes">;
    const userId = params.userId as Id<"users">;

    const [gradeDialog, setGradeDialog] = useState<{
        lessonId: Id<"lessons">;
        lessonTitle: string;
        currentScore?: number;
        currentFeedback?: string;
    } | null>(null);
    const [gradeForm, setGradeForm] = useState({ score: "", feedback: "" });

    // Determine base path (admin or professor)
    const isAdmin = pathname.includes("/admin/");
    const basePath = isAdmin ? "/admin" : "/professor";

    // Queries
    const progressData = useQuery(api.classes.getStudentProgress, { classId, userId });
    const classDetails = useQuery(api.classes.getById, { classId });

    // Mutations
    const gradeStudent = useMutation(api.classes.gradeStudent);

    const isLoading = progressData === undefined || classDetails === undefined;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!progressData || !classDetails) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-bold mb-2">Dados não encontrados</h2>
                <Link href={`${basePath}/classes/${classId}`}>
                    <Button>Voltar à turma</Button>
                </Link>
            </div>
        );
    }

    const handleGrade = async () => {
        if (!gradeDialog) return;

        const score = parseInt(gradeForm.score);
        if (isNaN(score) || score < 0 || score > 100) {
            toast.error("A nota deve ser entre 0 e 100");
            return;
        }

        try {
            await gradeStudent({
                classId,
                userId,
                lessonId: gradeDialog.lessonId,
                score,
                feedback: gradeForm.feedback || undefined,
            });
            toast.success("Nota salva com sucesso!");
            setGradeDialog(null);
            setGradeForm({ score: "", feedback: "" });
        } catch (error: any) {
            toast.error(error.message || "Erro ao salvar nota");
        }
    };

    const openGradeDialog = (lesson: any) => {
        setGradeDialog({
            lessonId: lesson._id,
            lessonTitle: lesson.title,
            currentScore: lesson.score,
            currentFeedback: lesson.progress?.feedback,
        });
        setGradeForm({
            score: lesson.score?.toString() || "",
            feedback: lesson.progress?.feedback || "",
        });
    };

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

    const user = progressData.user;
    const modules = progressData.modules || [];

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Header */}
            <motion.div variants={item} className="flex items-center gap-4">
                <Link href={`${basePath}/classes/${classId}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold">Progresso do Aluno</h1>
                    <p className="text-muted-foreground">
                        Turma: {classDetails.name}
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
                                    <Badge
                                        variant={progressData.enrollment?.status === "active" ? "default" : "secondary"}
                                        className="mt-2"
                                    >
                                        {progressData.enrollment?.status === "active" ? "Ativo" :
                                            progressData.enrollment?.status === "completed" ? "Concluído" : "Pendente"}
                                    </Badge>
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
                                                    const isGradable = ["quiz", "exam", "assignment"].includes(lesson.type);

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
                                                                                lesson.type === "quiz" ? "Quiz" :
                                                                                    lesson.type === "exam" ? "Prova" : "Tarefa"}
                                                                    </Badge>
                                                                    {lesson.progress?.lastAccessedAt && (
                                                                        <span>
                                                                            Último acesso: {formatDateTime(lesson.progress.lastAccessedAt)}
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
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => openGradeDialog(lesson)}
                                                                    >
                                                                        <Edit3 className="h-4 w-4" />
                                                                    </Button>
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

            {/* Grade Dialog */}
            <Dialog open={!!gradeDialog} onOpenChange={() => setGradeDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Avaliar Atividade</DialogTitle>
                        <DialogDescription>
                            {gradeDialog?.lessonTitle}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="score">Nota (0-100)</Label>
                            <Input
                                id="score"
                                type="number"
                                min={0}
                                max={100}
                                placeholder="Digite a nota"
                                value={gradeForm.score}
                                onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="feedback">Feedback (opcional)</Label>
                            <Textarea
                                id="feedback"
                                placeholder="Comentários sobre o desempenho do aluno..."
                                value={gradeForm.feedback}
                                onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGradeDialog(null)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleGrade} className="gap-2">
                            <Award className="h-4 w-4" />
                            Salvar Nota
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
