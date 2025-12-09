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
    BookOpen,
    Search,
    Plus,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    Users,
    Play,
    Loader2,
    GraduationCap,
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

const levelLabels: Record<string, string> = {
    beginner: "Iniciante",
    intermediate: "Intermediário",
    advanced: "Avançado",
};

export default function AdminCoursesPage() {
    const { user } = useUser();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [deleteId, setDeleteId] = useState<Id<"courses"> | null>(null);

    // Get Convex user
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

    // Get organization courses
    const courses = useQuery(
        api.courses.getByOrganization,
        effectiveOrgId ? { organizationId: effectiveOrgId } : "skip"
    );

    const deleteCourse = useMutation(api.courses.remove);

    const isLoading = courses === undefined;

    // Filter courses
    const filteredCourses = (courses ?? []).filter((course) => {
        const matchSearch = search === "" ||
            course.title.toLowerCase().includes(search.toLowerCase()) ||
            course.description?.toLowerCase().includes(search.toLowerCase());

        const matchStatus = statusFilter === "all" ||
            (statusFilter === "published" && course.isPublished) ||
            (statusFilter === "draft" && !course.isPublished);

        return matchSearch && matchStatus;
    });

    // Stats
    const totalCourses = courses?.length ?? 0;
    const publishedCourses = courses?.filter(c => c.isPublished).length ?? 0;
    const totalEnrollments = courses?.reduce((acc, c) => acc + (c.enrollmentCount || 0), 0) ?? 0;

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteCourse({ courseId: deleteId });
            toast.success("Curso removido com sucesso!");
            setDeleteId(null);
        } catch {
            toast.error("Erro ao remover curso");
        }
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours === 0) return `${mins}min`;
        return `${hours}h ${mins}min`;
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Cursos</h1>
                    <p className="text-muted-foreground">Gerencie os cursos da organização</p>
                </div>
                <Link href="/admin/courses/new">
                    <Button className="gap-2 gradient-bg border-0">
                        <Plus className="h-4 w-4" />
                        Novo Curso
                    </Button>
                </Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{totalCourses}</p>
                                <p className="text-sm text-muted-foreground">Total de Cursos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Play className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{publishedCourses}</p>
                                <p className="text-sm text-muted-foreground">Publicados</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{totalEnrollments}</p>
                                <p className="text-sm text-muted-foreground">Total Matrículas</p>
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
                        placeholder="Buscar curso..."
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
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="published">Publicados</SelectItem>
                        <SelectItem value="draft">Rascunhos</SelectItem>
                    </SelectContent>
                </Select>
            </motion.div>

            {/* Courses List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredCourses.length === 0 ? (
                <motion.div variants={item} className="text-center py-12">
                    <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                        {search || statusFilter !== "all" ? "Nenhum resultado encontrado" : "Nenhum curso ainda"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        {search || statusFilter !== "all"
                            ? "Tente ajustar os filtros"
                            : "Crie seu primeiro curso para começar"}
                    </p>
                    {!(search || statusFilter !== "all") && (
                        <Link href="/admin/courses/new">
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Criar Curso
                            </Button>
                        </Link>
                    )}
                </motion.div>
            ) : (
                <>
                    {/* Mobile Grid View */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                        {filteredCourses.map((course) => (
                            <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-all">
                                {/* Thumbnail */}
                                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative">
                                    {course.thumbnail ? (
                                        <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <GraduationCap className="h-12 w-12 text-primary/40" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <Badge variant={course.isPublished ? "default" : "secondary"} className="text-xs">
                                            {course.isPublished ? "Publicado" : "Rascunho"}
                                        </Badge>
                                    </div>
                                </div>

                                <CardContent className="p-3 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-medium text-sm line-clamp-1">{course.title}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{course.description}</p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <Link href={`/admin/courses/${course._id}`}>
                                                    <DropdownMenuItem className="gap-2">
                                                        <Edit className="h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                </Link>
                                                <Link href={`/student/courses/${course._id}`} target="_blank">
                                                    <DropdownMenuItem className="gap-2">
                                                        <Eye className="h-4 w-4" />
                                                        Visualizar
                                                    </DropdownMenuItem>
                                                </Link>
                                                <DropdownMenuItem
                                                    className="gap-2 text-destructive"
                                                    onClick={() => setDeleteId(course._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="flex flex-wrap gap-1">
                                        <Badge variant="outline" className="text-xs">{levelLabels[course.level]}</Badge>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {course.enrollmentCount || 0}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Play className="h-3 w-3" />
                                            {course.lessonCount || 0}
                                        </span>
                                        <span>{formatDuration(course.duration)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Desktop List View */}
                    <div className="hidden md:grid gap-4">
                        {filteredCourses.map((course) => (
                            <Card key={course._id} className="hover:shadow-lg transition-all">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-24 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            {course.thumbnail ? (
                                                <img src={course.thumbnail} alt="" className="h-full w-full object-cover rounded-lg" />
                                            ) : (
                                                <GraduationCap className="h-8 w-8 text-primary" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium truncate">{course.title}</h3>
                                                <Badge variant={course.isPublished ? "default" : "secondary"}>
                                                    {course.isPublished ? "Publicado" : "Rascunho"}
                                                </Badge>
                                                <Badge variant="outline">{levelLabels[course.level]}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {course.description}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <GraduationCap className="h-3 w-3" />
                                                    {course.instructor?.firstName} {course.instructor?.lastName}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {course.enrollmentCount || 0} alunos
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Play className="h-3 w-3" />
                                                    {course.lessonCount || 0} aulas
                                                </span>
                                                <span>{formatDuration(course.duration)}</span>
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <Link href={`/admin/courses/${course._id}`}>
                                                    <DropdownMenuItem className="gap-2">
                                                        <Edit className="h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                </Link>
                                                <Link href={`/student/courses/${course._id}`} target="_blank">
                                                    <DropdownMenuItem className="gap-2">
                                                        <Eye className="h-4 w-4" />
                                                        Visualizar
                                                    </DropdownMenuItem>
                                                </Link>
                                                <DropdownMenuItem
                                                    className="gap-2 text-destructive"
                                                    onClick={() => setDeleteId(course._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.
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
