"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    ArrowLeft,
    Save,
    Loader2,
    BookOpen,
    Plus,
    Play,
    Trash2,
    GripVertical,
    Eye,
    Clock,
    Video,
    ChevronRight,
    Settings,
} from "lucide-react";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function EditCoursePage(props: { params: Promise<{ courseId: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const courseId = params.courseId as Id<"courses">;

    const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
    const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState<Id<"modules"> | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [newModule, setNewModule] = useState({ title: "", description: "" });
    const [newLesson, setNewLesson] = useState({
        title: "",
        description: "",
        videoUrl: "",
        duration: 0,
        isFree: false,
    });

    // Queries
    const courseWithContent = useQuery(api.courses.getWithContent, { courseId });
    const courseStats = useQuery(api.courses.getStats, { courseId });

    // Mutations
    const updateCourse = useMutation(api.courses.update);
    const createModule = useMutation(api.courses.createModule);
    const createLesson = useMutation(api.courses.createLesson);


    // Estado de loading (query ainda não retornou)
    if (courseWithContent === undefined) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Carregando curso...</p>
            </div>
        );
    }

    // Curso não encontrado (query retornou null)
    if (courseWithContent === null) {
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

    const course = courseWithContent;

    const handlePublishToggle = async () => {
        try {
            await updateCourse({
                courseId,
                isPublished: !course.isPublished,
            });
            toast.success(course.isPublished ? "Curso despublicado" : "Curso publicado!");
        } catch (error) {
            toast.error("Erro ao atualizar curso");
        }
    };

    const handleAddModule = async () => {
        if (!newModule.title) return;

        setIsLoading(true);
        try {
            await createModule({
                courseId,
                title: newModule.title,
                description: newModule.description || undefined,
            });
            toast.success("Módulo criado!");
            setNewModule({ title: "", description: "" });
            setModuleDialogOpen(false);
        } catch (error) {
            toast.error("Erro ao criar módulo");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddLesson = async () => {
        if (!newLesson.title || !selectedModuleId) return;

        setIsLoading(true);
        try {
            await createLesson({
                moduleId: selectedModuleId,
                courseId,
                title: newLesson.title,
                description: newLesson.description || undefined,
                type: "video",
                videoUrl: newLesson.videoUrl || undefined,
                videoProvider: "youtube",
                duration: newLesson.duration * 60, // Convert to seconds
                isFree: newLesson.isFree,
            });
            toast.success("Aula criada!");
            setNewLesson({ title: "", description: "", videoUrl: "", duration: 0, isFree: false });
            setLessonDialogOpen(false);
        } catch (error) {
            toast.error("Erro ao criar aula");
        } finally {
            setIsLoading(false);
        }
    };

    const openLessonDialog = (moduleId: Id<"modules">) => {
        setSelectedModuleId(moduleId);
        setLessonDialogOpen(true);
    };

    const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;

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
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">{course.title}</h1>
                            <Badge className={course.isPublished ? "bg-emerald-500" : "bg-amber-500"}>
                                {course.isPublished ? "Publicado" : "Rascunho"}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            {course.modules?.length || 0} módulos • {totalLessons} aulas
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="publish" className="text-sm">Publicar</Label>
                        <Switch
                            id="publish"
                            checked={course.isPublished}
                            onCheckedChange={handlePublishToggle}
                        />
                    </div>
                    <Link href={`/professor/courses/${courseId}/preview`} target="_blank">
                        <Button variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold">{courseStats?.totalEnrollments || 0}</p>
                        <p className="text-sm text-muted-foreground">Alunos Matriculados</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold">{course.modules?.length || 0}</p>
                        <p className="text-sm text-muted-foreground">Módulos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold">{totalLessons}</p>
                        <p className="text-sm text-muted-foreground">Aulas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold">{courseStats?.completionRate || 0}%</p>
                        <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Content */}
            <motion.div variants={item}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Conteúdo do Curso</CardTitle>
                            <CardDescription>Organize módulos e aulas</CardDescription>
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
                                    <DialogTitle>Novo Módulo</DialogTitle>
                                    <DialogDescription>
                                        Adicione um novo módulo ao curso
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Título do Módulo</Label>
                                        <Input
                                            placeholder="Ex: Introdução"
                                            value={newModule.title}
                                            onChange={(e) => setNewModule(prev => ({ ...prev, title: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Descrição (opcional)</Label>
                                        <Textarea
                                            placeholder="Descreva o módulo..."
                                            value={newModule.description}
                                            onChange={(e) => setNewModule(prev => ({ ...prev, description: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button onClick={handleAddModule} disabled={isLoading || !newModule.title}>
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Módulo"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {course.modules?.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Nenhum módulo ainda</p>
                                <p className="text-sm">Comece adicionando o primeiro módulo</p>
                            </div>
                        ) : (
                            <Accordion type="multiple" className="space-y-2">
                                {course.modules?.map((module, index) => (
                                    <AccordionItem
                                        key={module._id}
                                        value={module._id}
                                        className="border rounded-lg px-4"
                                    >
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {index + 1}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-medium">{module.title}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {module.lessons?.length || 0} aulas
                                                    </p>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-2">
                                            <div className="space-y-2 ml-11">
                                                {module.lessons?.map((lesson, lessonIndex) => (
                                                    <div
                                                        key={lesson._id}
                                                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted"
                                                    >
                                                        <Play className="h-4 w-4 text-muted-foreground" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium">{lesson.title}</p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <Clock className="h-3 w-3" />
                                                                {Math.floor(lesson.duration / 60)}min
                                                                {lesson.isFree && (
                                                                    <Badge variant="secondary" className="text-xs">Grátis</Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="sm">
                                                            <Settings className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full mt-2"
                                                    onClick={() => openLessonDialog(module._id)}
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Adicionar Aula
                                                </Button>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Lesson Dialog */}
            <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Nova Aula</DialogTitle>
                        <DialogDescription>
                            Adicione uma nova aula ao módulo
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Título da Aula *</Label>
                            <Input
                                placeholder="Ex: Introdução ao JavaScript"
                                value={newLesson.title}
                                onChange={(e) => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição (opcional)</Label>
                            <Textarea
                                placeholder="Descreva a aula..."
                                value={newLesson.description}
                                onChange={(e) => setNewLesson(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL do Vídeo (YouTube)</Label>
                            <Input
                                placeholder="https://youtube.com/watch?v=..."
                                value={newLesson.videoUrl}
                                onChange={(e) => setNewLesson(prev => ({ ...prev, videoUrl: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-4 grid-cols-2">
                            <div className="space-y-2">
                                <Label>Duração (minutos)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="10"
                                    value={newLesson.duration || ""}
                                    onChange={(e) => setNewLesson(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Aula Gratuita?</Label>
                                <div className="flex items-center gap-2 pt-2">
                                    <Switch
                                        checked={newLesson.isFree}
                                        onCheckedChange={(checked) => setNewLesson(prev => ({ ...prev, isFree: checked }))}
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        {newLesson.isFree ? "Sim" : "Não"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAddLesson} disabled={isLoading || !newLesson.title}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Aula"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
