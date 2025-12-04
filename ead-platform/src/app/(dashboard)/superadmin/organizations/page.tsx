"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Building2,
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Users,
    BookOpen,
    ExternalLink,
    Loader2,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
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

const planColors = {
    starter: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    professional: "bg-primary/10 text-primary",
    enterprise: "gradient-bg text-white border-0",
};

const planLabels = {
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
};

export default function OrganizationsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Convex queries
    const organizations = useQuery(api.organizations.getAll);
    const globalStats = useQuery(api.organizations.getGlobalStats);
    const removeOrganization = useMutation(api.organizations.remove);

    const isLoading = organizations === undefined;

    const filteredOrganizations = (organizations || []).filter((org) =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = (org: any) => {
        setSelectedOrg(org);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedOrg) return;

        setIsDeleting(true);
        try {
            await removeOrganization({ organizationId: selectedOrg._id });
            toast.success("Organização excluída com sucesso!");
            setDeleteDialogOpen(false);
            setSelectedOrg(null);
        } catch (error: any) {
            toast.error(error.message || "Erro ao excluir organização");
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("pt-BR");
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
                    <h1 className="text-2xl md:text-3xl font-bold">Organizações</h1>
                    <p className="text-muted-foreground">
                        Gerencie todas as organizações da plataforma
                    </p>
                </div>
                <Link href="/superadmin/organizations/new">
                    <Button className="gap-2 gradient-bg border-0">
                        <Plus className="h-4 w-4" />
                        Nova Organização
                    </Button>
                </Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{globalStats?.totalOrganizations || 0}</p>
                                <p className="text-sm text-muted-foreground">Total</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{globalStats?.activeOrganizations || 0}</p>
                                <p className="text-sm text-muted-foreground">Ativas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{globalStats?.totalUsers || 0}</p>
                                <p className="text-sm text-muted-foreground">Usuários</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{globalStats?.totalCourses || 0}</p>
                                <p className="text-sm text-muted-foreground">Cursos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Search */}
            <motion.div variants={item}>
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar organizações..."
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
                                        <TableHead>Organização</TableHead>
                                        <TableHead>Plano</TableHead>
                                        <TableHead>Usuários</TableHead>
                                        <TableHead>Cursos</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Criado em</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrganizations.map((org) => (
                                        <TableRow key={org._id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                                        {org.logo ? (
                                                            <img src={org.logo} alt={org.name} className="h-8 w-8 rounded" />
                                                        ) : (
                                                            <Building2 className="h-5 w-5 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{org.name}</p>
                                                        <p className="text-sm text-muted-foreground">{org.slug}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={planColors[org.plan]}>
                                                    {planLabels[org.plan]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    {org.userCount || 0}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                    {org.courseCount || 0}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        org.isActive
                                                            ? "border-emerald-500 text-emerald-500"
                                                            : "border-red-500 text-red-500"
                                                    )}
                                                >
                                                    {org.isActive ? "Ativo" : "Inativo"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(org.createdAt)}
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
                                                            <Link href={`/superadmin/organizations/${org._id}`}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Editar
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Users className="h-4 w-4 mr-2" />
                                                            Ver Usuários
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <ExternalLink className="h-4 w-4 mr-2" />
                                                            Acessar como Admin
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => handleDelete(org)}
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
            {!isLoading && filteredOrganizations.length === 0 && (
                <motion.div variants={item} className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhuma organização encontrada</h3>
                    <p className="text-muted-foreground mb-4">
                        {searchQuery ? "Tente buscar por outro termo" : "Comece criando sua primeira organização"}
                    </p>
                    {!searchQuery && (
                        <Link href="/superadmin/organizations/new">
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Criar Organização
                            </Button>
                        </Link>
                    )}
                </motion.div>
            )}

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir Organização</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir <strong>{selectedOrg?.name}</strong>?
                            Isso removerá todos os usuários e cursos associados. Esta ação não pode ser desfeita.
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
