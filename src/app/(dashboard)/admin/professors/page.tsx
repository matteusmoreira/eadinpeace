"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    GraduationCap,
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Mail,
    BookOpen,
    Users,
    Loader2,
    Eye,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

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

export default function AdminProfessorsPage() {
    const { user } = useUser();
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedProfessor, setSelectedProfessor] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Get current user to find their organization
    const currentUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get all users from organization
    const allUsers = useQuery(api.users.getByOrganization,
        currentUser?.organizationId
            ? { organizationId: currentUser.organizationId }
            : "skip"
    );

    // Get courses by organization to count per professor
    const courses = useQuery(api.courses.getByOrganization,
        currentUser?.organizationId
            ? { organizationId: currentUser.organizationId }
            : "skip"
    );

    const removeUser = useMutation(api.users.remove);

    // Filter only professors
    const professors = (allUsers || []).filter(u => u.role === "professor");

    const filteredProfessors = professors.filter((professor) => {
        const fullName = `${professor.firstName} ${professor.lastName}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase()) ||
            professor.email.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Count courses per professor
    const getCourseCount = (professorId: string) => {
        return courses?.filter(c => c.instructorId === professorId).length || 0;
    };

    const handleDelete = (professor: any) => {
        setSelectedProfessor(professor);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedProfessor) return;

        setIsDeleting(true);
        try {
            await removeUser({ userId: selectedProfessor._id });
            setDeleteDialogOpen(false);
            setSelectedProfessor(null);
            toast.success("Professor excluído com sucesso!");
        } catch (error) {
            console.error("Error deleting professor:", error);
            toast.error("Erro ao excluir professor");
        } finally {
            setIsDeleting(false);
        }
    };

    const getLastLogin = (timestamp?: number) => {
        if (!timestamp) return "Nunca";
        const diff = Date.now() - timestamp;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return "Há poucos minutos";
        if (hours < 24) return `Há ${hours}h`;
        const days = Math.floor(hours / 24);
        return `Há ${days} dia${days > 1 ? "s" : ""}`;
    };

    const isLoading = allUsers === undefined;

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Professores</h1>
                    <p className="text-muted-foreground">
                        Gerencie os professores da sua organização
                    </p>
                </div>
                <Link href="/admin/users/new">
                    <Button className="gap-2 gradient-bg border-0">
                        <Plus className="h-4 w-4" />
                        Novo Professor
                    </Button>
                </Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <GraduationCap className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{professors.length}</p>
                                <p className="text-sm text-muted-foreground">Total de Professores</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{courses?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Cursos Criados</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {professors.filter(p => p.isActive).length}
                                </p>
                                <p className="text-sm text-muted-foreground">Professores Ativos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Search */}
            <motion.div variants={item} className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar professores..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </motion.div>

            {/* Table */}
            <motion.div variants={item}>
                <Card>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Professor</TableHead>
                                        <TableHead>Cursos</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Último Login</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProfessors.map((professor) => (
                                        <TableRow key={professor._id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={professor.imageUrl || undefined} />
                                                        <AvatarFallback>
                                                            {professor.firstName?.[0]}{professor.lastName?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{professor.firstName} {professor.lastName}</p>
                                                        <p className="text-sm text-muted-foreground">{professor.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    <BookOpen className="h-3 w-3 mr-1" />
                                                    {getCourseCount(professor._id)} cursos
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        professor.isActive
                                                            ? "border-emerald-500 text-emerald-500"
                                                            : "border-amber-500 text-amber-500"
                                                    )}
                                                >
                                                    {professor.isActive ? "Ativo" : "Inativo"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {getLastLogin(professor.lastLoginAt)}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/users/${professor._id}`}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                Ver Perfil
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/users/${professor._id}/edit`}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Editar
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Mail className="h-4 w-4 mr-2" />
                                                            Enviar Email
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => handleDelete(professor)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Empty State */}
            {!isLoading && filteredProfessors.length === 0 && (
                <motion.div variants={item} className="text-center py-12">
                    <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhum professor encontrado</h3>
                    <p className="text-muted-foreground">
                        {searchQuery
                            ? "Tente ajustar sua busca"
                            : "Adicione professores para começar"}
                    </p>
                </motion.div>
            )}

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir Professor</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir <strong>{selectedProfessor?.firstName} {selectedProfessor?.lastName}</strong>?
                            Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Excluindo...
                                </>
                            ) : (
                                "Excluir"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
