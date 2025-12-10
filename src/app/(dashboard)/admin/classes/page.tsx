"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Users,
    Search,
    Plus,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    GraduationCap,
    Loader2,
    Calendar,
    UserPlus,
    BookOpen,
    Settings,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Id } from "@convex/_generated/dataModel";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
};

const enrollmentTypeLabels: Record<string, string> = {
    manual: "Manual",
    open: "Aberta",
    token: "Por Token",
    approval: "Com Aprovação",
};

export default function AdminClassesPage() {
    const { user } = useUser();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [deleteId, setDeleteId] = useState<Id<"classes"> | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    // Form state for new class
    const [newClass, setNewClass] = useState({
        courseId: "" as Id<"courses"> | "",
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        capacity: "",
        enrollmentType: "manual" as "manual" | "open" | "token" | "approval",
        requiresApproval: false,
    });

    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    const anyOrganization = useQuery(
        api.users.getOrCreateUserOrganization,
        user?.id ? { clerkId: user.id } : "skip"
    );

    const effectiveOrgId = convexUser?.organizationId || anyOrganization?._id;

    // Get classes
    const classes = useQuery(
        api.classes.getAll,
        effectiveOrgId ? { organizationId: effectiveOrgId } : "skip"
    );

    // Get courses for dropdown
    const courses = useQuery(
        api.courses.getByOrganization,
        effectiveOrgId ? { organizationId: effectiveOrgId } : "skip"
    );

    const deleteClass = useMutation(api.classes.remove);
    const createClass = useMutation(api.classes.create);

    const isLoading = classes === undefined;

    // Filter classes
    const filteredClasses = (classes ?? []).filter((cls) => {
        const matchSearch = search === "" ||
            cls.name.toLowerCase().includes(search.toLowerCase()) ||
            cls.course?.title?.toLowerCase().includes(search.toLowerCase());

        const matchStatus = statusFilter === "all" ||
            (statusFilter === "active" && cls.isActive) ||
            (statusFilter === "inactive" && !cls.isActive);

        return matchSearch && matchStatus;
    });

    // Stats
    const totalClasses = classes?.length ?? 0;
    const activeClasses = classes?.filter(c => c.isActive).length ?? 0;
    const totalEnrolled = classes?.reduce((acc, c) => acc + (c.enrolledCount || 0), 0) ?? 0;

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteClass({ classId: deleteId });
            toast.success("Turma removida com sucesso!");
            setDeleteId(null);
        } catch {
            toast.error("Erro ao remover turma");
        }
    };

    const handleCreate = async () => {
        if (!newClass.courseId || !newClass.name || !newClass.startDate) {
            toast.error("Preencha os campos obrigatórios");
            return;
        }

        try {
            await createClass({
                courseId: newClass.courseId as Id<"courses">,
                name: newClass.name,
                description: newClass.description || undefined,
                startDate: new Date(newClass.startDate).getTime(),
                endDate: newClass.endDate ? new Date(newClass.endDate).getTime() : undefined,
                capacity: newClass.capacity ? parseInt(newClass.capacity) : undefined,
                enrollmentType: newClass.enrollmentType,
                requiresApproval: newClass.requiresApproval,
            });
            toast.success("Turma criada com sucesso!");
            setCreateDialogOpen(false);
            setNewClass({
                courseId: "",
                name: "",
                description: "",
                startDate: "",
                endDate: "",
                capacity: "",
                enrollmentType: "manual",
                requiresApproval: false,
            });
        } catch (error: any) {
            toast.error(error.message || "Erro ao criar turma");
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Turmas</h1>
                    <p className="text-muted-foreground">Gerencie as turmas da organização</p>
                </div>
                <Button className="gap-2 gradient-bg border-0" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Nova Turma
                </Button>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{totalClasses}</p>
                                <p className="text-sm text-muted-foreground">Total de Turmas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{activeClasses}</p>
                                <p className="text-sm text-muted-foreground">Turmas Ativas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <GraduationCap className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{totalEnrolled}</p>
                                <p className="text-sm text-muted-foreground">Alunos Inscritos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Filters */}
            <motion.div variants={item} className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar turma ou curso..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="active">Ativas</SelectItem>
                        <SelectItem value="inactive">Inativas</SelectItem>
                    </SelectContent>
                </Select>
            </motion.div>

            {/* Classes List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredClasses.length === 0 ? (
                <motion.div variants={item} className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                        {search || statusFilter !== "all" ? "Nenhum resultado encontrado" : "Nenhuma turma ainda"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        {search || statusFilter !== "all"
                            ? "Tente ajustar os filtros"
                            : "Crie sua primeira turma para começar"}
                    </p>
                    {!(search || statusFilter !== "all") && (
                        <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="h-4 w-4" />
                            Criar Turma
                        </Button>
                    )}
                </motion.div>
            ) : (
                <>
                    {/* Mobile Grid View */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                        {filteredClasses.map((cls) => (
                            <Card key={cls._id} className="overflow-hidden hover:shadow-lg transition-all">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium text-sm line-clamp-1">{cls.name}</h3>
                                                <Badge variant={cls.isActive ? "default" : "secondary"} className="text-xs">
                                                    {cls.isActive ? "Ativa" : "Inativa"}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                {cls.course?.title || "Sem curso"}
                                            </p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <Link href={`/admin/classes/${cls._id}`}>
                                                    <DropdownMenuItem className="gap-2">
                                                        <Settings className="h-4 w-4" />
                                                        Gerenciar
                                                    </DropdownMenuItem>
                                                </Link>
                                                <DropdownMenuItem
                                                    className="gap-2 text-destructive"
                                                    onClick={() => setDeleteId(cls._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="flex flex-wrap gap-1">
                                        <Badge variant="outline" className="text-xs">
                                            {enrollmentTypeLabels[cls.enrollmentType]}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <GraduationCap className="h-3 w-3" />
                                            {cls.enrolledCount || 0} alunos
                                        </span>
                                        {cls.pendingCount > 0 && (
                                            <span className="flex items-center gap-1 text-amber-500">
                                                <UserPlus className="h-3 w-3" />
                                                {cls.pendingCount} pendentes
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(cls.startDate)}
                                        {cls.endDate && ` - ${formatDate(cls.endDate)}`}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Desktop List View */}
                    <div className="hidden md:grid gap-4">
                        {filteredClasses.map((cls) => (
                            <Card key={cls._id} className="hover:shadow-lg transition-all">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            {cls.course?.thumbnail ? (
                                                <img src={cls.course.thumbnail} alt="" className="h-full w-full object-cover rounded-lg" />
                                            ) : (
                                                <Users className="h-8 w-8 text-primary" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium truncate">{cls.name}</h3>
                                                <Badge variant={cls.isActive ? "default" : "secondary"}>
                                                    {cls.isActive ? "Ativa" : "Inativa"}
                                                </Badge>
                                                <Badge variant="outline">{enrollmentTypeLabels[cls.enrollmentType]}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                Curso: {cls.course?.title || "Sem curso"}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <GraduationCap className="h-3 w-3" />
                                                    {cls.enrolledCount || 0} alunos
                                                </span>
                                                {cls.pendingCount > 0 && (
                                                    <span className="flex items-center gap-1 text-amber-500">
                                                        <UserPlus className="h-3 w-3" />
                                                        {cls.pendingCount} pendentes
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(cls.startDate)}
                                                    {cls.endDate && ` - ${formatDate(cls.endDate)}`}
                                                </span>
                                                {cls.capacity && (
                                                    <span>
                                                        Capacidade: {cls.enrolledCount}/{cls.capacity}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Link href={`/admin/classes/${cls._id}`}>
                                                <Button variant="outline" size="sm" className="gap-2">
                                                    <Settings className="h-4 w-4" />
                                                    Gerenciar
                                                </Button>
                                            </Link>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <Link href={`/admin/classes/${cls._id}`}>
                                                        <DropdownMenuItem className="gap-2">
                                                            <Eye className="h-4 w-4" />
                                                            Ver Detalhes
                                                        </DropdownMenuItem>
                                                    </Link>
                                                    <DropdownMenuItem
                                                        className="gap-2 text-destructive"
                                                        onClick={() => setDeleteId(cls._id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Nova Turma</DialogTitle>
                        <DialogDescription>
                            Crie uma nova turma para um curso existente
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="course">Curso *</Label>
                            <Select
                                value={newClass.courseId}
                                onValueChange={(value) => setNewClass({ ...newClass, courseId: value as Id<"courses"> })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o curso" />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses?.map((course) => (
                                        <SelectItem key={course._id} value={course._id}>
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Turma *</Label>
                            <Input
                                id="name"
                                value={newClass.name}
                                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                                placeholder="Ex: Turma 2024.1"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                value={newClass.description}
                                onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                                placeholder="Descrição da turma..."
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Data Início *</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={newClass.startDate}
                                    onChange={(e) => setNewClass({ ...newClass, startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">Data Fim</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={newClass.endDate}
                                    onChange={(e) => setNewClass({ ...newClass, endDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="capacity">Capacidade</Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    value={newClass.capacity}
                                    onChange={(e) => setNewClass({ ...newClass, capacity: e.target.value })}
                                    placeholder="Ilimitado"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="enrollmentType">Tipo de Inscrição</Label>
                                <Select
                                    value={newClass.enrollmentType}
                                    onValueChange={(value: "manual" | "open" | "token" | "approval") =>
                                        setNewClass({ ...newClass, enrollmentType: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manual">Manual</SelectItem>
                                        <SelectItem value="open">Aberta</SelectItem>
                                        <SelectItem value="token">Por Token</SelectItem>
                                        <SelectItem value="approval">Com Aprovação</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreate} className="gradient-bg border-0">
                            Criar Turma
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir esta turma? Esta ação irá remover todas as inscrições e o progresso dos alunos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
}
