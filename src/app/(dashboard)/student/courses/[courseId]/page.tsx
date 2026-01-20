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
    FileText,
    ClipboardList,
    Trophy,
    AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ProtectedYouTubePlayer } from "@/components/ProtectedYouTubePlayer";
import { useContentProtection } from "@/hooks/useContentProtection";
import { LessonCompletedCelebration } from "@/components/lesson-completed-celebration";


export default function CoursePlayerPage() {
    const params = useParams();
    const router = useRouter();
    const courseIdOrSlug = params.courseId as string;
    const { user } = useUser();

    // Detect if it's an ID (Convex ID format) or a slug (anything else)
    const isConvexId = /^[a-z][a-z0-9]{15,}$/.test(courseIdOrSlug);
    const isSlug = !isConvexId;

    const [currentLessonId, setCurrentLessonId] = useState<Id<"lessons"> | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showCelebration, setShowCelebration] = useState(false);
    const [completedLessonTitle, setCompletedLessonTitle] = useState("");

    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get course with content - try by ID or by slug based on URL format
    const courseById = useQuery(
        api.courses.getWithContent,
        !isSlug ? { courseId: courseIdOrSlug as Id<"courses"> } : "skip"
    );
    const courseBySlug = useQuery(
        api.courses.getWithContentBySlug,
        isSlug ? { slug: courseIdOrSlug } : "skip"
    );
    const course = courseById ?? courseBySlug;
    const courseId = course?._id;

    // Get user's progress
    const progress = useQuery(
        api.enrollments.getCourseProgress,
        convexUser?._id && courseId ? { userId: convexUser._id, courseId } : "skip"
    );

    // Get quiz for current lesson if it's an exam
    const currentLessonQuiz = useQuery(
        api.quizzes.getByLesson,
        currentLessonId ? { lessonId: currentLessonId } : "skip"
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
        if (!currentLesson || !convexUser || !courseId) return;

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

            // Mostrar celebração em vez de apenas toast
            setCompletedLessonTitle(currentLesson.title);
            setShowCelebration(true);
        } catch (error) {
            toast.error("Erro ao marcar aula como concluída");
        }
    };

    const handleGoToNextLesson = () => {
        if (nextLesson) {
            setCurrentLessonId(nextLesson._id);
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
                {/* Content Area */}
                <div className={cn(
                    "flex-1 flex flex-col",
                    sidebarOpen && "hidden md:flex"
                )}>
                    {/* Content based on lesson type */}
                    <div className="flex-1 bg-background flex items-center justify-center relative">
                        {/* Video lesson */}
                        {(currentLesson?.type === "video" || (!currentLesson?.type && currentLesson?.videoUrl)) && (
                            currentLesson?.videoUrl ? (
                                <div className="absolute inset-0 bg-black">
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
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg">Vídeo não disponível</p>
                                </div>
                            )
                        )}

                        {/* Exam/Quiz lesson */}
                        {currentLesson?.type === "exam" && (
                            <div className="w-full max-w-2xl mx-auto p-6">
                                <Card className="overflow-hidden border-2 border-primary/20">
                                    <div className="h-2 gradient-bg" />
                                    <CardHeader className="text-center pb-4">
                                        <div className="h-16 w-16 mx-auto rounded-2xl gradient-bg flex items-center justify-center mb-4">
                                            <ClipboardList className="h-8 w-8 text-white" />
                                        </div>
                                        <CardTitle className="text-2xl">{currentLesson.title}</CardTitle>
                                        <CardDescription className="text-base">
                                            {currentLesson.description || "Avalie seu conhecimento sobre o conteúdo estudado"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {currentLessonQuiz ? (
                                            <>
                                                {/* Quiz Info */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                                    <div className="p-4 rounded-lg bg-muted">
                                                        <p className="text-2xl font-bold">{currentLessonQuiz.questions?.length || 0}</p>
                                                        <p className="text-sm text-muted-foreground">Questões</p>
                                                    </div>
                                                    <div className="p-4 rounded-lg bg-muted">
                                                        <p className="text-2xl font-bold">{currentLessonQuiz.timeLimit || "∞"}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {currentLessonQuiz.timeLimit ? "Minutos" : "Sem limite"}
                                                        </p>
                                                    </div>
                                                    <div className="p-4 rounded-lg bg-muted">
                                                        <p className="text-2xl font-bold">{currentLessonQuiz.passingScore || 70}%</p>
                                                        <p className="text-sm text-muted-foreground">Nota mínima</p>
                                                    </div>
                                                    <div className="p-4 rounded-lg bg-muted">
                                                        <p className="text-2xl font-bold">{currentLessonQuiz.maxAttempts || "∞"}</p>
                                                        <p className="text-sm text-muted-foreground">Tentativas</p>
                                                    </div>
                                                </div>

                                                {/* Instructions */}
                                                {currentLesson.instructions && (
                                                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                                        <div className="flex items-start gap-3">
                                                            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                                                                    Instruções
                                                                </p>
                                                                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                                                    {currentLesson.instructions}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Start Quiz Button */}
                                                <Button
                                                    className="w-full gap-2 gradient-bg border-0 text-lg py-6"
                                                    size="lg"
                                                    onClick={() => router.push(`/student/quiz/${currentLessonQuiz._id}`)}
                                                >
                                                    <Trophy className="h-5 w-5" />
                                                    Iniciar Prova
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="text-center py-8">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                                                <p className="text-muted-foreground">Carregando prova...</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Text lesson */}
                        {currentLesson?.type === "text" && (
                            <div className="w-full h-full overflow-auto p-6">
                                <div className="max-w-3xl mx-auto prose dark:prose-invert">
                                    <h1>{currentLesson.title}</h1>
                                    {currentLesson.textContent ? (
                                        <div dangerouslySetInnerHTML={{ __html: currentLesson.textContent }} />
                                    ) : (
                                        <p className="text-muted-foreground">Conteúdo não disponível</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* PDF lesson */}
                        {currentLesson?.type === "pdf" && (
                            <div className="w-full h-full flex items-center justify-center p-6">
                                {currentLesson.fileUrl ? (
                                    <iframe
                                        src={currentLesson.fileUrl}
                                        className="w-full h-full border-0"
                                        title={currentLesson.title}
                                    />
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg">PDF não disponível</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Assignment lesson */}
                        {currentLesson?.type === "assignment" && (
                            <div className="w-full max-w-2xl mx-auto p-6">
                                <Card>
                                    <CardHeader className="text-center">
                                        <div className="h-16 w-16 mx-auto rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                                            <FileText className="h-8 w-8 text-blue-500" />
                                        </div>
                                        <CardTitle>{currentLesson.title}</CardTitle>
                                        <CardDescription>{currentLesson.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {currentLesson.instructions && (
                                            <div className="p-4 rounded-lg bg-muted mb-4">
                                                <p className="text-sm font-medium mb-2">Instruções:</p>
                                                <p className="text-sm text-muted-foreground">{currentLesson.instructions}</p>
                                            </div>
                                        )}
                                        {currentLesson.dueDate && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                <span>Prazo: {new Date(currentLesson.dueDate).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Fallback for unknown types */}
                        {!currentLesson?.type && !currentLesson?.videoUrl && (
                            <div className="text-center text-muted-foreground">
                                <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">Conteúdo não disponível</p>
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
                                                            // Ícone personalizado baseado no tipo da lição
                                                            lesson.type === "exam" ? (
                                                                <ClipboardList className={cn(
                                                                    "h-4 w-4 shrink-0",
                                                                    isActive ? "text-primary-foreground" : "text-amber-500"
                                                                )} />
                                                            ) : lesson.type === "assignment" ? (
                                                                <FileText className={cn(
                                                                    "h-4 w-4 shrink-0",
                                                                    isActive ? "text-primary-foreground" : "text-blue-500"
                                                                )} />
                                                            ) : lesson.type === "pdf" ? (
                                                                <FileText className={cn(
                                                                    "h-4 w-4 shrink-0",
                                                                    isActive ? "text-primary-foreground" : "text-red-500"
                                                                )} />
                                                            ) : lesson.type === "text" ? (
                                                                <BookOpen className={cn(
                                                                    "h-4 w-4 shrink-0",
                                                                    isActive ? "text-primary-foreground" : "text-purple-500"
                                                                )} />
                                                            ) : (
                                                                // Vídeo ou tipo padrão
                                                                <Play className={cn(
                                                                    "h-4 w-4 shrink-0",
                                                                    isActive ? "text-primary-foreground" : "text-primary"
                                                                )} />
                                                            )
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

            {/* Modal de celebração quando aula é concluída */}
            <LessonCompletedCelebration
                isOpen={showCelebration}
                onClose={() => setShowCelebration(false)}
                lessonTitle={completedLessonTitle}
                nextLessonTitle={nextLesson?.title}
                onNextLesson={handleGoToNextLesson}
                courseProgress={courseProgress}
            />
        </div>
    );
}
