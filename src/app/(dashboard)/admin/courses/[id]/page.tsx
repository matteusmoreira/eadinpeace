"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    Save,
    Loader2,
    BookOpen,
    Plus,
    GripVertical,
    Trash2,
    Play,
    Edit,
    Eye,
    EyeOff,
    Clock,
    Video,
    FolderOpen,
    FileText,
    FileIcon,
    ClipboardList,
    GraduationCap,
    Upload,
    Calendar,
    Settings,
    X,
    Image as ImageIcon,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { BunnyVideoUpload } from "@/components/bunny-video-upload";
import { cn } from "@/lib/utils";

import { useUser } from "@clerk/nextjs";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

type LessonType = "video" | "text" | "pdf" | "assignment" | "exam";

const lessonTypeLabels: Record<LessonType, { label: string; icon: typeof Video; color: string }> = {
    video: { label: "Vídeo", icon: Video, color: "text-blue-500" },
    text: { label: "Texto", icon: FileText, color: "text-emerald-500" },
    pdf: { label: "PDF", icon: FileIcon, color: "text-red-500" },
    assignment: { label: "Trabalho", icon: ClipboardList, color: "text-amber-500" },
    exam: { label: "Prova", icon: GraduationCap, color: "text-purple-500" },
};

export default function AdminCourseEditPage() {
    const { user } = useUser();
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as Id<"courses">;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
    const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
    const [editLessonDialogOpen, setEditLessonDialogOpen] = useState(false);
    const [deleteLessonDialogOpen, setDeleteLessonDialogOpen] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState<Id<"modules"> | null>(null);
    const [selectedLessonId, setSelectedLessonId] = useState<Id<"lessons"> | null>(null);
    const [newModuleTitle, setNewModuleTitle] = useState("");
    const [newModuleDescription, setNewModuleDescription] = useState("");
    const [newLesson, setNewLesson] = useState({
        title: "",
        description: "",
        type: "video" as LessonType,
        // Video fields
        videoUrl: "",
        videoProvider: "youtube" as "youtube" | "bunny" | "upload",
        // Text fields
        textContent: "",
        // PDF/File fields
        fileUrl: "",
        fileStorageId: "" as string,
        fileName: "",
        // Assignment/Exam fields
        dueDate: "",
        maxScore: 100,
        instructions: "",
        // Common
        duration: 0,
        isFree: false,
    });

    // Settings Form State
    const [settingsFormData, setSettingsFormData] = useState({
        title: "",
        slug: "",
        description: "",
        category: "",
        instructorId: "",
        certificateTemplateId: "none",
    });

    // Queries
    const course = useQuery(api.courses.getWithContent, { courseId });

    // Get Convex user to get organizationId
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // For superadmins, also check for any organization
    const anyOrganization = useQuery(
        api.users.getOrCreateUserOrganization,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // The organization ID to use
    const effectiveOrgId = convexUser?.organizationId || anyOrganization?._id;

    // Get users from organization to select as instructor
    const orgUsers = useQuery(
        api.users.getByOrganization,
        effectiveOrgId ? { organizationId: effectiveOrgId } : "skip"
    );
    const instructors = orgUsers?.filter(u =>
        u.role === "professor" || u.role === "admin"
    ) || [];

    // Get categories for the organization
    const categories = useQuery(
        api.categories.getByOrganization,
        effectiveOrgId ? { organizationId: effectiveOrgId } : "skip"
    );

    // Get certificate templates
    const certificateTemplates = useQuery(
        api.certificateTemplates.getByOrganization,
        effectiveOrgId ? { organizationId: effectiveOrgId } : "skip"
    );

    // Sync form data with course data
    useEffect(() => {
        if (course) {
            setSettingsFormData({
                title: course.title || "",
                slug: course.slug || "",
                description: course.description || "",
                category: course.category || "",
                instructorId: course.instructorId ? String(course.instructorId) : "",
                certificateTemplateId: course.certificateTemplateId ? String(course.certificateTemplateId) : "none",
            });
        }
    }, [course]);

    // Mutations
    const updateCourse = useMutation(api.courses.update);
    const createModule = useMutation(api.courses.createModule);
    const createLesson = useMutation(api.courses.createLesson);
    const updateLessonMutation = useMutation(api.courses.updateLesson);
    const deleteLessonMutation = useMutation(api.courses.deleteLesson);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const uploadThumbnail = useMutation(api.files.uploadCourseThumbnail);
    const createQuiz = useMutation(api.quizzes.create);

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateCourse({
                courseId,
                title: settingsFormData.title,
                slug: settingsFormData.slug,
                description: settingsFormData.description,
                category: settingsFormData.category,
                instructorId: settingsFormData.instructorId ? (settingsFormData.instructorId as Id<"users">) : undefined,
                certificateTemplateId:
                    settingsFormData.certificateTemplateId === "none"
                        ? undefined
                        : (settingsFormData.certificateTemplateId as Id<"certificateTemplates">),
            });
            toast.success("Configurações do curso atualizadas!");
        } catch (error: any) {
            toast.error(error.message || "Erro ao atualizar curso");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePublishToggle = async () => {
        if (!course) return;
        setIsLoading(true);
        try {
            await updateCourse({
                courseId,
                isPublished: !course.isPublished,
            });
            toast.success(course.isPublished ? "Curso despublicado" : "Curso publicado!");
        } catch (error: any) {
            toast.error(error.message || "Erro ao atualizar curso");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateModule = async () => {
        if (!newModuleTitle.trim()) {
            toast.error("Digite o título do módulo");
            return;
        }

        setIsLoading(true);
        try {
            await createModule({
                courseId,
                title: newModuleTitle,
                description: newModuleDescription || undefined,
            });
            toast.success("Módulo criado com sucesso!");
            setNewModuleTitle("");
            setNewModuleDescription("");
            setModuleDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Erro ao criar módulo");
        } finally {
            setIsLoading(false);
        }
    };

    // Função para upload de thumbnail
    const handleThumbnailSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo de arquivo
        if (!file.type.startsWith("image/")) {
            toast.error("Selecione um arquivo de imagem válido");
            return;
        }

        // Validar tamanho (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("A imagem deve ter no máximo 5MB");
            return;
        }

        setIsUploadingThumbnail(true);

        try {
            // Mostrar preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setThumbnailPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);

            // Upload para o Convex
            const uploadUrl = await generateUploadUrl();
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) {
                throw new Error("Erro no upload");
            }

            const { storageId } = await result.json();

            // Salvar thumbnail no curso
            await uploadThumbnail({
                courseId,
                storageId,
            });

            toast.success("Thumbnail atualizado!");
        } catch (error) {
            toast.error("Erro ao carregar imagem");
            setThumbnailPreview(null);
        } finally {
            setIsUploadingThumbnail(false);
        }
    };

    const handleRemoveThumbnail = async () => {
        try {
            // Remove apenas a URL do thumbnail no banco
            await updateCourse({
                courseId,
                thumbnail: undefined,
            });
            setThumbnailPreview(null);
            if (thumbnailInputRef.current) {
                thumbnailInputRef.current.value = "";
            }
            toast.success("Thumbnail removido!");
        } catch (error) {
            toast.error("Erro ao remover thumbnail");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type for PDF
        if (newLesson.type === "pdf" && file.type !== "application/pdf") {
            toast.error("Selecione um arquivo PDF válido");
            return;
        }

        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            toast.error("O arquivo deve ter no máximo 50MB");
            return;
        }

        setIsUploading(true);
        try {
            const uploadUrl = await generateUploadUrl();
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) throw new Error("Erro no upload");

            const { storageId } = await result.json();
            setNewLesson(prev => ({
                ...prev,
                fileUrl: process.env.NEXT_PUBLIC_CONVEX_URL
                    ? `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${storageId}`
                    : storageId,
                fileStorageId: storageId,
                fileName: file.name,
            }));
            toast.success("Arquivo carregado!");
        } catch (error) {
            toast.error("Erro ao carregar arquivo");
        } finally {
            setIsUploading(false);
        }
    };

    const handleCreateLesson = async () => {
        if (!selectedModuleId || !newLesson.title.trim()) {
            toast.error("Preencha os campos obrigatórios");
            return;
        }

        // Validate based on type
        if (newLesson.type === "video" && !newLesson.videoUrl) {
            toast.error("Informe a URL do vídeo");
            return;
        }
        if (newLesson.type === "text" && !newLesson.textContent) {
            toast.error("Escreva o conteúdo da aula");
            return;
        }
        if (newLesson.type === "pdf" && !newLesson.fileUrl) {
            toast.error("Faça upload do arquivo PDF");
            return;
        }

        setIsLoading(true);
        try {
            const lessonId = await createLesson({
                moduleId: selectedModuleId,
                courseId,
                title: newLesson.title,
                description: newLesson.description || undefined,
                type: newLesson.type,
                // Video
                videoUrl: newLesson.type === "video" ? newLesson.videoUrl || undefined : undefined,
                videoProvider: newLesson.type === "video" ? newLesson.videoProvider : undefined,
                // Text
                textContent: newLesson.type === "text" ? newLesson.textContent || undefined : undefined,
                // PDF
                fileUrl: newLesson.type === "pdf" ? newLesson.fileUrl || undefined : undefined,
                fileName: newLesson.type === "pdf" ? newLesson.fileName || undefined : undefined,
                // Assignment/Exam
                instructions: ["assignment", "exam"].includes(newLesson.type) ? newLesson.instructions || undefined : undefined,
                maxScore: ["assignment", "exam"].includes(newLesson.type) ? newLesson.maxScore : undefined,
                dueDate: ["assignment", "exam"].includes(newLesson.type) && newLesson.dueDate
                    ? new Date(newLesson.dueDate).getTime()
                    : undefined,
                // Common
                duration: newLesson.duration * 60, // Convert minutes to seconds
                isFree: newLesson.isFree,
            });

            // Se for prova ou trabalho, criar quiz automaticamente
            if (["assignment", "exam"].includes(newLesson.type)) {
                try {
                    const quizId = await createQuiz({
                        courseId,
                        lessonId,
                        title: newLesson.title,
                        description: newLesson.instructions || `Questões para: ${newLesson.title}`,
                        passingScore: 60, // Nota mínima padrão
                        timeLimit: newLesson.duration * 60 || undefined, // Tempo em segundos
                        maxAttempts: newLesson.type === "exam" ? 1 : 3, // Provas: 1 tentativa, Trabalhos: 3
                    });
                    toast.success("Aula e quiz criados! Redirecionando para adicionar questões...");
                    resetLessonForm();
                    setLessonDialogOpen(false);
                    setSelectedModuleId(null);
                    // Redirecionar para a página de edição do quiz
                    router.push(`/professor/quizzes/${quizId}/edit`);
                    return;
                } catch (quizError: any) {
                    console.error("Erro ao criar quiz:", quizError);
                    toast.warning(`Aula criada, mas houve um erro ao criar o quiz: ${quizError.message}`);
                }
            }

            toast.success("Aula criada com sucesso!");
            resetLessonForm();
            setLessonDialogOpen(false);
            setSelectedModuleId(null);
        } catch (error: any) {
            toast.error(error.message || "Erro ao criar aula");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditLesson = (lesson: any) => {
        setSelectedLessonId(lesson._id);
        setNewLesson({
            title: lesson.title || "",
            description: lesson.description || "",
            type: lesson.type || "video",
            videoUrl: lesson.videoUrl || "",
            videoProvider: lesson.videoProvider || "youtube",
            textContent: lesson.textContent || "",
            fileUrl: lesson.fileUrl || "",
            fileStorageId: lesson.fileStorageId || "",
            fileName: lesson.fileName || "",
            dueDate: lesson.dueDate ? new Date(lesson.dueDate).toISOString().slice(0, 16) : "",
            maxScore: lesson.maxScore || 100,
            instructions: lesson.instructions || "",
            duration: Math.floor((lesson.duration || 0) / 60), // Convert seconds to minutes
            isFree: lesson.isFree || false,
        });
        setEditLessonDialogOpen(true);
    };

    const handleUpdateLesson = async () => {
        if (!selectedLessonId || !newLesson.title.trim()) {
            toast.error("Preencha os campos obrigatórios");
            return;
        }

        // Validate based on type
        if (newLesson.type === "video" && !newLesson.videoUrl) {
            toast.error("Informe a URL do vídeo");
            return;
        }
        if (newLesson.type === "text" && !newLesson.textContent) {
            toast.error("Escreva o conteúdo da aula");
            return;
        }
        if (newLesson.type === "pdf" && !newLesson.fileUrl) {
            toast.error("Faça upload do arquivo PDF");
            return;
        }

        setIsLoading(true);
        try {
            await updateLessonMutation({
                lessonId: selectedLessonId,
                title: newLesson.title,
                description: newLesson.description || undefined,
                type: newLesson.type,
                // Video
                videoUrl: newLesson.type === "video" ? newLesson.videoUrl || undefined : undefined,
                videoProvider: newLesson.type === "video" ? newLesson.videoProvider : undefined,
                // Text
                textContent: newLesson.type === "text" ? newLesson.textContent || undefined : undefined,
                // PDF
                fileUrl: newLesson.type === "pdf" ? newLesson.fileUrl || undefined : undefined,
                fileName: newLesson.type === "pdf" ? newLesson.fileName || undefined : undefined,
                // Assignment/Exam
                instructions: ["assignment", "exam"].includes(newLesson.type) ? newLesson.instructions || undefined : undefined,
                maxScore: ["assignment", "exam"].includes(newLesson.type) ? newLesson.maxScore : undefined,
                dueDate: ["assignment", "exam"].includes(newLesson.type) && newLesson.dueDate
                    ? new Date(newLesson.dueDate).getTime()
                    : undefined,
                // Common
                duration: newLesson.duration * 60, // Convert minutes to seconds
                isFree: newLesson.isFree,
            });
            toast.success("Aula atualizada com sucesso!");
            resetLessonForm();
            setEditLessonDialogOpen(false);
            setSelectedLessonId(null);
        } catch (error: any) {
            toast.error(error.message || "Erro ao atualizar aula");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteLesson = async () => {
        if (!selectedLessonId) return;

        setIsLoading(true);
        try {
            await deleteLessonMutation({ lessonId: selectedLessonId });
            toast.success("Aula excluída com sucesso!");
            setDeleteLessonDialogOpen(false);
            setSelectedLessonId(null);
        } catch (error: any) {
            toast.error(error.message || "Erro ao excluir aula");
        } finally {
            setIsLoading(false);
        }
    };

    const resetLessonForm = () => {
        setNewLesson({
            title: "",
            description: "",
            type: "video",
            videoUrl: "",
            videoProvider: "youtube",
            textContent: "",
            fileUrl: "",
            fileStorageId: "",
            fileName: "",
            dueDate: "",
            maxScore: 100,
            instructions: "",
            duration: 0,
            isFree: false,
        });
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        }
        return `${minutes}min`;
    };

    const getLessonIcon = (type: string) => {
        const config = lessonTypeLabels[type as LessonType] || lessonTypeLabels.video;
        const Icon = config.icon;
        return <Icon className={cn("h-4 w-4", config.color)} />;
    };

    if (!course) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-4xl mx-auto space-y-6"
        >
            {/* Header */}
            <motion.div variants={item} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/courses">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">{course.title}</h1>
                            <Badge variant={course.isPublished ? "default" : "secondary"}>
                                {course.isPublished ? "Publicado" : "Rascunho"}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            {course.modules?.length || 0} módulos • {totalLessons} aulas • {formatDuration(course.duration)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="public" className="text-sm">Público</Label>
                        <Switch
                            id="public"
                            checked={course.isPublic || false}
                            onCheckedChange={async () => {
                                if (!course) return;
                                setIsLoading(true);
                                try {
                                    await updateCourse({
                                        courseId,
                                        isPublic: !course.isPublic,
                                    });
                                    toast.success(course.isPublic ? "Curso agora é privado" : "Curso agora é público!");
                                } catch (error: any) {
                                    toast.error(error.message || "Erro ao atualizar curso");
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="publish">Publicar</Label>
                        <Switch
                            id="publish"
                            checked={course.isPublished}
                            onCheckedChange={handlePublishToggle}
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Course Content */}
            {/* Tabs */}
            <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="content" className="gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Conteúdo
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Configurações
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4 mt-6">
                    <motion.div variants={item}>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <FolderOpen className="h-5 w-5" />
                                        Conteúdo do Curso
                                    </CardTitle>
                                    <CardDescription>
                                        Organize os módulos e aulas do curso
                                    </CardDescription>
                                </div>
                                <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Novo Módulo
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Criar Novo Módulo</DialogTitle>
                                            <DialogDescription>
                                                Módulos organizam as aulas em seções temáticas
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="moduleTitle">Título do Módulo *</Label>
                                                <Input
                                                    id="moduleTitle"
                                                    placeholder="Ex: Introdução"
                                                    value={newModuleTitle}
                                                    onChange={(e) => setNewModuleTitle(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="moduleDescription">Descrição (opcional)</Label>
                                                <Textarea
                                                    id="moduleDescription"
                                                    placeholder="Breve descrição do módulo..."
                                                    value={newModuleDescription}
                                                    onChange={(e) => setNewModuleDescription(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
                                                Cancelar
                                            </Button>
                                            <Button onClick={handleCreateModule} disabled={isLoading}>
                                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                Criar Módulo
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                {course.modules?.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium mb-2">Nenhum módulo ainda</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Comece criando o primeiro módulo do curso
                                        </p>
                                        <Button onClick={() => setModuleDialogOpen(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Criar Primeiro Módulo
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {course.modules?.map((module, moduleIndex) => (
                                            <div key={module._id} className="border rounded-lg">
                                                <div className="flex items-center gap-3 p-4 bg-muted/50">
                                                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">
                                                                Módulo {moduleIndex + 1}: {module.title}
                                                            </span>
                                                            <Badge variant="outline">
                                                                {module.lessons?.length || 0} aulas
                                                            </Badge>
                                                            {!module.isPublished && (
                                                                <Badge variant="secondary">Rascunho</Badge>
                                                            )}
                                                        </div>
                                                        {module.description && (
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {module.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedModuleId(module._id);
                                                            resetLessonForm();
                                                            setLessonDialogOpen(true);
                                                        }}
                                                    >
                                                        <Plus className="h-4 w-4 mr-1" />
                                                        Aula
                                                    </Button>
                                                </div>

                                                {/* Lessons */}
                                                {module.lessons && module.lessons.length > 0 && (
                                                    <div className="divide-y">
                                                        {module.lessons.map((lesson, lessonIndex) => (
                                                            <div
                                                                key={lesson._id}
                                                                className="flex items-center gap-3 p-3 pl-12 hover:bg-muted/30"
                                                            >
                                                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-sm font-medium">
                                                                    {lessonIndex + 1}
                                                                </div>
                                                                {getLessonIcon((lesson as any).type || "video")}
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span>{lesson.title}</span>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {lessonTypeLabels[(lesson as any).type as LessonType]?.label || "Vídeo"}
                                                                        </Badge>
                                                                        {lesson.isFree && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                Grátis
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <Clock className="h-4 w-4" />
                                                                    {formatDuration(lesson.duration)}
                                                                </div>
                                                                {lesson.isPublished ? (
                                                                    <Eye className="h-4 w-4 text-emerald-500" />
                                                                ) : (
                                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                                )}
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={() => handleEditLesson(lesson)}
                                                                        title="Editar aula"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                                        onClick={() => {
                                                                            setSelectedLessonId(lesson._id);
                                                                            setDeleteLessonDialogOpen(true);
                                                                        }}
                                                                        title="Excluir aula"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4 mt-6">
                    <motion.div variants={item}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Configurações do Curso
                                </CardTitle>
                                <CardDescription>
                                    Gerencie as informações principais do curso
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdateSettings} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Título *</Label>
                                        <Input
                                            value={settingsFormData.title}
                                            onChange={(e) => setSettingsFormData({ ...settingsFormData, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Slug URL *</Label>
                                        <Input
                                            value={settingsFormData.slug}
                                            onChange={(e) => setSettingsFormData({ ...settingsFormData, slug: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Descrição</Label>
                                        <Textarea
                                            value={settingsFormData.description}
                                            onChange={(e) => setSettingsFormData({ ...settingsFormData, description: e.target.value })}
                                            rows={4}
                                        />
                                    </div>

                                    {/* Thumbnail Upload */}
                                    <div className="space-y-2">
                                        <Label>Banner / Thumbnail do Curso</Label>
                                        <input
                                            ref={thumbnailInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleThumbnailSelect}
                                            className="hidden"
                                        />

                                        {(thumbnailPreview || course?.thumbnail) ? (
                                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border max-w-md">
                                                <img
                                                    src={thumbnailPreview || course?.thumbnail || ""}
                                                    alt="Thumbnail do curso"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-2 right-2 flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => thumbnailInputRef.current?.click()}
                                                        disabled={isUploadingThumbnail}
                                                    >
                                                        {isUploadingThumbnail ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Upload className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={handleRemoveThumbnail}
                                                        disabled={isUploadingThumbnail}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => thumbnailInputRef.current?.click()}
                                                className={cn(
                                                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors max-w-md",
                                                    "hover:border-primary hover:bg-primary/5",
                                                    isUploadingThumbnail && "opacity-50 pointer-events-none"
                                                )}
                                            >
                                                {isUploadingThumbnail ? (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                        <p className="text-sm text-muted-foreground">Carregando...</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                                        <p className="font-medium">Clique para fazer upload</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            PNG, JPG ou WEBP até 5MB
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Esta imagem será exibida como capa do curso no catálogo
                                        </p>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Categoria *</Label>
                                            <Select
                                                value={settingsFormData.category}
                                                onValueChange={(value) => setSettingsFormData({ ...settingsFormData, category: value })}
                                            >
                                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent>
                                                    {categories?.map((c) => (
                                                        <SelectItem key={c._id} value={c.name}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Instrutor *</Label>
                                            <Select
                                                value={settingsFormData.instructorId}
                                                onValueChange={(value) => setSettingsFormData({ ...settingsFormData, instructorId: value })}
                                            >
                                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent>
                                                    {instructors.map((i) => (
                                                        <SelectItem key={i._id} value={i._id as string}>
                                                            {`${i.firstName || ''} ${i.lastName || ''}`.trim() || i.email}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Modelo de Certificado</Label>
                                            <Select
                                                value={settingsFormData.certificateTemplateId}
                                                onValueChange={(value) => setSettingsFormData({ ...settingsFormData, certificateTemplateId: value })}
                                            >
                                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Nenhum (ou Padrão)</SelectItem>
                                                    {certificateTemplates?.map((t) => (
                                                        <SelectItem key={t._id} value={t._id}>
                                                            {t.name} {t.isDefault ? "(Padrão)" : ""}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                Escolha qual certificado será gerado ao concluir este curso.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={isLoading} className="gap-2 gradient-bg border-0">
                                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            Salvar Alterações
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>
            </Tabs>

            {/* Lesson Dialog */}
            <Dialog open={lessonDialogOpen} onOpenChange={(open) => {
                setLessonDialogOpen(open);
                if (!open) resetLessonForm();
            }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Criar Nova Aula</DialogTitle>
                        <DialogDescription>
                            Escolha o tipo de aula e preencha as informações
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Lesson Type Selection */}
                        <div className="space-y-3">
                            <Label>Tipo de Aula</Label>
                            <div className="grid grid-cols-5 gap-2">
                                {(Object.keys(lessonTypeLabels) as LessonType[]).map((type) => {
                                    const config = lessonTypeLabels[type];
                                    const Icon = config.icon;
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                                                newLesson.type === type
                                                    ? "border-primary bg-primary/5"
                                                    : "border-muted hover:border-muted-foreground/50"
                                            )}
                                            onClick={() => setNewLesson(prev => ({ ...prev, type }))}
                                        >
                                            <Icon className={cn("h-6 w-6", config.color)} />
                                            <span className="text-xs font-medium">{config.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Common Fields */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="lessonTitle">Título da Aula *</Label>
                                <Input
                                    id="lessonTitle"
                                    placeholder="Ex: Boas-vindas ao curso"
                                    value={newLesson.title}
                                    onChange={(e) => setNewLesson((prev) => ({ ...prev, title: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lessonDescription">Descrição (opcional)</Label>
                                <Textarea
                                    id="lessonDescription"
                                    placeholder="Breve descrição da aula..."
                                    value={newLesson.description}
                                    onChange={(e) => setNewLesson((prev) => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Type-specific Fields */}
                        {newLesson.type === "video" && (
                            <div className="space-y-4 border-t pt-4">
                                <h4 className="font-medium flex items-center gap-2">
                                    <Video className="h-4 w-4 text-blue-500" />
                                    Configurações de Vídeo
                                </h4>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Provedor de Vídeo</Label>
                                        <Select
                                            value={newLesson.videoProvider}
                                            onValueChange={(value: any) =>
                                                setNewLesson((prev) => ({ ...prev, videoProvider: value }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="youtube">YouTube</SelectItem>
                                                <SelectItem value="bunny">Bunny CDN</SelectItem>
                                                <SelectItem value="upload">Upload</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="duration">Duração (minutos) *</Label>
                                        <Input
                                            id="duration"
                                            type="number"
                                            min="1"
                                            placeholder="15"
                                            value={newLesson.duration || ""}
                                            onChange={(e) =>
                                                setNewLesson((prev) => ({ ...prev, duration: parseInt(e.target.value) || 0 }))
                                            }
                                        />
                                    </div>
                                </div>

                                {/* YouTube or Upload URL Input */}
                                {newLesson.videoProvider !== "bunny" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="videoUrl">URL do Vídeo *</Label>
                                        <Input
                                            id="videoUrl"
                                            placeholder={newLesson.videoProvider === "youtube"
                                                ? "https://youtube.com/watch?v=..."
                                                : "https://seu-video.mp4"}
                                            value={newLesson.videoUrl}
                                            onChange={(e) => setNewLesson((prev) => ({ ...prev, videoUrl: e.target.value }))}
                                        />
                                    </div>
                                )}

                                {/* Bunny Stream Upload */}
                                {newLesson.videoProvider === "bunny" && (
                                    <div className="space-y-3">
                                        <Label>Upload de Vídeo (Bunny Stream)</Label>
                                        {newLesson.videoUrl ? (
                                            <div className="p-4 border rounded-lg bg-muted/50">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Video className="h-5 w-5 text-primary" />
                                                        <div>
                                                            <p className="font-medium">Vídeo carregado</p>
                                                            <p className="text-xs text-muted-foreground font-mono">
                                                                {newLesson.videoUrl.split('/').pop()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setNewLesson(prev => ({ ...prev, videoUrl: "" }))}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <BunnyVideoUpload
                                                onUploadComplete={(videoId, embedUrl) => {
                                                    setNewLesson(prev => ({ ...prev, videoUrl: videoId }));
                                                }}
                                                onError={(error) => toast.error(error)}
                                            />
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Formatos suportados: MP4, MOV, WebM • Máx: 500MB
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {newLesson.type === "text" && (
                            <div className="space-y-4 border-t pt-4">
                                <h4 className="font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-emerald-500" />
                                    Conteúdo da Aula
                                </h4>
                                <div className="space-y-2">
                                    <Label htmlFor="textContent">Texto da Aula *</Label>
                                    <Textarea
                                        id="textContent"
                                        placeholder="Escreva o conteúdo da aula aqui..."
                                        value={newLesson.textContent}
                                        onChange={(e) => setNewLesson((prev) => ({ ...prev, textContent: e.target.value }))}
                                        rows={10}
                                        className="font-mono"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Você pode usar Markdown para formatar o texto
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="readDuration">Tempo estimado de leitura (minutos)</Label>
                                    <Input
                                        id="readDuration"
                                        type="number"
                                        min="1"
                                        placeholder="5"
                                        value={newLesson.duration || ""}
                                        onChange={(e) =>
                                            setNewLesson((prev) => ({ ...prev, duration: parseInt(e.target.value) || 0 }))
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        {newLesson.type === "pdf" && (
                            <div className="space-y-4 border-t pt-4">
                                <h4 className="font-medium flex items-center gap-2">
                                    <FileIcon className="h-4 w-4 text-red-500" />
                                    Arquivo PDF
                                </h4>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                {newLesson.fileName ? (
                                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                                        <FileIcon className="h-5 w-5 text-red-500" />
                                        <span className="flex-1 truncate">{newLesson.fileName}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setNewLesson(prev => ({ ...prev, fileUrl: "", fileName: "" }))}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className={cn(
                                            "w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                                            "hover:border-primary hover:bg-primary/5",
                                            isUploading && "opacity-50 pointer-events-none"
                                        )}
                                    >
                                        {isUploading ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                <span className="text-sm text-muted-foreground">Carregando...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <Upload className="h-6 w-6 text-muted-foreground" />
                                                <span className="font-medium">Clique para fazer upload do PDF</span>
                                                <span className="text-sm text-muted-foreground">Até 50MB</span>
                                            </div>
                                        )}
                                    </button>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="pdfDuration">Tempo estimado de leitura (minutos)</Label>
                                    <Input
                                        id="pdfDuration"
                                        type="number"
                                        min="1"
                                        placeholder="10"
                                        value={newLesson.duration || ""}
                                        onChange={(e) =>
                                            setNewLesson((prev) => ({ ...prev, duration: parseInt(e.target.value) || 0 }))
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        {(newLesson.type === "assignment" || newLesson.type === "exam") && (
                            <div className="space-y-4 border-t pt-4">
                                <h4 className="font-medium flex items-center gap-2">
                                    {newLesson.type === "assignment" ? (
                                        <ClipboardList className="h-4 w-4 text-amber-500" />
                                    ) : (
                                        <GraduationCap className="h-4 w-4 text-purple-500" />
                                    )}
                                    Configurações do {newLesson.type === "assignment" ? "Trabalho" : "Exame"}
                                </h4>

                                <div className="space-y-2">
                                    <Label htmlFor="instructions">Instruções *</Label>
                                    <Textarea
                                        id="instructions"
                                        placeholder="Descreva as instruções e requisitos..."
                                        value={newLesson.instructions}
                                        onChange={(e) => setNewLesson((prev) => ({ ...prev, instructions: e.target.value }))}
                                        rows={5}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="dueDate">Data de Entrega</Label>
                                        <Input
                                            id="dueDate"
                                            type="datetime-local"
                                            value={newLesson.dueDate}
                                            onChange={(e) =>
                                                setNewLesson((prev) => ({ ...prev, dueDate: e.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="maxScore">Pontuação Máxima</Label>
                                        <Input
                                            id="maxScore"
                                            type="number"
                                            min="0"
                                            placeholder="100"
                                            value={newLesson.maxScore}
                                            onChange={(e) =>
                                                setNewLesson((prev) => ({ ...prev, maxScore: parseInt(e.target.value) || 100 }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="examDuration">Tempo estimado (minutos)</Label>
                                    <Input
                                        id="examDuration"
                                        type="number"
                                        min="1"
                                        placeholder="60"
                                        value={newLesson.duration || ""}
                                        onChange={(e) =>
                                            setNewLesson((prev) => ({ ...prev, duration: parseInt(e.target.value) || 0 }))
                                        }
                                    />
                                </div>

                                {/* Info sobre questões */}
                                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <h5 className="font-medium text-blue-900 dark:text-blue-100">
                                                Como adicionar questões
                                            </h5>
                                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                                Após criar esta aula, você poderá adicionar questões através do menu
                                                <strong> Quizzes</strong> no painel do professor. As questões serão
                                                automaticamente vinculadas a esta aula.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pl-8">
                                        <Link
                                            href="/professor/quizzes"
                                            target="_blank"
                                            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline flex items-center gap-1"
                                        >
                                            Acessar Gerenciador de Quizzes
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Free lesson toggle */}
                        <div className="flex items-center justify-between border-t pt-4">
                            <div className="space-y-0.5">
                                <Label>Aula Gratuita</Label>
                                <p className="text-xs text-muted-foreground">
                                    Disponível para preview sem matrícula
                                </p>
                            </div>
                            <Switch
                                checked={newLesson.isFree}
                                onCheckedChange={(checked) =>
                                    setNewLesson((prev) => ({ ...prev, isFree: checked }))
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateLesson} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Criar Aula
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Lesson Dialog */}
            <Dialog open={editLessonDialogOpen} onOpenChange={(open) => {
                setEditLessonDialogOpen(open);
                if (!open) {
                    resetLessonForm();
                    setSelectedLessonId(null);
                }
            }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Aula</DialogTitle>
                        <DialogDescription>
                            Atualize as informações da aula
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Lesson Type Selection */}
                        <div className="space-y-3">
                            <Label>Tipo de Aula</Label>
                            <div className="grid grid-cols-5 gap-2">
                                {(Object.keys(lessonTypeLabels) as LessonType[]).map((type) => {
                                    const config = lessonTypeLabels[type];
                                    const Icon = config.icon;
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                                                newLesson.type === type
                                                    ? "border-primary bg-primary/5"
                                                    : "border-muted hover:border-muted-foreground/50"
                                            )}
                                            onClick={() => setNewLesson(prev => ({ ...prev, type }))}
                                        >
                                            <Icon className={cn("h-6 w-6", config.color)} />
                                            <span className="text-xs font-medium">{config.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Common Fields */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="editLessonTitle">Título da Aula *</Label>
                                <Input
                                    id="editLessonTitle"
                                    placeholder="Ex: Boas-vindas ao curso"
                                    value={newLesson.title}
                                    onChange={(e) => setNewLesson((prev) => ({ ...prev, title: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="editLessonDescription">Descrição (opcional)</Label>
                                <Textarea
                                    id="editLessonDescription"
                                    placeholder="Breve descrição da aula..."
                                    value={newLesson.description}
                                    onChange={(e) => setNewLesson((prev) => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Type-specific Fields */}
                        {newLesson.type === "video" && (
                            <div className="space-y-4 border-t pt-4">
                                <h4 className="font-medium flex items-center gap-2">
                                    <Video className="h-4 w-4 text-blue-500" />
                                    Configurações de Vídeo
                                </h4>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Provedor de Vídeo</Label>
                                        <Select
                                            value={newLesson.videoProvider}
                                            onValueChange={(value: any) =>
                                                setNewLesson((prev) => ({ ...prev, videoProvider: value }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="youtube">YouTube</SelectItem>
                                                <SelectItem value="bunny">Bunny CDN</SelectItem>
                                                <SelectItem value="upload">Upload</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="editDuration">Duração (minutos) *</Label>
                                        <Input
                                            id="editDuration"
                                            type="number"
                                            min="1"
                                            placeholder="15"
                                            value={newLesson.duration || ""}
                                            onChange={(e) =>
                                                setNewLesson((prev) => ({ ...prev, duration: parseInt(e.target.value) || 0 }))
                                            }
                                        />
                                    </div>
                                </div>

                                {/* YouTube or Upload URL Input */}
                                {newLesson.videoProvider !== "bunny" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="editVideoUrl">URL do Vídeo *</Label>
                                        <Input
                                            id="editVideoUrl"
                                            placeholder={newLesson.videoProvider === "youtube"
                                                ? "https://youtube.com/watch?v=..."
                                                : "https://seu-video.mp4"}
                                            value={newLesson.videoUrl}
                                            onChange={(e) => setNewLesson((prev) => ({ ...prev, videoUrl: e.target.value }))}
                                        />
                                    </div>
                                )}

                                {/* Bunny Stream Upload */}
                                {newLesson.videoProvider === "bunny" && (
                                    <div className="space-y-3">
                                        <Label>Upload de Vídeo (Bunny Stream)</Label>
                                        {newLesson.videoUrl ? (
                                            <div className="p-4 border rounded-lg bg-muted/50">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Video className="h-5 w-5 text-primary" />
                                                        <div>
                                                            <p className="font-medium">Vídeo carregado</p>
                                                            <p className="text-xs text-muted-foreground font-mono">
                                                                {newLesson.videoUrl.split('/').pop()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setNewLesson(prev => ({ ...prev, videoUrl: "" }))}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <BunnyVideoUpload
                                                onUploadComplete={(videoId, embedUrl) => {
                                                    setNewLesson(prev => ({ ...prev, videoUrl: videoId }));
                                                }}
                                                onError={(error) => toast.error(error)}
                                            />
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Formatos suportados: MP4, MOV, WebM • Máx: 500MB
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {newLesson.type === "text" && (
                            <div className="space-y-4 border-t pt-4">
                                <h4 className="font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-emerald-500" />
                                    Conteúdo da Aula
                                </h4>
                                <div className="space-y-2">
                                    <Label htmlFor="editTextContent">Texto da Aula *</Label>
                                    <Textarea
                                        id="editTextContent"
                                        placeholder="Escreva o conteúdo da aula aqui..."
                                        value={newLesson.textContent}
                                        onChange={(e) => setNewLesson((prev) => ({ ...prev, textContent: e.target.value }))}
                                        rows={10}
                                        className="font-mono"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Você pode usar Markdown para formatar o texto
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="editReadDuration">Tempo estimado de leitura (minutos)</Label>
                                    <Input
                                        id="editReadDuration"
                                        type="number"
                                        min="1"
                                        placeholder="5"
                                        value={newLesson.duration || ""}
                                        onChange={(e) =>
                                            setNewLesson((prev) => ({ ...prev, duration: parseInt(e.target.value) || 0 }))
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        {/* Assignment/Exam Fields */}
                        {(newLesson.type === "assignment" || newLesson.type === "exam") && (
                            <div className="space-y-4 border-t pt-4">
                                <h4 className="font-medium flex items-center gap-2">
                                    {newLesson.type === "assignment" ? (
                                        <ClipboardList className="h-4 w-4 text-amber-500" />
                                    ) : (
                                        <GraduationCap className="h-4 w-4 text-purple-500" />
                                    )}
                                    Configurações do {newLesson.type === "assignment" ? "Trabalho" : "Exame"}
                                </h4>

                                <div className="space-y-2">
                                    <Label htmlFor="editInstructions">Instruções</Label>
                                    <Textarea
                                        id="editInstructions"
                                        placeholder="Descreva as instruções e requisitos..."
                                        value={newLesson.instructions}
                                        onChange={(e) => setNewLesson((prev) => ({ ...prev, instructions: e.target.value }))}
                                        rows={4}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="editDueDate">Data de Entrega</Label>
                                        <Input
                                            id="editDueDate"
                                            type="datetime-local"
                                            value={newLesson.dueDate}
                                            onChange={(e) =>
                                                setNewLesson((prev) => ({ ...prev, dueDate: e.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="editMaxScore">Pontuação Máxima</Label>
                                        <Input
                                            id="editMaxScore"
                                            type="number"
                                            min="0"
                                            placeholder="100"
                                            value={newLesson.maxScore}
                                            onChange={(e) =>
                                                setNewLesson((prev) => ({ ...prev, maxScore: parseInt(e.target.value) || 100 }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="editExamDuration">Tempo estimado (minutos)</Label>
                                    <Input
                                        id="editExamDuration"
                                        type="number"
                                        min="1"
                                        placeholder="60"
                                        value={newLesson.duration || ""}
                                        onChange={(e) =>
                                            setNewLesson((prev) => ({ ...prev, duration: parseInt(e.target.value) || 0 }))
                                        }
                                    />
                                </div>

                                {/* Gerenciar Questões */}
                                {selectedLessonId && (
                                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <BookOpen className="h-5 w-5 text-green-600" />
                                                <div>
                                                    <h5 className="font-medium text-green-900 dark:text-green-100">
                                                        Gerenciar Questões
                                                    </h5>
                                                    <p className="text-sm text-green-700 dark:text-green-300">
                                                        Acesse o gerenciador de quizzes para adicionar ou editar as questões
                                                    </p>
                                                </div>
                                            </div>
                                            <Link
                                                href="/professor/quizzes"
                                                target="_blank"
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                                            >
                                                Ir para construtor de Provas
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Free lesson toggle */}
                        <div className="flex items-center justify-between border-t pt-4">
                            <div className="space-y-0.5">
                                <Label>Aula Gratuita</Label>
                                <p className="text-xs text-muted-foreground">
                                    Disponível para preview sem matrícula
                                </p>
                            </div>
                            <Switch
                                checked={newLesson.isFree}
                                onCheckedChange={(checked) =>
                                    setNewLesson((prev) => ({ ...prev, isFree: checked }))
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditLessonDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdateLesson} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Lesson Dialog */}
            <Dialog open={deleteLessonDialogOpen} onOpenChange={setDeleteLessonDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir Aula</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteLessonDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteLesson} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Excluir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
