"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactPlayer from "react-player/youtube";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    ChevronLeft,
    ChevronRight,
    Menu,
    Play,
    Pause,
    CheckCircle2,
    Circle,
    Clock,
    BookOpen,
    ArrowLeft,
    Lock,
    ThumbsUp,
    MessageSquare,
    Download,
    Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Mock course data
const mockCourse = {
    id: "1",
    title: "Next.js 14 - O Curso Completo",
    instructor: "João Silva",
    modules: [
        {
            id: "m1",
            title: "Introdução ao Next.js",
            lessons: [
                {
                    id: "l1",
                    title: "Bem-vindo ao curso",
                    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    duration: 180, // 3 min
                    isCompleted: true,
                    isFree: true,
                },
                {
                    id: "l2",
                    title: "O que é Next.js?",
                    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    duration: 420, // 7 min
                    isCompleted: true,
                    isFree: true,
                },
                {
                    id: "l3",
                    title: "Instalação e Setup",
                    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    duration: 600, // 10 min
                    isCompleted: false,
                    isFree: false,
                },
            ],
        },
        {
            id: "m2",
            title: "Fundamentos do App Router",
            lessons: [
                {
                    id: "l4",
                    title: "Estrutura de pastas",
                    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    duration: 540,
                    isCompleted: false,
                    isFree: false,
                },
                {
                    id: "l5",
                    title: "Páginas e Layouts",
                    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    duration: 720,
                    isCompleted: false,
                    isFree: false,
                },
                {
                    id: "l6",
                    title: "Rotas dinâmicas",
                    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    duration: 480,
                    isCompleted: false,
                    isFree: false,
                },
            ],
        },
        {
            id: "m3",
            title: "Server Components",
            lessons: [
                {
                    id: "l7",
                    title: "O que são Server Components?",
                    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    duration: 600,
                    isCompleted: false,
                    isFree: false,
                },
                {
                    id: "l8",
                    title: "Client vs Server",
                    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    duration: 540,
                    isCompleted: false,
                    isFree: false,
                },
            ],
        },
    ],
};

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function CourseSidebar({
    course,
    currentLessonId,
    onSelectLesson,
}: {
    course: typeof mockCourse;
    currentLessonId: string;
    onSelectLesson: (lessonId: string) => void;
}) {
    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const completedLessons = course.modules.reduce(
        (acc, m) => acc + m.lessons.filter((l) => l.isCompleted).length,
        0
    );
    const progress = Math.round((completedLessons / totalLessons) * 100);

    return (
        <div className="h-full flex flex-col bg-card">
            {/* Course Header */}
            <div className="p-4 border-b">
                <Link
                    href="/student/courses"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar aos cursos
                </Link>
                <h2 className="font-semibold line-clamp-2">{course.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{course.instructor}</p>

                {/* Progress */}
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                        {completedLessons} de {totalLessons} aulas concluídas
                    </p>
                </div>
            </div>

            {/* Modules & Lessons */}
            <ScrollArea className="flex-1">
                <div className="p-2">
                    {course.modules.map((module, moduleIndex) => (
                        <div key={module.id} className="mb-2">
                            {/* Module Header */}
                            <div className="px-3 py-2 bg-muted/50 rounded-lg mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Módulo {moduleIndex + 1}
                                    </span>
                                </div>
                                <h3 className="font-medium text-sm">{module.title}</h3>
                            </div>

                            {/* Lessons */}
                            <div className="space-y-1">
                                {module.lessons.map((lesson, lessonIndex) => {
                                    const isActive = lesson.id === currentLessonId;

                                    return (
                                        <button
                                            key={lesson.id}
                                            onClick={() => onSelectLesson(lesson.id)}
                                            className={cn(
                                                "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all",
                                                isActive
                                                    ? "bg-primary/10 border border-primary/20"
                                                    : "hover:bg-muted/50"
                                            )}
                                        >
                                            <div className="mt-0.5">
                                                {lesson.isCompleted ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                ) : isActive ? (
                                                    <Play className="h-4 w-4 text-primary fill-primary" />
                                                ) : (
                                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className={cn(
                                                        "text-sm font-medium line-clamp-2",
                                                        lesson.isCompleted && "text-muted-foreground"
                                                    )}
                                                >
                                                    {lessonIndex + 1}. {lesson.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDuration(lesson.duration)}
                                                    </span>
                                                    {lesson.isFree && (
                                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                            Grátis
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

export default function CoursePlayerPage({
    params,
}: {
    params: { courseId: string };
}) {
    const [currentLessonId, setCurrentLessonId] = useState("l3");
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const playerRef = useRef<ReactPlayer>(null);

    // Find current lesson
    const currentLesson = mockCourse.modules
        .flatMap((m) => m.lessons)
        .find((l) => l.id === currentLessonId);

    // Get all lessons flat
    const allLessons = mockCourse.modules.flatMap((m) => m.lessons);
    const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    const handleProgress = (state: { played: number }) => {
        setProgress(state.played * 100);

        // Mark as completed when 90% watched
        if (state.played >= 0.9 && currentLesson && !currentLesson.isCompleted) {
            // TODO: Call Convex mutation to mark as completed
            console.log("Lesson completed:", currentLessonId);
        }
    };

    const handleSelectLesson = (lessonId: string) => {
        setCurrentLessonId(lessonId);
        setProgress(0);
        setMobileMenuOpen(false);
    };

    return (
        <div className="fixed inset-0 bg-background flex">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-80 border-r">
                <CourseSidebar
                    course={mockCourse}
                    currentLessonId={currentLessonId}
                    onSelectLesson={handleSelectLesson}
                />
            </div>

            {/* Mobile Sidebar */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent side="left" className="w-80 p-0">
                    <CourseSidebar
                        course={mockCourse}
                        currentLessonId={currentLessonId}
                        onSelectLesson={handleSelectLesson}
                    />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <div className="h-14 border-b flex items-center justify-between px-4 bg-card">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <div className="hidden sm:block">
                            <h1 className="font-medium line-clamp-1">{currentLesson?.title}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                            <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Video Player */}
                <div className="flex-1 relative bg-black">
                    {currentLesson && (
                        <ReactPlayer
                            ref={playerRef}
                            url={currentLesson.videoUrl}
                            width="100%"
                            height="100%"
                            playing={isPlaying}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onProgress={handleProgress}
                            controls
                            config={{
                                youtube: {
                                    playerVars: {
                                        modestbranding: 1,
                                        rel: 0,
                                    },
                                },
                            }}
                        />
                    )}
                </div>

                {/* Bottom Navigation */}
                <div className="h-16 border-t flex items-center justify-between px-4 bg-card">
                    <Button
                        variant="outline"
                        disabled={!prevLesson}
                        onClick={() => prevLesson && handleSelectLesson(prevLesson.id)}
                        className="gap-2"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Aula Anterior</span>
                    </Button>

                    <div className="flex items-center gap-4">
                        {/* Progress Indicator */}
                        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                                Aula {currentIndex + 1} de {allLessons.length}
                            </span>
                        </div>

                        {/* Mark as Complete Button */}
                        <Button
                            variant={currentLesson?.isCompleted ? "outline" : "default"}
                            className={cn(!currentLesson?.isCompleted && "gradient-bg border-0")}
                        >
                            {currentLesson?.isCompleted ? (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Concluída
                                </>
                            ) : (
                                <>
                                    <Circle className="h-4 w-4 mr-2" />
                                    Marcar como Concluída
                                </>
                            )}
                        </Button>
                    </div>

                    <Button
                        variant="outline"
                        disabled={!nextLesson}
                        onClick={() => nextLesson && handleSelectLesson(nextLesson.id)}
                        className="gap-2"
                    >
                        <span className="hidden sm:inline">Próxima Aula</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
