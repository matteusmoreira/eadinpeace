"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    ArrowLeft,
    Plus,
    GripVertical,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    Play,
    Video,
    FileText,
    Clock,
    Save,
    ChevronDown,
    ChevronUp,
    Upload,
    Link as LinkIcon,
    Loader2,
    Check,
    ClipboardCheck,
    FileQuestion,
    BookOpen,
    MessageSquare,
    Calendar,
    Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useRouter } from "next/navigation";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
};

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface LocalModule {
    id: string;
    _id?: Id<"modules">;
    title: string;
    description?: string;
    isExpanded: boolean;
    lessons: LocalLesson[];
}

interface LocalLesson {
    id: string;
    _id?: Id<"lessons">;
    title: string;
    type: string;
    videoUrl?: string;
    duration: number;
    isPublished: boolean;
    isFree: boolean;
}

const lessonTypeIcons: Record<string, React.ElementType> = {
    video: Video,
    text: FileText,
    pdf: FileText,
    exam: ClipboardCheck,
    assignment: FileQuestion,
};

const lessonTypeLabels: Record<string, string> = {
    video: "Vídeo",
    text: "Texto",
    pdf: "PDF",
    exam: "Prova",
    assignment: "Tarefa",
};

export default function EditCoursePage(props: { params: Promise<{ courseId: string }> }) {
    const params = use(props.params);
    const courseId = params.courseId as Id<"courses">;
    const router = useRouter();

    // Fetch course data from Convex
    const courseData = useQuery(api.courses.getWithContent, {
        courseId: courseId
    });

    // Mutations
    const updateCourse = useMutation(api.courses.update);
    const createModule = useMutation(api.courses.createModule);
    const updateModule = useMutation(api.courses.updateModule);
    const createLesson = useMutation(api.courses.createLesson);
    const updateLesson = useMutation(api.courses.updateLesson);

    // Local state for UI
    const [course, setCourse] = useState<{
        id: string;
        title: string;
        description: string;
        category: string;
        level: string;
        thumbnail: string;
        isPublished: boolean;
        modules: LocalModule[];
    } | null>(null);
    const [activeTab, setActiveTab] = useState("content");
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    // Estados para configurações de comentários e gotejamento
    const [commentsEnabled, setCommentsEnabled] = useState(true);
    const [dripType, setDripType] = useState<"free" | "sequential" | "date" | "days_after">("free");

    // Dialog states
    const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
    const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [editingModule, setEditingModule] = useState<any>(null);
    const [editingLesson, setEditingLesson] = useState<LocalLesson | null>(null);

    // Form states
    const [moduleForm, setModuleForm] = useState({
        title: "",
        description: "",
        releaseDate: "",
        daysAfterEnrollment: "",
    });
    const [lessonForm, setLessonForm] = useState({
        title: "",
        videoUrl: "",
        duration: "",
        isFree: false,
        commentsEnabled: "inherit" as "inherit" | "true" | "false",
        releaseDate: "",
        daysAfterEnrollment: "",
    });

    // Query para buscar o quiz associado a uma aula do tipo exam
    const quizByLesson = useQuery(api.quizzes.getByLesson,
        editingLesson?._id && editingLesson?.type === "exam"
            ? { lessonId: editingLesson._id }
            : "skip"
    );



    // Sync course data from Convex to local state
    useEffect(() => {
        if (courseData) {
            const modules: LocalModule[] = (courseData.modules || []).map((m: any) => ({
                id: m._id,
                _id: m._id,
                title: m.title,
                description: m.description,
                isExpanded: expandedModules.has(m._id),
                lessons: (m.lessons || []).map((l: any) => ({
                    id: l._id,
                    _id: l._id,
                    title: l.title,
                    type: l.type || "video",
                    videoUrl: l.videoUrl,
                    duration: l.duration || 0,
                    isPublished: l.isPublished || false,
                    isFree: l.isFree || false,
                })),
            }));

            setCourse({
                id: courseData._id,
                title: courseData.title,
                description: courseData.description || "",
                category: courseData.category || "",
                level: courseData.level || "beginner",
                thumbnail: courseData.thumbnail || "",
                isPublished: courseData.isPublished || false,
                modules,
            });

            // Sincronizar configurações de comentários e gotejamento
            setCommentsEnabled(courseData.commentsEnabled !== false);
            setDripType((courseData.dripType as "free" | "sequential" | "date" | "days_after") || "free");
        }
    }, [courseData, expandedModules]);

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => {
            const newSet = new Set(prev);
            if (newSet.has(moduleId)) {
                newSet.delete(moduleId);
            } else {
                newSet.add(moduleId);
            }
            return newSet;
        });
    };

    const openAddModule = () => {
        setEditingModule(null);
        setModuleForm({
            title: "",
            description: "",
            releaseDate: "",
            daysAfterEnrollment: "",
        });
        setModuleDialogOpen(true);
    };

    const openEditModule = (module: any) => {
        setEditingModule(module);
        setModuleForm({
            title: module.title,
            description: module.description || "",
            releaseDate: module.releaseDate ? new Date(module.releaseDate).toISOString().split('T')[0] : "",
            daysAfterEnrollment: module.daysAfterEnrollment ? String(module.daysAfterEnrollment) : "",
        });
        setModuleDialogOpen(true);
    };

    const saveModule = async () => {
        if (!course) return;

        if (editingModule) {
            // Edit existing module via API
            try {
                await updateModule({
                    moduleId: editingModule._id as Id<"modules">,
                    title: moduleForm.title,
                    description: moduleForm.description,
                    releaseDate: moduleForm.releaseDate ? new Date(moduleForm.releaseDate).getTime() : undefined,
                    daysAfterEnrollment: moduleForm.daysAfterEnrollment ? parseInt(moduleForm.daysAfterEnrollment) : undefined,
                });
                toast.success("Módulo atualizado com sucesso!");
            } catch (error) {
                console.error("Error updating module:", error);
                toast.error("Erro ao atualizar módulo");
            }
        } else {
            // Add new module via API
            try {
                await createModule({
                    courseId: courseId,
                    title: moduleForm.title,
                    description: moduleForm.description,
                });
                toast.success("Módulo criado com sucesso!");
            } catch (error) {
                console.error("Error creating module:", error);
                toast.error("Erro ao criar módulo");
            }
        }
        setModuleDialogOpen(false);
        setHasChanges(true);
    };

    const deleteModule = (moduleId: string) => {
        setCourse(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                modules: prev.modules.filter((m) => m.id !== moduleId),
            };
        });
        setHasChanges(true);
    };

    const openAddLesson = (moduleId: string) => {
        setSelectedModuleId(moduleId);
        setEditingLesson(null);
        setLessonForm({
            title: "",
            videoUrl: "",
            duration: "",
            isFree: false,
            commentsEnabled: "inherit",
            releaseDate: "",
            daysAfterEnrollment: "",
        });
        setLessonDialogOpen(true);
    };

    const openEditLesson = (moduleId: string, lesson: LocalLesson) => {
        // Se for uma prova, redirecionar para a página de edição do quiz
        if (lesson.type === "exam") {
            // Setar o editingLesson para buscar o quiz associado
            setEditingLesson(lesson);
            return;
        }

        setSelectedModuleId(moduleId);
        setEditingLesson(lesson);
        setLessonForm({
            title: lesson.title,
            videoUrl: lesson.videoUrl || "",
            duration: String(Math.floor(lesson.duration / 60)),
            isFree: lesson.isFree,
            commentsEnabled: (lesson as any).commentsEnabled === undefined ? "inherit" : (lesson as any).commentsEnabled ? "true" : "false",
            releaseDate: (lesson as any).releaseDate ? new Date((lesson as any).releaseDate).toISOString().split('T')[0] : "",
            daysAfterEnrollment: (lesson as any).daysAfterEnrollment ? String((lesson as any).daysAfterEnrollment) : "",
        });
        setLessonDialogOpen(true);
    };

    // Efeito para redirecionar quando o quiz for encontrado
    useEffect(() => {
        if (editingLesson?.type === "exam" && quizByLesson !== undefined) {
            if (quizByLesson) {
                // Quiz encontrado, redirecionar para edição
                router.push(`/professor/quizzes/${quizByLesson._id}/edit`);
            } else {
                // Quiz não encontrado, informar usuário
                toast.error("Nenhuma prova vinculada a esta aula. Crie uma nova prova em Provas e Quizzes.");
            }
            setEditingLesson(null);
        }
    }, [quizByLesson, editingLesson, router]);

    const saveLesson = async () => {
        if (!course || !selectedModuleId) return;

        const durationInSeconds = parseInt(lessonForm.duration) * 60 || 0;
        const moduleData = course.modules.find(m => m.id === selectedModuleId);

        if (editingLesson) {
            // Edit existing lesson via API
            try {
                await updateLesson({
                    lessonId: editingLesson._id as Id<"lessons">,
                    title: lessonForm.title,
                    videoUrl: lessonForm.videoUrl,
                    duration: durationInSeconds,
                    isFree: lessonForm.isFree,
                    // Configurações granulares
                    commentsEnabled: lessonForm.commentsEnabled === "inherit" ? undefined : lessonForm.commentsEnabled === "true",
                    releaseDate: lessonForm.releaseDate ? new Date(lessonForm.releaseDate).getTime() : undefined,
                    daysAfterEnrollment: lessonForm.daysAfterEnrollment ? parseInt(lessonForm.daysAfterEnrollment) : undefined,
                });
                toast.success("Aula atualizada com sucesso!");
            } catch (error) {
                console.error("Error updating lesson:", error);
                toast.error("Erro ao atualizar aula");
            }
        } else {
            // Add new lesson via API
            try {
                await createLesson({
                    courseId: courseId,
                    moduleId: selectedModuleId as Id<"modules">,
                    title: lessonForm.title,
                    type: "video",
                    videoUrl: lessonForm.videoUrl,
                    duration: durationInSeconds,
                    isFree: lessonForm.isFree,
                });
            } catch (error) {
                console.error("Error creating lesson:", error);
            }
        }
        setLessonDialogOpen(false);
        setHasChanges(true);
    };

    const deleteLesson = (moduleId: string, lessonId: string) => {
        setCourse(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                modules: prev.modules.map((m) =>
                    m.id === moduleId
                        ? { ...m, lessons: m.lessons.filter((l: any) => l.id !== lessonId) }
                        : m
                ),
            };
        });
        setHasChanges(true);
    };

    const toggleLessonPublish = (moduleId: string, lessonId: string) => {
        setCourse(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                modules: prev.modules.map((m) =>
                    m.id === moduleId
                        ? {
                            ...m,
                            lessons: m.lessons.map((l: any) =>
                                l.id === lessonId ? { ...l, isPublished: !l.isPublished } : l
                            ),
                        }
                        : m
                ),
            };
        });
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!course) return;

        setIsSaving(true);
        try {
            await updateCourse({
                courseId: courseId,
                title: course.title,
                description: course.description,
                category: course.category,
                level: course.level as "beginner" | "intermediate" | "advanced",
                thumbnail: course.thumbnail,
                isPublished: course.isPublished,
                // Configurações de comentários e gotejamento
                commentsEnabled,
                dripType,
            });
            toast.success("Curso salvo com sucesso!");
        } catch (error) {
            console.error("Error saving course:", error);
            toast.error("Erro ao salvar curso");
        }
        setIsSaving(false);
        setHasChanges(false);
    };

    // Loading state
    if (courseData === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Course not found
    if (courseData === null || !course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <p className="text-muted-foreground">Curso não encontrado</p>
                <Link href="/professor/courses">
                    <Button variant="outline" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar aos Cursos
                    </Button>
                </Link>
            </div>
        );
    }

    const totalLessons = course.modules.reduce(
        (acc, m) => acc + m.lessons.length,
        0
    );
    const totalDuration = course.modules.reduce(
        (acc, m) => acc + m.lessons.reduce((a: number, l: any) => a + l.duration, 0),
        0
    );

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/professor/courses">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold line-clamp-1">
                            {course.title}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={course.isPublished ? "default" : "secondary"}>
                                {course.isPublished ? "Publicado" : "Rascunho"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                {course.modules.length} módulos • {totalLessons} aulas •{" "}
                                {Math.floor(totalDuration / 60)} min
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Visualizar
                    </Button>
                    <Button
                        className="gap-2 gradient-bg border-0"
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : hasChanges ? (
                            <>
                                <Save className="h-4 w-4" />
                                Salvar
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4" />
                                Salvo
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="content">Conteúdo</TabsTrigger>
                    <TabsTrigger value="settings">Configurações</TabsTrigger>
                    <TabsTrigger value="pricing">Preço</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4 mt-4">
                    {/* Add Module Button */}
                    <Button variant="outline" className="gap-2" onClick={openAddModule}>
                        <Plus className="h-4 w-4" />
                        Adicionar Módulo
                    </Button>

                    {/* Modules List */}
                    <div className="space-y-4">
                        {course.modules.map((module, moduleIndex) => (
                            <motion.div key={module.id} variants={item}>
                                <Card>
                                    {/* Module Header */}
                                    <div
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => toggleModule(module.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">
                                                        Módulo {moduleIndex + 1}
                                                    </span>
                                                    <h3 className="font-semibold">{module.title}</h3>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {module.lessons.length} aulas •{" "}
                                                    {formatDuration(
                                                        module.lessons.reduce((a: number, l: any) => a + l.duration, 0)
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditModule(module)}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => deleteModule(module.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            {module.isExpanded ? (
                                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Lessons List */}
                                    {module.isExpanded && (
                                        <div className="border-t">
                                            {module.lessons.map((lesson: any, lessonIndex: number) => (
                                                <div
                                                    key={lesson.id}
                                                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b last:border-b-0"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                                        <div className={`h-8 w-8 rounded flex items-center justify-center ${lesson.type === "exam" ? "bg-orange-500/10" : "bg-primary/10"}`}>
                                                            {(() => {
                                                                const LessonIcon = lessonTypeIcons[lesson.type] || Video;
                                                                return <LessonIcon className={`h-4 w-4 ${lesson.type === "exam" ? "text-orange-500" : "text-primary"}`} />;
                                                            })()}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">{lesson.title}</span>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {lessonTypeLabels[lesson.type] || lesson.type}
                                                                </Badge>
                                                                {lesson.isFree && (
                                                                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                                                                        Grátis
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {lesson.type !== "exam" && (
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <Clock className="h-3 w-3" />
                                                                    {formatDuration(lesson.duration)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={lesson.isPublished}
                                                            onCheckedChange={() =>
                                                                toggleLessonPublish(module.id, lesson.id)
                                                            }
                                                        />
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() => openEditLesson(module.id, lesson)}
                                                                >
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Editar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem>
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    Visualizar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={() => deleteLesson(module.id, lesson.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Excluir
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Add Lesson Button */}
                                            <div className="p-4">
                                                <Button
                                                    variant="ghost"
                                                    className="w-full gap-2 border-2 border-dashed"
                                                    onClick={() => openAddLesson(module.id)}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Adicionar Aula
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {course.modules.length === 0 && (
                        <Card className="p-12 text-center">
                            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">Nenhum módulo ainda</h3>
                            <p className="text-muted-foreground mb-4">
                                Comece adicionando o primeiro módulo do seu curso
                            </p>
                            <Button className="gap-2" onClick={openAddModule}>
                                <Plus className="h-4 w-4" />
                                Adicionar Módulo
                            </Button>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="settings" className="mt-4 space-y-4">
                    {/* Informações Básicas */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações do Curso</CardTitle>
                            <CardDescription>
                                Edite as informações básicas do curso
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Título</Label>
                                <Input value={course.title} onChange={() => setHasChanges(true)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Textarea value={course.description} className="min-h-[100px]" onChange={() => setHasChanges(true)} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Configurações de Comentários */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Comentários
                            </CardTitle>
                            <CardDescription>
                                Permita que os alunos comentem nas aulas
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label>Habilitar Comentários</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Os alunos podem fazer perguntas e interagir nas aulas
                                    </p>
                                </div>
                                <Switch
                                    checked={commentsEnabled}
                                    onCheckedChange={(checked) => {
                                        setCommentsEnabled(checked);
                                        setHasChanges(true);
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Configurações de Gotejamento */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5" />
                                Gotejamento de Conteúdo
                            </CardTitle>
                            <CardDescription>
                                Controle como o conteúdo é liberado para os alunos
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Modo de Liberação</Label>
                                <Select
                                    value={dripType}
                                    onValueChange={(value: "free" | "sequential" | "date" | "days_after") => {
                                        setDripType(value);
                                        setHasChanges(true);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o modo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="free">
                                            <div className="flex items-center gap-2">
                                                <span>🔓</span>
                                                <span>Livre - Todo conteúdo disponível</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="sequential">
                                            <div className="flex items-center gap-2">
                                                <span>📚</span>
                                                <span>Sequencial - Depende da conclusão anterior</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="date">
                                            <div className="flex items-center gap-2">
                                                <span>📅</span>
                                                <span>Por Data - Liberação em datas específicas</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="days_after">
                                            <div className="flex items-center gap-2">
                                                <span>⏱️</span>
                                                <span>Dias após Inscrição</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Descrição do modo selecionado */}
                            <div className="p-3 rounded-lg bg-muted/50 text-sm">
                                {dripType === "free" && (
                                    <p>Todo o conteúdo do curso estará disponível imediatamente após a matrícula.</p>
                                )}
                                {dripType === "sequential" && (
                                    <p>O aluno precisa concluir cada aula para desbloquear a próxima. Ideal para cursos com pré-requisitos.</p>
                                )}
                                {dripType === "date" && (
                                    <p>Configure datas específicas de liberação para cada módulo ou aula nas configurações individuais.</p>
                                )}
                                {dripType === "days_after" && (
                                    <p>Configure quantos dias após a matrícula cada módulo ou aula será liberado nas configurações individuais.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pricing" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Preço</CardTitle>
                            <CardDescription>
                                Configure o preço do curso
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Configurações de preço em breve...
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Module Dialog */}
            <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingModule ? "Editar Módulo" : "Novo Módulo"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingModule
                                ? "Edite as informações do módulo"
                                : "Adicione um novo módulo ao curso"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Título do Módulo</Label>
                            <Input
                                placeholder="Ex: Introdução ao JavaScript"
                                value={moduleForm.title}
                                onChange={(e) =>
                                    setModuleForm((prev) => ({ ...prev, title: e.target.value }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição (opcional)</Label>
                            <Textarea
                                placeholder="Descreva o conteúdo deste módulo..."
                                value={moduleForm.description}
                                onChange={(e) =>
                                    setModuleForm((prev) => ({ ...prev, description: e.target.value }))
                                }
                            />
                        </div>

                        {/* Configurações granulares de gotejamento (só aparece na edição) */}
                        {editingModule && (dripType === "date" || dripType === "days_after") && (
                            <div className="border-t pt-4 space-y-4">
                                <p className="text-sm font-medium text-muted-foreground">Configurações de Liberação</p>

                                {/* Data de liberação (para modo date) */}
                                {dripType === "date" && (
                                    <div className="space-y-2">
                                        <Label>Data de Liberação</Label>
                                        <Input
                                            type="date"
                                            value={moduleForm.releaseDate}
                                            onChange={(e) =>
                                                setModuleForm((prev) => ({ ...prev, releaseDate: e.target.value }))
                                            }
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Todas as lições deste módulo serão liberadas nesta data (se não tiverem data própria)
                                        </p>
                                    </div>
                                )}

                                {/* Dias após matrícula (para modo days_after) */}
                                {dripType === "days_after" && (
                                    <div className="space-y-2">
                                        <Label>Dias após Matrícula</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="Ex: 7"
                                            value={moduleForm.daysAfterEnrollment}
                                            onChange={(e) =>
                                                setModuleForm((prev) => ({ ...prev, daysAfterEnrollment: e.target.value }))
                                            }
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Todas as lições deste módulo serão liberadas X dias após a matrícula (se não tiverem valor próprio)
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={saveModule} disabled={!moduleForm.title}>
                            {editingModule ? "Salvar" : "Adicionar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Lesson Dialog */}
            <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingLesson ? "Editar Aula" : "Nova Aula"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingLesson
                                ? "Edite as informações da aula"
                                : "Adicione uma nova aula ao módulo"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Título da Aula</Label>
                            <Input
                                placeholder="Ex: Variáveis e constantes"
                                value={lessonForm.title}
                                onChange={(e) =>
                                    setLessonForm((prev) => ({ ...prev, title: e.target.value }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL do Vídeo (YouTube)</Label>
                            <Input
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={lessonForm.videoUrl}
                                onChange={(e) =>
                                    setLessonForm((prev) => ({ ...prev, videoUrl: e.target.value }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Duração (minutos)</Label>
                            <Input
                                type="number"
                                placeholder="10"
                                value={lessonForm.duration}
                                onChange={(e) =>
                                    setLessonForm((prev) => ({ ...prev, duration: e.target.value }))
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Aula Gratuita</Label>
                                <p className="text-sm text-muted-foreground">
                                    Disponível como prévia
                                </p>
                            </div>
                            <Switch
                                checked={lessonForm.isFree}
                                onCheckedChange={(checked) =>
                                    setLessonForm((prev) => ({ ...prev, isFree: checked }))
                                }
                            />
                        </div>

                        {/* Configurações granulares (só aparece na edição) */}
                        {editingLesson && (
                            <div className="border-t pt-4 space-y-4">
                                <p className="text-sm font-medium text-muted-foreground">Configurações Avançadas</p>

                                {/* Comentários */}
                                <div className="space-y-2">
                                    <Label>Comentários</Label>
                                    <Select
                                        value={lessonForm.commentsEnabled}
                                        onValueChange={(value: "inherit" | "true" | "false") =>
                                            setLessonForm((prev) => ({ ...prev, commentsEnabled: value }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Herdar do curso" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="inherit">Herdar do curso</SelectItem>
                                            <SelectItem value="true">Habilitado</SelectItem>
                                            <SelectItem value="false">Desabilitado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Data de liberação (para modo date) */}
                                {dripType === "date" && (
                                    <div className="space-y-2">
                                        <Label>Data de Liberação</Label>
                                        <Input
                                            type="date"
                                            value={lessonForm.releaseDate}
                                            onChange={(e) =>
                                                setLessonForm((prev) => ({ ...prev, releaseDate: e.target.value }))
                                            }
                                        />
                                    </div>
                                )}

                                {/* Dias após matrícula (para modo days_after) */}
                                {dripType === "days_after" && (
                                    <div className="space-y-2">
                                        <Label>Dias após Matrícula</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="Ex: 7"
                                            value={lessonForm.daysAfterEnrollment}
                                            onChange={(e) =>
                                                setLessonForm((prev) => ({ ...prev, daysAfterEnrollment: e.target.value }))
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={saveLesson} disabled={!lessonForm.title}>
                            {editingLesson ? "Salvar" : "Adicionar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
