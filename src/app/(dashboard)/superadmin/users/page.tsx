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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Users,
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Shield,
    GraduationCap,
    UserCog,
    Mail,
    Filter,
    Building2,
    Loader2,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

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

const roleConfig: Record<string, { label: string; color: string; icon: any }> = {
    superadmin: {
        label: "Super Admin",
        color: "gradient-bg text-white border-0",
        icon: Shield,
    },
    admin: {
        label: "Admin",
        color: "bg-primary/10 text-primary",
        icon: UserCog,
    },
    professor: {
        label: "Professor",
        color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        icon: GraduationCap,
    },
    student: {
        label: "Aluno",
        color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        icon: Users,
    },
};

export default function UsersPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Convex queries
    const users = useQuery(api.users.getAll);
    const stats = useQuery(api.users.getGlobalStats, {});
    const removeUser = useMutation(api.users.remove);

    const isLoading = users === undefined;

    const filteredUsers = (users || []).filter((user) => {
        const matchesSearch =
            user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const handleDelete = (user: any) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedUser) return;

        setIsDeleting(true);
        try {
            await removeUser({ userId: selectedUser._id });
            setDeleteDialogOpen(false);
            setSelectedUser(null);
        } catch (error) {
            console.error("Error deleting user:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("pt-BR");
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
                    <h1 className="text-2xl md:text-3xl font-bold">Usuários</h1>
                    <p className="text-muted-foreground">
                        Gerencie todos os usuários da plataforma
                    </p>
                </div>
                <Link href="/superadmin/users/new">
                    <Button className="gap-2 gradient-bg border-0">
                        <Plus className="h-4 w-4" />
                        Novo Usuário
                    </Button>
                </Link>
            </motion.div>

            {/* Stats by Role */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-4">
                {Object.entries(roleConfig).map(([role, config]) => (
                    <Card
                        key={role}
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-lg",
                            roleFilter === role && "ring-2 ring-primary"
                        )}
                        onClick={() => setRoleFilter(roleFilter === role ? "all" : role)}
                    >
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${role === "superadmin" ? "gradient-bg" :
                                    role === "admin" ? "bg-primary/10" :
                                        role === "professor" ? "bg-amber-500/10" : "bg-slate-100 dark:bg-slate-800"
                                    }`}>
                                    <config.icon className={`h-5 w-5 ${role === "superadmin" ? "text-white" :
                                        role === "admin" ? "text-primary" :
                                            role === "professor" ? "text-amber-500" : "text-slate-600"
                                        }`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {stats?.byRole?.[role as keyof typeof stats.byRole] || 0}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{config.label}s</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </motion.div>

            {/* Search & Filter */}
            <motion.div variants={item} className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar usuários..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filtrar por role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="superadmin">Super Admin</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="professor">Professor</SelectItem>
                        <SelectItem value="student">Aluno</SelectItem>
                    </SelectContent>
                </Select>
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
                                        <TableHead>Usuário</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Organização</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Último Login</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => {
                                        const role = roleConfig[user.role] || roleConfig.student;
                                        return (
                                            <TableRow key={user._id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarImage src={user.imageUrl || undefined} />
                                                            <AvatarFallback>
                                                                {user.firstName?.[0]}{user.lastName?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={role.color}>
                                                        <role.icon className="h-3 w-3 mr-1" />
                                                        {role.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {user.organization ? (
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                                            <span>{user.organization.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            user.isActive
                                                                ? "border-emerald-500 text-emerald-500"
                                                                : "border-amber-500 text-amber-500"
                                                        )}
                                                    >
                                                        {user.isActive ? "Ativo" : "Pendente"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {getLastLogin(user.lastLoginAt)}
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
                                                                <Link href={`/superadmin/users/${user._id}`}>
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
                                                                onClick={() => handleDelete(user)}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Empty State */}
            {!isLoading && filteredUsers.length === 0 && (
                <motion.div variants={item} className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhum usuário encontrado</h3>
                    <p className="text-muted-foreground">
                        Tente ajustar os filtros ou buscar por outro termo
                    </p>
                </motion.div>
            )}

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir Usuário</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
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
