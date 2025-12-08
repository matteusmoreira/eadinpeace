"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Trophy,
    Star,
    Crown,
    Flame,
    Play,
    Target,
    Medal,
    Zap,
    Plus,
    Pencil,
    Trash2,
    Users,
    Award,
    TrendingUp,
    Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Tipos de conquistas disponíveis
const achievementTypes = [
    { value: "course_complete", label: "Completar Cursos", description: "Conquistado ao completar X cursos" },
    { value: "streak", label: "Sequência de Dias", description: "Conquistado ao estudar X dias consecutivos" },
    { value: "time_spent", label: "Tempo de Estudo", description: "Conquistado ao estudar por X horas" },
    { value: "first_lesson", label: "Primeira Aula", description: "Conquistado ao assistir a primeira aula" },
    { value: "top_student", label: "Melhor Aluno", description: "Conquistado por ser o melhor aluno" },
] as const;

// Ícones disponíveis
const availableIcons = [
    { value: "trophy", label: "Troféu", Icon: Trophy },
    { value: "star", label: "Estrela", Icon: Star },
    { value: "crown", label: "Coroa", Icon: Crown },
    { value: "flame", label: "Chama", Icon: Flame },
    { value: "play", label: "Play", Icon: Play },
    { value: "target", label: "Alvo", Icon: Target },
    { value: "medal", label: "Medalha", Icon: Medal },
    { value: "zap", label: "Raio", Icon: Zap },
    { value: "award", label: "Prêmio", Icon: Award },
] as const;

const iconMap: Record<string, React.ElementType> = {
    trophy: Trophy,
    star: Star,
    crown: Crown,
    flame: Flame,
    fire: Flame,
    play: Play,
    target: Target,
    medal: Medal,
    zap: Zap,
    award: Award,
};

type AchievementType = "course_complete" | "streak" | "time_spent" | "first_lesson" | "top_student";

interface FormData {
    name: string;
    description: string;
    icon: string;
    type: AchievementType;
    requirement: number;
    points: number;
}

const defaultFormData: FormData = {
    name: "",
    description: "",
    icon: "trophy",
    type: "course_complete",
    requirement: 1,
    points: 10,
};

export default function AchievementsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<Id<"achievements"> | null>(null);
    const [deletingId, setDeletingId] = useState<Id<"achievements"> | null>(null);
    const [formData, setFormData] = useState<FormData>(defaultFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Queries
    const achievementsStats = useQuery(api.gamification.getStats);

    // Mutations
    const createAchievement = useMutation(api.gamification.create);
    const updateAchievement = useMutation(api.gamification.update);
    const deleteAchievement = useMutation(api.gamification.remove);
    const initializeDefaults = useMutation(api.gamification.initializeDefaults);

    const isLoading = achievementsStats === undefined;

    const handleOpenCreate = () => {
        setEditingId(null);
        setFormData(defaultFormData);
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (achievement: NonNullable<typeof achievementsStats>[0]) => {
        setEditingId(achievement._id);
        setFormData({
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            type: achievement.type as AchievementType,
            requirement: achievement.requirement,
            points: achievement.points,
        });
        setIsDialogOpen(true);
    };

    const handleOpenDelete = (id: Id<"achievements">) => {
        setDeletingId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error("Nome é obrigatório");
            return;
        }
        if (!formData.description.trim()) {
            toast.error("Descrição é obrigatória");
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateAchievement({
                    id: editingId,
                    ...formData,
                });
                toast.success("Conquista atualizada com sucesso!");
            } else {
                await createAchievement(formData);
                toast.success("Conquista criada com sucesso!");
            }
            setIsDialogOpen(false);
            setFormData(defaultFormData);
            setEditingId(null);
        } catch (error) {
            toast.error("Erro ao salvar conquista");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;

        try {
            await deleteAchievement({ id: deletingId });
            toast.success("Conquista excluída com sucesso!");
            setIsDeleteDialogOpen(false);
            setDeletingId(null);
        } catch (error) {
            toast.error("Erro ao excluir conquista");
            console.error(error);
        }
    };

    const handleInitializeDefaults = async () => {
        try {
            await initializeDefaults({});
            toast.success("Conquistas padrão inicializadas!");
        } catch (error) {
            toast.error("Erro ao inicializar conquistas");
            console.error(error);
        }
    };

    // Estatísticas
    const totalAchievements = achievementsStats?.length || 0;
    const totalUnlocked = achievementsStats?.reduce((acc, a) => acc + a.unlockedCount, 0) || 0;
    const totalPoints = achievementsStats?.reduce((acc, a) => acc + a.points, 0) || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Conquistas</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie as conquistas e badges da plataforma
                    </p>
                </div>
                <div className="flex gap-2">
                    {totalAchievements === 0 && (
                        <Button variant="outline" onClick={handleInitializeDefaults}>
                            <Zap className="mr-2 h-4 w-4" />
                            Inicializar Padrão
                        </Button>
                    )}
                    <Button onClick={handleOpenCreate} className="gradient-bg">
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Conquista
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Conquistas</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAchievements}</div>
                        <p className="text-xs text-muted-foreground">
                            conquistas disponíveis
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Desbloqueios</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUnlocked}</div>
                        <p className="text-xs text-muted-foreground">
                            conquistas desbloqueadas
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pontos Totais</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPoints}</div>
                        <p className="text-xs text-muted-foreground">
                            pontos disponíveis
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Achievements Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Conquistas</CardTitle>
                    <CardDescription>
                        Todas as conquistas disponíveis na plataforma
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : achievementsStats && achievementsStats.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">Ícone</TableHead>
                                        <TableHead>Nome</TableHead>
                                        <TableHead className="hidden md:table-cell">Tipo</TableHead>
                                        <TableHead className="hidden sm:table-cell">Requisito</TableHead>
                                        <TableHead>Pontos</TableHead>
                                        <TableHead className="hidden md:table-cell">Desbloqueios</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {achievementsStats.map((achievement) => {
                                        const IconComponent = iconMap[achievement.icon] || Trophy;
                                        const typeInfo = achievementTypes.find(t => t.value === achievement.type);

                                        return (
                                            <TableRow key={achievement._id}>
                                                <TableCell>
                                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                                        <IconComponent className="h-5 w-5 text-primary" />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{achievement.name}</p>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {achievement.description}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <Badge variant="outline">
                                                        {typeInfo?.label || achievement.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    {achievement.requirement}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                                                        {achievement.points} pts
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="flex items-center gap-1">
                                                        <Users className="h-3 w-3 text-muted-foreground" />
                                                        <span>{achievement.unlockedCount}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleOpenEdit(achievement)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => handleOpenDelete(achievement._id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Trophy className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium">Nenhuma conquista cadastrada</h3>
                            <p className="text-sm text-muted-foreground mt-1 mb-4">
                                Crie conquistas para motivar seus alunos
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleInitializeDefaults}>
                                    <Zap className="mr-2 h-4 w-4" />
                                    Inicializar Padrão
                                </Button>
                                <Button onClick={handleOpenCreate}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nova Conquista
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? "Editar Conquista" : "Nova Conquista"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingId
                                ? "Atualize as informações da conquista"
                                : "Preencha os dados para criar uma nova conquista"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                                id="name"
                                placeholder="Ex: Primeiro Curso Completo"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                placeholder="Ex: Complete seu primeiro curso na plataforma"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Ícone</Label>
                                <Select
                                    value={formData.icon}
                                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableIcons.map((icon) => (
                                            <SelectItem key={icon.value} value={icon.value}>
                                                <div className="flex items-center gap-2">
                                                    <icon.Icon className="h-4 w-4" />
                                                    <span>{icon.label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Tipo</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData({ ...formData, type: value as AchievementType })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {achievementTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="requirement">Requisito</Label>
                                <Input
                                    id="requirement"
                                    type="number"
                                    min={1}
                                    placeholder="Ex: 1"
                                    value={formData.requirement}
                                    onChange={(e) => setFormData({ ...formData, requirement: parseInt(e.target.value) || 1 })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {achievementTypes.find(t => t.value === formData.type)?.description}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="points">Pontos</Label>
                                <Input
                                    id="points"
                                    type="number"
                                    min={1}
                                    placeholder="Ex: 100"
                                    value={formData.points}
                                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Pontos ganhos ao desbloquear
                                </p>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="mt-4 p-4 rounded-lg border bg-muted/50">
                            <Label className="text-xs text-muted-foreground mb-2 block">Pré-visualização</Label>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-12 w-12 rounded-xl flex items-center justify-center",
                                    "bg-gradient-to-br from-primary to-primary/60"
                                )}>
                                    {(() => {
                                        const IconComponent = iconMap[formData.icon] || Trophy;
                                        return <IconComponent className="h-6 w-6 text-white" />;
                                    })()}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{formData.name || "Nome da Conquista"}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formData.description || "Descrição da conquista"}
                                    </p>
                                </div>
                                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                                    {formData.points} pts
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="gradient-bg">
                            {isSubmitting ? (
                                "Salvando..."
                            ) : editingId ? (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Atualizar
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Criar
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Conquista</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir esta conquista? Esta ação não pode ser desfeita.
                            Todos os registros de usuários que desbloquearam esta conquista também serão removidos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
