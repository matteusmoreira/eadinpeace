"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    Users,
    Search,
    Plus,
    MoreVertical,
    Edit,
    Trash2,
    Mail,
    GraduationCap,
    ShieldCheck,
    Loader2,
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

const roleLabels: Record<string, string> = {
    admin: "Admin",
    professor: "Professor",
    student: "Aluno",
};

const roleColors: Record<string, string> = {
    admin: "bg-primary text-primary-foreground",
    professor: "bg-amber-500 text-white",
    student: "bg-muted text-muted-foreground",
};

export default function AdminUsersPage() {
    const { user } = useUser();
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [deleteId, setDeleteId] = useState<Id<"users"> | null>(null);

    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get all users
    const allUsers = useQuery(api.users.getAll);

    const deleteUser = useMutation(api.users.remove);

    // Filter to organization users
    const orgUsers = allUsers?.filter(u => u.organizationId === convexUser?.organizationId) || [];

    const isLoading = allUsers === undefined;

    // Apply filters
    const filteredUsers = orgUsers.filter((u) => {
        const matchSearch = search === "" ||
            u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
            u.lastName?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase());

        const matchRole = roleFilter === "all" || u.role === roleFilter;

        return matchSearch && matchRole;
    });

    // Stats
    const totalUsers = orgUsers.length;
    const totalProfessors = orgUsers.filter(u => u.role === "professor").length;
    const totalStudents = orgUsers.filter(u => u.role === "student").length;

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteUser({ userId: deleteId });
            toast.success("Usuário removido com sucesso!");
            setDeleteId(null);
        } catch {
            toast.error("Erro ao remover usuário");
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
                    <h1 className="text-2xl md:text-3xl font-bold">Usuários</h1>
                    <p className="text-muted-foreground">Gerencie os usuários da organização</p>
                </div>
                <Link href="/admin/users/new">
                    <Button className="gap-2 gradient-bg border-0">
                        <Plus className="h-4 w-4" />
                        Novo Usuário
                    </Button>
                </Link>
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
                                <p className="text-3xl font-bold">{totalUsers}</p>
                                <p className="text-sm text-muted-foreground">Total de Usuários</p>
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
                                <p className="text-3xl font-bold">{totalProfessors}</p>
                                <p className="text-sm text-muted-foreground">Professores</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{totalStudents}</p>
                                <p className="text-sm text-muted-foreground">Alunos</p>
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
                        placeholder="Buscar usuário..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Função" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                        <SelectItem value="professor">Professores</SelectItem>
                        <SelectItem value="student">Alunos</SelectItem>
                    </SelectContent>
                </Select>
            </motion.div>

            {/* Users List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredUsers.length === 0 ? (
                <motion.div variants={item} className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                        {search || roleFilter !== "all" ? "Nenhum resultado encontrado" : "Nenhum usuário ainda"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        {search || roleFilter !== "all"
                            ? "Tente ajustar os filtros"
                            : "Convide usuários para a organização"}
                    </p>
                    {!(search || roleFilter !== "all") && (
                        <Link href="/admin/users/new">
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Adicionar Usuário
                            </Button>
                        </Link>
                    )}
                </motion.div>
            ) : (
                <div>
                    <Card>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {filteredUsers.map((u) => (
                                    <div
                                        key={u._id}
                                        className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={u.imageUrl || undefined} />
                                            <AvatarFallback>
                                                {u.firstName?.[0]}{u.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">
                                                    {u.firstName} {u.lastName}
                                                </p>
                                                <Badge className={roleColors[u.role] || "bg-muted"}>
                                                    {roleLabels[u.role] || u.role}
                                                </Badge>
                                                {!u.isActive && (
                                                    <Badge variant="destructive">Inativo</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {u.email}
                                            </p>
                                        </div>

                                        <div className="hidden md:block text-right">
                                            <p className="text-sm text-muted-foreground">Criado em</p>
                                            <p className="text-sm">{formatDate(u.createdAt)}</p>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem className="gap-2">
                                                    <Edit className="h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2">
                                                    <Mail className="h-4 w-4" />
                                                    Enviar email
                                                </DropdownMenuItem>
                                                {u._id !== convexUser?._id && (
                                                    <DropdownMenuItem
                                                        className="gap-2 text-destructive"
                                                        onClick={() => setDeleteId(u._id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Remover
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div >
    );
}
