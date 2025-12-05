"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";

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

export default function AdminCourseEditPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as Id<"courses">;

    const [isLoading, setIsLoading] = useState(false);
    const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
    const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState<Id<"modules"> | null>(null);
    const [newModuleTitle, setNewModuleTitle] = useState("");
    const [newModuleDescription, setNewModuleDescription] = useState("");
    const [newLesson, setNewLesson] = useState({
        title: "",
        description: "",
        videoUrl: "",
        videoProvider: "youtube" as "youtube" | "bunny" | "upload",
        duration: 0,
        isFree: false,
    });

    // Queries
    const course = useQuery(api.courses.getWithContent, { courseId });

    // Mutations
    const updateCourse = useMutation(api.courses.update);
    const createModule = useMutation(api.courses.createModule);
    const createLesson = useMutation(api.courses.createLesson);

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

    const handleCreateLesson = async () => {
        if (!selectedModuleId || !newLesson.title.trim()) {
            toast.error("Preencha os campos obrigatórios");
            return;
        }

        setIsLoading(true);
        try {
            await createLesson({
                moduleId: selectedModuleId,
                courseId,
                title: newLesson.title,
                description: newLesson.description || undefined,
                videoUrl: newLesson.videoUrl || undefined,
                videoProvider: newLesson.videoProvider,
                duration: newLesson.duration * 60, // Convert minutes to seconds
                isFree: newLesson.isFree,
            });
            toast.success("Aula criada com sucesso!");
            setNewLesson({
                title: "",
                description: "",
                videoUrl: "",
                videoProvider: "youtube",
                duration: 0,
                isFree: false,
            });
            setLessonDialogOpen(false);
            setSelectedModuleId(null);
        } catch (error: any) {
            toast.error(error.message || "Erro ao criar aula");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        }
        return `${minutes}min`;
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
            <motion.div variants={item} className="space-y-4">
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
                                                        <Video className="h-4 w-4 text-muted-foreground" />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span>{lesson.title}</span>
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

            {/* Lesson Dialog */}
            <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Criar Nova Aula</DialogTitle>
                        <DialogDescription>
                            Adicione uma aula ao módulo selecionado
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
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

                        <div className="space-y-2">
                            <Label htmlFor="videoUrl">URL do Vídeo</Label>
                            <Input
                                id="videoUrl"
                                placeholder="https://youtube.com/watch?v=..."
                                value={newLesson.videoUrl}
                                onChange={(e) => setNewLesson((prev) => ({ ...prev, videoUrl: e.target.value }))}
                            />
                        </div>

                        <div className="flex items-center justify-between">
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
        </motion.div>
    );
}
