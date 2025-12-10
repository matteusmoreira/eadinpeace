"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    Play,
    FileText,
    Video,
    HelpCircle,
    Lock,
    ChevronRight,
    Trophy,
    Target,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
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
    quiz: HelpCircle,
    exam: HelpCircle,
    assignment: FileText,
};

const lessonTypeLabels: Record<string, string> = {
    video: "Vídeo",
    text: "Leitura",
    quiz: "Quiz",
    exam: "Prova",
    assignment: "Tarefa",
};

export default function StudentClassLearnPage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.classId as Id<"classes">;

    const [selectedLesson, setSelectedLesson] = useState<any>(null);
    const [expandedModules, setExpandedModules] = useState<string[]>([]);

    // Queries
    const classDetails = useQuery(api.classes.getById, { classId });
    const studentProgress = useQuery(api.classes.getByStudent, {});

    const isLoading = classDetails === undefined || studentProgress === undefined;

    // Find current class enrollment
    const currentClass = (studentProgress as any[] ?? []).find((c: any) => c._id === classId);

    useEffect(() => {
        // Auto-expand first incomplete module
        if (currentClass && studentProgress) {
            // For now, expand first module
            const modules = (classDetails?.course as any)?.modules || [];
            if (modules.length > 0) {
                setExpandedModules([modules[0]._id]);
            }
        }
    }, [currentClass, classDetails, studentProgress]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!classDetails || !currentClass) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-bold mb-2">Turma não encontrada</h2>
                <Link href="/student/classes">
                    <Button>Voltar às turmas</Button>
                </Link>
            </div>
        );
    }

    const handleStartLesson = (lesson: any, moduleId: string) => {
        // Navigate to lesson page
        // For now, we'll redirect to the course learn page
        const courseId = classDetails.courseId;
        router.push(`/student/courses/${courseId}/learn?lessonId=${lesson._id}`);
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return "";
        const mins = Math.floor(seconds / 60);
        return `${mins} min`;
    };

    const course = classDetails.course as any;

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Header */}
            <motion.div variants={item} className="flex items-center gap-4">
                <Link href="/student/classes">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold">{classDetails.name}</h1>
                    <p className="text-muted-foreground">{course?.title}</p>
                </div>
            </motion.div>

            {/* Progress Overview */}
            <motion.div variants={item}>
                <Card className="overflow-hidden">
                    <div className="h-2 bg-primary/10">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                            style={{ width: `${currentClass.progressPercent}%` }}
                        />
                    </div>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Trophy className="h-5 w-5 text-amber-500" />
                                    <h3 className="font-semibold">Seu Progresso</h3>
                                </div>
                                <p className="text-3xl font-bold gradient-text">
                                    {currentClass.progressPercent}%
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {currentClass.completedLessons} de {currentClass.totalLessons} aulas concluídas
                                </p>
                            </div>

                            <Separator orientation="vertical" className="hidden md:block h-16" />

                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-1">
                                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <p className="text-lg font-bold">{currentClass.completedLessons}</p>
                                    <p className="text-xs text-muted-foreground">Concluídas</p>
                                </div>
                                <div>
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1">
                                        <BookOpen className="h-5 w-5 text-primary" />
                                    </div>
                                    <p className="text-lg font-bold">{currentClass.totalLessons - currentClass.completedLessons}</p>
                                    <p className="text-xs text-muted-foreground">Restantes</p>
                                </div>
                                <div>
                                    <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-1">
                                        <Target className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <p className="text-lg font-bold">{currentClass.totalLessons}</p>
                                    <p className="text-xs text-muted-foreground">Total</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Course Content */}
            <motion.div variants={item}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Conteúdo do Curso
                        </CardTitle>
                        <CardDescription>
                            Clique em uma aula para começar a estudar
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Placeholder - In a real implementation, we'd fetch modules and lessons */}
                        <div className="space-y-4">
                            <div className="text-center py-8">
                                <BookOpen className="h-16 w-16 text-primary/30 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Acesse o Curso Completo</h3>
                                <p className="text-muted-foreground mb-4">
                                    Continue seus estudos acessando o conteúdo do curso
                                </p>
                                <Link href={`/student/courses/${classDetails.courseId}/learn`}>
                                    <Button className="gap-2 gradient-bg border-0">
                                        <Play className="h-4 w-4" />
                                        Continuar Estudando
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Class Info */}
            <motion.div variants={item}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Informações da Turma</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Data de Início</p>
                                <p className="font-medium">
                                    {new Date(classDetails.startDate).toLocaleDateString("pt-BR")}
                                </p>
                            </div>
                            {classDetails.endDate && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Data de Término</p>
                                    <p className="font-medium">
                                        {new Date(classDetails.endDate).toLocaleDateString("pt-BR")}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-muted-foreground">Inscrição</p>
                                <p className="font-medium">
                                    {new Date(currentClass.enrolledAt).toLocaleDateString("pt-BR")}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge variant={currentClass.enrollmentStatus === "active" ? "default" : "secondary"}>
                                    {currentClass.enrollmentStatus === "active" ? "Ativo" :
                                        currentClass.enrollmentStatus === "completed" ? "Concluído" : "Pendente"}
                                </Badge>
                            </div>
                        </div>

                        {classDetails.description && (
                            <>
                                <Separator className="my-4" />
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                                    <p className="text-sm">{classDetails.description}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Instructors */}
            {classDetails.instructors && (classDetails.instructors as any[]).length > 0 && (
                <motion.div variants={item}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Professores</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4">
                                {(classDetails.instructors as any[]).map((instructor: any) => (
                                    <div key={instructor._id} className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-sm font-medium">
                                                {instructor.user?.firstName?.[0] || ""}
                                                {instructor.user?.lastName?.[0] || ""}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">
                                                {instructor.user?.firstName} {instructor.user?.lastName}
                                            </p>
                                            <Badge variant="outline" className="text-xs">
                                                {instructor.role === "main" ? "Professor Principal" : "Auxiliar"}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </motion.div>
    );
}
