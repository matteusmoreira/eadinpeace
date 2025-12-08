"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    Play,
    Pause,
    CheckCircle2,
    Circle,
    Clock,
    BookOpen,
    Loader2,
    Lock,
    ChevronLeft,
    ChevronRight,
    Award,
    Menu,
    X,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CoursePlayerPage() {
    const params = useParams();
    const courseId = params.courseId as Id<"courses">;
    const { user } = useUser();

    const [currentLessonId, setCurrentLessonId] = useState<Id<"lessons"> | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get course with content
    const course = useQuery(api.courses.getWithContent, { courseId });

    // Get user's progress
    const progress = useQuery(
        api.enrollments.getCourseProgress,
        convexUser?._id ? { userId: convexUser._id, courseId } : "skip"
    );

    const updateProgress = useMutation(api.enrollments.updateLessonProgress);
    const updateStreak = useMutation(api.enrollments.updateStreak);

    // Set first lesson when course loads
    useEffect(() => {
        if (course?.modules?.length && !currentLessonId) {
            const firstModule = course.modules[0];
            if (firstModule?.lessons?.length) {
                setCurrentLessonId(firstModule.lessons[0]._id);
            }
        }
    }, [course, currentLessonId]);

    if (!course || !convexUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Find current lesson
    const allLessons = course.modules?.flatMap(m => m.lessons || []) || [];
    const currentLesson = allLessons.find(l => l._id === currentLessonId);
    const currentLessonIndex = allLessons.findIndex(l => l._id === currentLessonId);

    const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
    const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

    // Check if lesson is completed
    const isLessonCompleted = (lessonId: Id<"lessons">) => {
        return progress?.lessonsProgress?.some(lp => lp.lessonId === lessonId && lp.isCompleted) || false;
    };

    // Extract YouTube video ID
    const getYouTubeId = (url?: string) => {
        if (!url) return null;
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        return match ? match[1] : null;
    };

    const handleCompleteLesson = async () => {
        if (!currentLesson || !convexUser) return;

        try {
            await updateProgress({
                userId: convexUser._id,
                lessonId: currentLesson._id,
                courseId,
                watchedSeconds: currentLesson.duration,
                isCompleted: true,
            });

            // Update study streak
            await updateStreak({ userId: convexUser._id });

            toast.success("Aula concluída!");

            // Auto-advance to next lesson
            if (nextLesson) {
                setCurrentLessonId(nextLesson._id);
            }
        } catch (error) {
            toast.error("Erro ao marcar aula como concluída");
        }
    };

    const courseProgress = progress?.progress || 0;
    const isComplete = courseProgress === 100;

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Top Bar */}
            <div className="h-14 border-b flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <Link href="/student/courses">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="hidden md:block">
                        <h1 className="font-semibold text-sm line-clamp-1">{course.title}</h1>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{courseProgress}% concluído</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Progress value={courseProgress} className="w-32 h-2 hidden md:flex" />
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
                            <iframe
                                className="absolute inset-0 w-full h-full"
                                src={`https://www.youtube.com/embed/${getYouTubeId(currentLesson.videoUrl)}?rel=0&modestbranding=1`}
                                title={currentLesson.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <div className="text-center text-white">
                                <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">Vídeo não disponível</p>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="p-4 border-t bg-card">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold">{currentLesson?.title}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {currentLesson?.description}
                                </p>
                            </div>
                            {!isLessonCompleted(currentLessonId!) ? (
                                <Button onClick={handleCompleteLesson} className="gap-2 gradient-bg border-0">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Marcar como Concluída
                                </Button>
                            ) : (
                                <Badge className="bg-emerald-500 gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Concluída
                                </Badge>
                            )}
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
                            {allLessons.filter(l => isLessonCompleted(l._id)).length}/{allLessons.length} aulas concluídas
                        </p>
                    </div>

                    <ScrollArea className="flex-1">
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
                                            {module.lessons?.map((lesson) => {
                                                const isActive = lesson._id === currentLessonId;
                                                const completed = isLessonCompleted(lesson._id);

                                                return (
                                                    <button
                                                        key={lesson._id}
                                                        onClick={() => {
                                                            setCurrentLessonId(lesson._id);
                                                            setSidebarOpen(false);
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors text-sm",
                                                            isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                                                            completed && !isActive && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {completed ? (
                                                            <CheckCircle2 className={cn(
                                                                "h-4 w-4 shrink-0",
                                                                isActive ? "text-primary-foreground" : "text-emerald-500"
                                                            )} />
                                                        ) : (
                                                            <Circle className="h-4 w-4 shrink-0" />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="line-clamp-1">{lesson.title}</p>
                                                            <p className={cn(
                                                                "text-xs",
                                                                isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                                                            )}>
                                                                {Math.floor(lesson.duration / 60)}min
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </ScrollArea>

                    {/* Course Complete */}
                    {isComplete && (
                        <div className="p-4 border-t bg-gradient-to-r from-emerald-500/10 to-emerald-500/5">
                            <div className="text-center">
                                <Award className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                                <h4 className="font-semibold text-emerald-600">Parabéns!</h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Você concluiu o curso!
                                </p>
                                <Link href="/student/certificates">
                                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                                        Ver Certificado
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
