"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    ArrowLeft,
    Play,
    Circle,
    Clock,
    BookOpen,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    Eye,
    AlertCircle,
} from "lucide-react";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { ProtectedYouTubePlayer } from "@/components/ProtectedYouTubePlayer";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function CoursePreviewPage(props: { params: Promise<{ courseId: string }> }) {
    const params = use(props.params);
    const courseId = params.courseId as Id<"courses">;

    const [currentLessonId, setCurrentLessonId] = useState<Id<"lessons"> | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Get course with content
    const course = useQuery(api.courses.getWithContent, { courseId });

    // Set first lesson when course loads
    useEffect(() => {
        if (course?.modules?.length && !currentLessonId) {
            const firstModule = course.modules[0];
            if (firstModule?.lessons?.length) {
                setCurrentLessonId(firstModule.lessons[0]._id);
            }
        }
    }, [course, currentLessonId]);

    // Loading state
    if (course === undefined) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Carregando preview...</p>
            </div>
        );
    }

    // Course not found
    if (course === null) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Curso não encontrado</h2>
                <p className="text-muted-foreground">O curso solicitado não existe ou você não tem permissão para acessá-lo.</p>
                <Link href="/professor/courses">
                    <Button>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar para Meus Cursos
                    </Button>
                </Link>
            </div>
        );
    }

    // Find current lesson
    const allLessons = course.modules?.flatMap(m => m.lessons || []) || [];
    const currentLesson = allLessons.find(l => l._id === currentLessonId);
    const currentLessonIndex = allLessons.findIndex(l => l._id === currentLessonId);

    const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
    const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

    const totalLessons = allLessons.length;

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Preview Banner */}
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
                <div className="flex items-center justify-center gap-2 text-amber-600">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">Modo Preview - Visualização como aluno</span>
                </div>
            </div>

            {/* Top Bar */}
            <div className="h-14 border-b flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <Link href={`/professor/courses/${courseId}`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="hidden md:block">
                        <div className="flex items-center gap-2">
                            <h1 className="font-semibold text-sm line-clamp-1">{course.title}</h1>
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                                Preview
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{course.modules?.length || 0} módulos • {totalLessons} aulas</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link href={`/professor/courses/${courseId}`}>
                        <Button variant="outline" size="sm">
                            Voltar para Edição
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Video Player */}
                <div className={cn(
                    "flex-1 flex flex-col",
                    sidebarOpen && "hidden md:flex"
                )}>
                    {/* Video */}
                    <div className="flex-1 bg-black flex items-center justify-center relative">
                        {currentLesson?.videoUrl ? (
                            <ProtectedYouTubePlayer
                                videoUrl={currentLesson.videoUrl}
                                title={currentLesson.title}
                                className="absolute inset-0 w-full h-full"
                                protectionEnabled={true}
                                youtubeParams={{
                                    modestbranding: true,
                                    rel: false,
                                    controls: true,
                                }}
                            />
                        ) : (
                            <div className="text-center text-white">
                                <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">Vídeo não disponível</p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Adicione uma URL de vídeo do YouTube a esta aula
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="p-4 border-t bg-card">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold">{currentLesson?.title || "Selecione uma aula"}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {currentLesson?.description || "Sem descrição"}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">Preview</span>
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <Button
                                variant="outline"
                                disabled={!prevLesson}
                                onClick={() => prevLesson && setCurrentLessonId(prevLesson._id)}
                                className="gap-2"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Anterior
                            </Button>
                            <Button
                                disabled={!nextLesson}
                                onClick={() => nextLesson && setCurrentLessonId(nextLesson._id)}
                                className="gap-2"
                            >
                                Próxima
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Lessons */}
                <div className={cn(
                    "w-full md:w-80 border-l bg-card flex flex-col",
                    !sidebarOpen && "hidden md:flex"
                )}>
                    <div className="p-4 border-b">
                        <h3 className="font-semibold">Conteúdo do Curso</h3>
                        <p className="text-sm text-muted-foreground">
                            {totalLessons} aulas no total
                        </p>
                    </div>

                    <ScrollArea className="flex-1">
                        {course.modules?.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">
                                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Nenhum módulo adicionado</p>
                                <p className="text-xs mt-1">Adicione módulos e aulas ao curso</p>
                            </div>
                        ) : (
                            <Accordion type="multiple" defaultValue={course.modules?.map(m => m._id) || []} className="p-2">
                                {course.modules?.map((module, index) => (
                                    <AccordionItem key={module._id} value={module._id} className="border rounded-lg mb-2">
                                        <AccordionTrigger className="px-3 hover:no-underline">
                                            <div className="flex items-center gap-2 text-left">
                                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                    {index + 1}
                                                </div>
                                                <span className="text-sm font-medium">{module.title}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-3 pb-3">
                                            <div className="space-y-1">
                                                {module.lessons?.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground py-2 text-center">
                                                        Nenhuma aula neste módulo
                                                    </p>
                                                ) : (
                                                    module.lessons?.map((lesson) => {
                                                        const isActive = lesson._id === currentLessonId;

                                                        return (
                                                            <button
                                                                key={lesson._id}
                                                                onClick={() => {
                                                                    setCurrentLessonId(lesson._id);
                                                                    setSidebarOpen(false);
                                                                }}
                                                                className={cn(
                                                                    "w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors text-sm",
                                                                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                                                )}
                                                            >
                                                                <Circle className="h-4 w-4 shrink-0" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="line-clamp-1">{lesson.title}</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className={cn(
                                                                            "text-xs",
                                                                            isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                                                                        )}>
                                                                            {Math.floor(lesson.duration / 60)}min
                                                                        </p>
                                                                        {lesson.isFree && (
                                                                            <Badge variant="secondary" className="text-xs h-4">
                                                                                Grátis
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        )}
                    </ScrollArea>

                    {/* Info Footer */}
                    <div className="p-4 border-t bg-muted/30">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            <span>Esta é uma visualização do professor. Os alunos verão o progresso e marcações de conclusão.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
