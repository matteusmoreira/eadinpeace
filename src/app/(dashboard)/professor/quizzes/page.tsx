"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    Copy,
    Users,
    Clock,
    BookOpen,
    Target,
    HelpCircle,
    Loader2,
    FileText,
    CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function ProfessorQuizzesPage() {
    const { user } = useUser();
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [quizToDelete, setQuizToDelete] = useState<Id<"quizzes"> | null>(null);

    // Get current user
    const currentUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Determinar a role do usuário
    const isSuperadmin = currentUser?.role === "superadmin";
    const isAdmin = currentUser?.role === "admin";
    const isProfessor = currentUser?.role === "professor";

    // Verificar se o admin tem um organizationId válido
    const hasValidOrgId = isAdmin && currentUser?.organizationId !== undefined && currentUser?.organizationId !== null;

    // Superadmins podem ver tudo, admins sem org também veem tudo, professores veem apenas os seus
    const allQuizzes = useQuery(
        api.quizzes.getAll,
        isSuperadmin || (isAdmin && !hasValidOrgId) ? {} : "skip"
    );

    const orgQuizzes = useQuery(
        api.quizzes.getByOrganization,
        hasValidOrgId && currentUser?.organizationId
            ? { organizationId: currentUser.organizationId }
            : "skip"
    );

    const instructorQuizzes = useQuery(
        api.quizzes.getByInstructor,
        isProfessor && currentUser?._id
            ? { instructorId: currentUser._id }
            : "skip"
    );

    // Selecionar a lista correta baseado na role
    const quizzes = isSuperadmin || (isAdmin && !hasValidOrgId)
        ? allQuizzes
        : isAdmin && hasValidOrgId
            ? orgQuizzes
            : instructorQuizzes;

    // Mutations
    const removeQuiz = useMutation(api.quizzes.remove);
    const publishQuiz = useMutation(api.quizzes.publish);
    const unpublishQuiz = useMutation(api.quizzes.unpublish);

    const isLoading = quizzes === undefined;

    const filteredQuizzes = (quizzes || []).filter((quiz) =>
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.courseName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async () => {
        if (!quizToDelete) return;
        try {
            await removeQuiz({ quizId: quizToDelete });
            toast.success("Prova excluída com sucesso!");
            setQuizToDelete(null);
            setDeleteDialogOpen(false);
        } catch (error) {
            toast.error("Erro ao excluir prova");
        }
    };

    const handleTogglePublish = async (quizId: Id<"quizzes">, isPublished: boolean) => {
        try {
            if (isPublished) {
                await unpublishQuiz({ quizId });
                toast.success("Prova despublicada!");
            } else {
                await publishQuiz({ quizId });
                toast.success("Prova publicada!");
            }
        } catch (error) {
            toast.error("Erro ao alterar status da prova");
        }
    };

    const handleDuplicate = async (quiz: any) => {
        toast.info("Funcionalidade em desenvolvimento");
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Stats
    const stats = {
        total: quizzes?.length || 0,
        published: quizzes?.filter(q => q.isPublished).length || 0,
        totalQuestions: quizzes?.reduce((acc, q) => acc + (q.questionCount || 0), 0) || 0,
        totalAttempts: quizzes?.reduce((acc, q) => acc + (q.attemptCount || 0), 0) || 0,
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Construtor de Provas</h1>
                    <p className="text-muted-foreground">
                        Crie e gerencie as provas dos seus cursos
                    </p>
                </div>
                <Link href="/professor/quizzes/create">
                    <Button className="gap-2 gradient-bg border-0">
                        <Plus className="h-4 w-4" />
                        Nova Prova
                    </Button>
                </Link>
            </motion.div>

            {/* Stats Cards */}
            <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total de Provas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.published}</p>
                                <p className="text-sm text-muted-foreground">Publicadas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <HelpCircle className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.totalQuestions}</p>
                                <p className="text-sm text-muted-foreground">Questões</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <Users className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.totalAttempts}</p>
                                <p className="text-sm text-muted-foreground">Tentativas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Search */}
            <motion.div variants={item}>
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar provas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </motion.div>

            {/* Quiz List */}
            {filteredQuizzes.length === 0 ? (
                <motion.div variants={item}>
                    <Card className="p-12">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">
                                {searchQuery ? "Nenhuma prova encontrada" : "Nenhuma prova criada"}
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                {searchQuery
                                    ? "Tente buscar com outros termos"
                                    : "Crie sua primeira prova para avaliar seus alunos"
                                }
                            </p>
                            {!searchQuery && (
                                <Link href="/professor/quizzes/create">
                                    <Button className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Criar Primeira Prova
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </Card>
                </motion.div>
            ) : (
                <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredQuizzes.map((quiz) => (
                        <Card key={quiz._id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/professor/quizzes/${quiz._id}/edit`}>
                                            <h3 className="font-semibold text-foreground hover:text-primary transition-colors truncate">
                                                {quiz.title}
                                            </h3>
                                        </Link>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {quiz.courseName || "Sem curso"}
                                        </p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/professor/quizzes/${quiz._id}/edit`}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Editar
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleTogglePublish(quiz._id, quiz.isPublished)}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                {quiz.isPublished ? "Despublicar" : "Publicar"}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDuplicate(quiz)}>
                                                <Copy className="h-4 w-4 mr-2" />
                                                Duplicar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => {
                                                    setQuizToDelete(quiz._id);
                                                    setDeleteDialogOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Status */}
                                <div className="flex items-center gap-2 mb-4">
                                    <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                                        {quiz.isPublished ? "Publicada" : "Rascunho"}
                                    </Badge>
                                    {(quiz.questionCount || 0) === 0 && (
                                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                                            Sem questões
                                        </Badge>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <HelpCircle className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                        <p className="text-sm font-medium">{quiz.questionCount || 0}</p>
                                        <p className="text-xs text-muted-foreground">Questões</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                        <p className="text-sm font-medium">{quiz.attemptCount || 0}</p>
                                        <p className="text-xs text-muted-foreground">Tentativas</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <Target className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                        <p className="text-sm font-medium">{quiz.avgScore || 0}%</p>
                                        <p className="text-xs text-muted-foreground">Média</p>
                                    </div>
                                </div>

                                {/* Footer with config info */}
                                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{quiz.timeLimit ? `${Math.floor(quiz.timeLimit / 60)} min` : "Sem limite"}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Target className="h-3 w-3" />
                                        <span>Mínimo: {quiz.passingScore}%</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </motion.div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Prova</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir esta prova? Esta ação não pode ser desfeita.
                            Todas as questões e tentativas serão perdidas.
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
        </motion.div>
    );
}
