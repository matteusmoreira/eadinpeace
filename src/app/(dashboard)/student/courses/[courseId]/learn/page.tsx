"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactPlayer from "react-player";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet";
import {
    ChevronLeft,
    ChevronRight,
    Menu,
    Play,
    CheckCircle2,
    Circle,
    Clock,
    ArrowLeft,
    ThumbsUp,
    MessageSquare,
    Share2,
    Loader2,
    Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { BunnyPlayer } from "@/components/bunny-player";
import { useContentProtection } from "@/hooks/useContentProtection";
import { LessonCompletedCelebration } from "@/components/lesson-completed-celebration";


// Cast ReactPlayer to any to avoid type errors
const ReactPlayerAny = ReactPlayer as any;

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface Lesson {
    _id: Id<"lessons">;
    title: string;
    videoUrl?: string;
    videoProvider?: "youtube" | "bunny" | "upload";
    duration: number;
    isFree: boolean;
    isPublished: boolean;
    order: number;
    isCompleted?: boolean;
}

interface Module {
    _id: Id<"modules">;
    title: string;
    description?: string;
    order: number;
    lessons: Lesson[];
}

interface CourseWithContent {
    _id: Id<"courses">;
    title: string;
    instructor?: { firstName: string; lastName: string } | null;
    modules: Module[];
    duration: number;
}

function CourseSidebar({
    course,
    currentLessonId,
    onSelectLesson,
    completedLessons,
    progress,
}: {
    course: CourseWithContent;
    currentLessonId: string | null;
    onSelectLesson: (lessonId: string) => void;
    completedLessons: string[];
    progress: number;
}) {
    const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
    const completedCount = completedLessons.length;

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
                {course.instructor && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {course.instructor.firstName} {course.instructor.lastName}
                    </p>
                )}

                {/* Progress */}
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                        {completedCount} de {totalLessons} aulas concluídas
                    </p>
                </div>
            </div>

            {/* Modules & Lessons */}
            <ScrollArea className="flex-1">
                <div className="p-2">
                    {course.modules?.map((module, moduleIndex) => (
                        <div key={module._id} className="mb-2">
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
                                {module.lessons?.map((lesson, lessonIndex) => {
                                    const isActive = lesson._id === currentLessonId;
                                    const isCompleted = completedLessons.includes(lesson._id);

                                    return (
                                        <button
                                            key={lesson._id}
                                            onClick={() => onSelectLesson(lesson._id)}
                                            className={cn(
                                                "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all",
                                                isActive
                                                    ? "bg-primary/10 border border-primary/20"
                                                    : "hover:bg-muted/50"
                                            )}
                                        >
                                            <div className="mt-0.5">
                                                {isCompleted ? (
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
                                                        isCompleted && "text-muted-foreground"
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

export default function CoursePlayerPage() {
    const params = useParams();
    const courseId = params.courseId as Id<"courses">;
    const { user } = useUser();

    const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoProgress, setVideoProgress] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMarkingComplete, setIsMarkingComplete] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [completedLessonTitle, setCompletedLessonTitle] = useState("");
    const playerRef = useRef<any>(null);

    // Aplicar proteção de conteúdo na página
    useContentProtection({
        disableRightClick: true,
        disableKeyboardShortcuts: true,
        disableTextSelection: true,
        disableDrag: true,
    }, true);


    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get course with content
    const course = useQuery(api.courses.getWithContent, { courseId });

    // Get enrollment and progress
    const enrollment = useQuery(
        api.enrollments.getByUserAndCourse,
        convexUser?._id ? { userId: convexUser._id, courseId } : "skip"
    );

    const courseProgress = useQuery(
        api.enrollments.getCourseProgress,
        convexUser?._id ? { userId: convexUser._id, courseId } : "skip"
    );

    // Mutations
    const updateLessonProgress = useMutation(api.enrollments.updateLessonProgress);
    const updateStreak = useMutation(api.enrollments.updateStreak);

    // Set initial lesson
    useEffect(() => {
        if (course?.modules && !currentLessonId) {
            const firstLesson = course.modules[0]?.lessons?.[0];
            if (firstLesson) {
                setCurrentLessonId(firstLesson._id);
            }
        }
    }, [course, currentLessonId]);

    if (!course || !convexUser) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Get all lessons flat
    const allLessons = course.modules?.flatMap((m) => m.lessons || []) || [];
    const currentLesson = allLessons.find((l) => l._id === currentLessonId);
    const currentIndex = allLessons.findIndex((l) => l._id === currentLessonId);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    // Completed lessons from enrollment
    const completedLessons = enrollment?.completedLessons?.map(id => id.toString()) || [];
    const isCurrentLessonCompleted = currentLessonId ? completedLessons.includes(currentLessonId) : false;
    const progress = enrollment?.progress || 0;

    const handleProgress = async (state: { played: number; playedSeconds: number }) => {
        setVideoProgress(state.played * 100);

        // Auto-mark as completed when 90% watched
        if (state.played >= 0.9 && currentLesson && !isCurrentLessonCompleted && convexUser) {
            try {
                await updateLessonProgress({
                    userId: convexUser._id,
                    lessonId: currentLesson._id,
                    courseId,
                    watchedSeconds: Math.floor(state.playedSeconds),
                    isCompleted: true,
                });
                await updateStreak({ userId: convexUser._id });
                // Mostrar celebração em vez de apenas toast
                setCompletedLessonTitle(currentLesson.title);
                setShowCelebration(true);
            } catch (error) {
                console.error("Error updating progress:", error);
            }
        }
    };

    const handleMarkComplete = async () => {
        if (!currentLesson || !convexUser || isCurrentLessonCompleted) return;

        setIsMarkingComplete(true);
        try {
            await updateLessonProgress({
                userId: convexUser._id,
                lessonId: currentLesson._id,
                courseId,
                watchedSeconds: currentLesson.duration,
                isCompleted: true,
            });
            await updateStreak({ userId: convexUser._id });
            // Mostrar celebração em vez de apenas toast
            setCompletedLessonTitle(currentLesson.title);
            setShowCelebration(true);
        } catch (error) {
            toast.error("Erro ao marcar aula como concluída");
        } finally {
            setIsMarkingComplete(false);
        }
    };

    const handleSelectLesson = (lessonId: string) => {
        setCurrentLessonId(lessonId);
        setVideoProgress(0);
        setMobileMenuOpen(false);
    };

    const handleGoToNextLesson = () => {
        if (nextLesson) {
            handleSelectLesson(nextLesson._id);
        }
    };

    // Check if course is complete
    const isCourseComplete = progress === 100;

    return (
        <div className="fixed inset-0 bg-background flex">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-80 border-r">
                <CourseSidebar
                    course={course}
                    currentLessonId={currentLessonId}
                    onSelectLesson={handleSelectLesson}
                    completedLessons={completedLessons}
                    progress={progress}
                />
            </div>

            {/* Mobile Sidebar */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent side="left" className="w-80 p-0">
                    <CourseSidebar
                        course={course}
                        currentLessonId={currentLessonId}
                        onSelectLesson={handleSelectLesson}
                        completedLessons={completedLessons}
                        progress={progress}
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
                        {isCourseComplete && (
                            <Link href="/student/certificates">
                                <Button variant="outline" className="gap-2 text-emerald-600 border-emerald-600">
                                    <Award className="h-4 w-4" />
                                    Ver Certificado
                                </Button>
                            </Link>
                        )}
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
                    {currentLesson?.videoUrl ? (
                        // Check if it's a Bunny Stream video
                        (currentLesson as any).videoProvider === "bunny" ? (
                            <div className="absolute inset-0">
                                <BunnyPlayer
                                    videoId={currentLesson.videoUrl}
                                    title={currentLesson.title}
                                    autoplay={isPlaying}
                                    controls={true}
                                    className="w-full h-full border-0"
                                />
                            </div>
                        ) : (
                            <ReactPlayerAny
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
                        )
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                            <div className="text-center">
                                <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg opacity-75">Vídeo não disponível</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Navigation */}
                <div className="h-16 border-t flex items-center justify-between px-4 bg-card">
                    <Button
                        variant="outline"
                        disabled={!prevLesson}
                        onClick={() => prevLesson && handleSelectLesson(prevLesson._id)}
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
                            variant={isCurrentLessonCompleted ? "outline" : "default"}
                            className={cn(!isCurrentLessonCompleted && "gradient-bg border-0")}
                            onClick={handleMarkComplete}
                            disabled={isCurrentLessonCompleted || isMarkingComplete}
                        >
                            {isMarkingComplete ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : isCurrentLessonCompleted ? (
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
                        onClick={() => nextLesson && handleSelectLesson(nextLesson._id)}
                        className="gap-2"
                    >
                        <span className="hidden sm:inline">Próxima Aula</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Modal de celebração quando aula é concluída */}
            <LessonCompletedCelebration
                isOpen={showCelebration}
                onClose={() => setShowCelebration(false)}
                lessonTitle={completedLessonTitle}
                nextLessonTitle={nextLesson?.title}
                onNextLesson={handleGoToNextLesson}
                courseProgress={progress}
            />
        </div>
    );
}
