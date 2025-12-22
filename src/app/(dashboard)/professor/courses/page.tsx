"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
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
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Users,
    Eye,
    Play,
    Clock,
    Loader2,
    GraduationCap,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Id } from "@convex/_generated/dataModel";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

const levelLabels = {
    beginner: "Iniciante",
    intermediate: "Intermediário",
    advanced: "Avançado",
};

const levelColors = {
    beginner: "bg-emerald-500/10 text-emerald-600",
    intermediate: "bg-amber-500/10 text-amber-600",
    advanced: "bg-red-500/10 text-red-600",
};

export default function ProfessorCoursesPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [courseToDelete, setCourseToDelete] = useState<Id<"courses"> | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { user, isLoaded: isUserLoaded } = useUser();

    // Get instructor ID from Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get courses by instructor
    const courses = useQuery(
        api.courses.getByInstructor,
        convexUser?._id ? { instructorId: convexUser._id } : "skip"
    );

    // Mutation to delete course
    const removeCourse = useMutation(api.courses.remove);

    // Debug: Log para verificar estados
    console.log("[ProfessorCoursesPage] Debug:", {
        isUserLoaded,
        clerkUserId: user?.id,
        convexUser: convexUser ? { id: convexUser._id, email: convexUser.email, role: convexUser.role } : null,
        coursesCount: courses?.length,
    });

    // Melhor tratamento de estado de loading
    const isLoadingUser = !isUserLoaded || (user?.id && convexUser === undefined);
    const isLoadingCourses = convexUser?._id && courses === undefined;
    const isLoading = isLoadingUser || isLoadingCourses;

    // Verificar se usuário não está registrado no Convex
    const userNotFound = isUserLoaded && user?.id && convexUser === null;

    const filteredCourses = (courses || []).filter((course) =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const publishedCount = filteredCourses.filter(c => c.isPublished).length;
    const draftCount = filteredCourses.filter(c => !c.isPublished).length;

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}min`;
        return `${hours}h ${mins}min`;
    };

    const handleDeleteCourse = async () => {
        if (!courseToDelete) return;

        setIsDeleting(true);
        try {
            await removeCourse({ courseId: courseToDelete });
            toast.success("Curso excluído com sucesso!");
            setCourseToDelete(null);
        } catch (error) {
            toast.error("Erro ao excluir curso");
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Meus Cursos</h1>
                    <p className="text-muted-foreground">Gerencie seus cursos e conteúdo</p>
                </div>
                <Link href="/professor/courses/new">
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
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{filteredCourses.length}</p>
                                <p className="text-sm text-muted-foreground">Total de Cursos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Eye className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{publishedCount}</p>
                                <p className="text-sm text-muted-foreground">Publicados</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <Edit className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{draftCount}</p>
                                <p className="text-sm text-muted-foreground">Rascunhos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Search */}
            <motion.div variants={item}>
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar cursos..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
            </motion.div>

            {/* Courses Grid */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Carregando cursos...</p>
                </div>
            ) : userNotFound ? (
                <motion.div variants={item} className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-destructive/60 mb-4" />
                    <h3 className="text-lg font-medium text-destructive">Usuário não encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                        Seu usuário não está registrado no sistema. Entre em contato com o administrador.
                    </p>
                </motion.div>
            ) : filteredCourses.length === 0 ? (
                <motion.div variants={item} className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhum curso ainda</h3>
                    <p className="text-muted-foreground mb-4">Comece criando seu primeiro curso</p>
                    <Link href="/professor/courses/new">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Criar Curso
                        </Button>
                    </Link>
                </motion.div>
            ) : (
                <motion.div variants={item} className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCourses.map((course) => (
                        <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-all group">
                            {/* Thumbnail */}
                            <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <GraduationCap className="h-12 w-12 text-primary/40" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    <Badge className={course.isPublished ? "bg-emerald-500" : "bg-amber-500"}>
                                        {course.isPublished ? "Publicado" : "Rascunho"}
                                    </Badge>
                                </div>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Link href={`/professor/courses/${course._id}`}>
                                        <Button size="sm" variant="secondary">
                                            <Edit className="h-4 w-4 mr-1" />
                                            Editar
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-base line-clamp-1">{course.title}</CardTitle>
                                        <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Badge variant="outline" className={cn("text-xs", levelColors[course.level])}>
                                        {levelLabels[course.level]}
                                    </Badge>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        {formatDuration(course.duration)}
                                    </span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{course.category}</span>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Link href={`/professor/courses/${course._id}`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Edit className="h-3.5 w-3.5 mr-1" />
                                            Gerenciar
                                        </Button>
                                    </Link>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <MoreVertical className="h-3.5 w-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => router.push(`/professor/courses/${course._id}`)}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                Visualizar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => router.push(`/professor/courses/${course._id}/edit`)}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Editar Conteúdo
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => router.push(`/professor/students?courseId=${course._id}`)}>
                                                <Users className="h-4 w-4 mr-2" />
                                                Ver Alunos
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => setCourseToDelete(course._id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </motion.div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.
                            Todos os módulos, aulas e matrículas serão removidos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteCourse}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Excluindo...
                                </>
                            ) : (
                                "Excluir Curso"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
}
