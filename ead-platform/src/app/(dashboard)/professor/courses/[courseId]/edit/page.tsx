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
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

// Mock course data
const initialCourse = {
    id: "1",
    title: "Fundamentos de JavaScript",
    description: "Aprenda os fundamentos da linguagem JavaScript do zero",
    category: "Programação",
    level: "beginner",
    thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=225&fit=crop",
    isPublished: false,
    modules: [
        {
            id: "m1",
            title: "Introdução ao JavaScript",
            description: "Primeiros passos com a linguagem",
            isExpanded: true,
            lessons: [
                {
                    id: "l1",
                    title: "Bem-vindo ao curso",
                    type: "video",
                    videoUrl: "https://www.youtube.com/watch?v=example1",
                    duration: 180,
                    isPublished: true,
                    isFree: true,
                },
                {
                    id: "l2",
                    title: "O que é JavaScript?",
                    type: "video",
                    videoUrl: "https://www.youtube.com/watch?v=example2",
                    duration: 420,
                    isPublished: true,
                    isFree: false,
                },
            ],
        },
        {
            id: "m2",
            title: "Variáveis e Tipos de Dados",
            description: "Entendendo como armazenar dados",
            isExpanded: false,
            lessons: [
                {
                    id: "l3",
                    title: "Declarando variáveis",
                    type: "video",
                    videoUrl: "https://www.youtube.com/watch?v=example3",
                    duration: 600,
                    isPublished: false,
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

export default function EditCoursePage({
    params,
}: {
    params: { courseId: string };
}) {
    const [course, setCourse] = useState(initialCourse);
    const [activeTab, setActiveTab] = useState("content");
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Dialog states
    const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
    const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [editingModule, setEditingModule] = useState<any>(null);
    const [editingLesson, setEditingLesson] = useState<any>(null);

    // Form states
    const [moduleForm, setModuleForm] = useState({ title: "", description: "" });
    const [lessonForm, setLessonForm] = useState({
        title: "",
        videoUrl: "",
        duration: "",
        isFree: false,
    });

    const toggleModule = (moduleId: string) => {
        setCourse((prev) => ({
            ...prev,
            modules: prev.modules.map((m) =>
                m.id === moduleId ? { ...m, isExpanded: !m.isExpanded } : m
            ),
        }));
    };

    const openAddModule = () => {
        setEditingModule(null);
        setModuleForm({ title: "", description: "" });
        setModuleDialogOpen(true);
    };

    const openEditModule = (module: any) => {
        setEditingModule(module);
        setModuleForm({ title: module.title, description: module.description || "" });
        setModuleDialogOpen(true);
    };

    const saveModule = () => {
        if (editingModule) {
            // Edit existing module
            setCourse((prev) => ({
                ...prev,
                modules: prev.modules.map((m) =>
                    m.id === editingModule.id
                        ? { ...m, title: moduleForm.title, description: moduleForm.description }
                        : m
                ),
            }));
        } else {
            // Add new module
            const newModule = {
                id: `m${Date.now()}`,
                title: moduleForm.title,
                description: moduleForm.description,
                isExpanded: true,
                lessons: [],
            };
            setCourse((prev) => ({
                ...prev,
                modules: [...prev.modules, newModule],
            }));
        }
        setModuleDialogOpen(false);
        setHasChanges(true);
    };

    const deleteModule = (moduleId: string) => {
        setCourse((prev) => ({
            ...prev,
            modules: prev.modules.filter((m) => m.id !== moduleId),
        }));
        setHasChanges(true);
    };

    const openAddLesson = (moduleId: string) => {
        setSelectedModuleId(moduleId);
        setEditingLesson(null);
        setLessonForm({ title: "", videoUrl: "", duration: "", isFree: false });
        setLessonDialogOpen(true);
    };

    const openEditLesson = (moduleId: string, lesson: any) => {
        setSelectedModuleId(moduleId);
        setEditingLesson(lesson);
        setLessonForm({
            title: lesson.title,
            videoUrl: lesson.videoUrl || "",
            duration: String(Math.floor(lesson.duration / 60)),
            isFree: lesson.isFree,
        });
        setLessonDialogOpen(true);
    };

    const saveLesson = () => {
        const durationInSeconds = parseInt(lessonForm.duration) * 60 || 0;

        if (editingLesson) {
            // Edit existing lesson
            setCourse((prev) => ({
                ...prev,
                modules: prev.modules.map((m) =>
                    m.id === selectedModuleId
                        ? {
                            ...m,
                            lessons: m.lessons.map((l: any) =>
                                l.id === editingLesson.id
                                    ? {
                                        ...l,
                                        title: lessonForm.title,
                                        videoUrl: lessonForm.videoUrl,
                                        duration: durationInSeconds,
                                        isFree: lessonForm.isFree,
                                    }
                                    : l
                            ),
                        }
                        : m
                ),
            }));
        } else {
            // Add new lesson
            const newLesson = {
                id: `l${Date.now()}`,
                title: lessonForm.title,
                type: "video",
                videoUrl: lessonForm.videoUrl,
                duration: durationInSeconds,
                isPublished: false,
                isFree: lessonForm.isFree,
            };
            setCourse((prev) => ({
                ...prev,
                modules: prev.modules.map((m) =>
                    m.id === selectedModuleId
                        ? { ...m, lessons: [...m.lessons, newLesson] }
                        : m
                ),
            }));
        }
        setLessonDialogOpen(false);
        setHasChanges(true);
    };

    const deleteLesson = (moduleId: string, lessonId: string) => {
        setCourse((prev) => ({
            ...prev,
            modules: prev.modules.map((m) =>
                m.id === moduleId
                    ? { ...m, lessons: m.lessons.filter((l: any) => l.id !== lessonId) }
                    : m
            ),
        }));
        setHasChanges(true);
    };

    const toggleLessonPublish = (moduleId: string, lessonId: string) => {
        setCourse((prev) => ({
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
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        // TODO: Call Convex mutation to save course
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSaving(false);
        setHasChanges(false);
    };

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
                                                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                                                            <Video className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">{lesson.title}</span>
                                                                {lesson.isFree && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        Grátis
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <Clock className="h-3 w-3" />
                                                                {formatDuration(lesson.duration)}
                                                            </div>
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

                <TabsContent value="settings" className="mt-4">
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
