"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tag,
    Plus,
    Search,
    Loader2,
    MoreVertical,
    Edit,
    Trash2,
    GripVertical,
    Palette,
    BookOpen,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Id } from "@convex/_generated/dataModel";
import { useInvalidateStaticData } from "@/components/providers/static-data-provider";

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

const defaultColors = [
    "#8B5CF6", // Purple
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#3B82F6", // Blue
    "#EF4444", // Red
    "#EC4899", // Pink
    "#14B8A6", // Teal
    "#F97316", // Orange
    "#84CC16", // Lime
    "#06B6D4", // Cyan
    "#6B7280", // Gray
    "#A855F7", // Violet
];

interface CategoryFormData {
    name: string;
    description: string;
    color: string;
}

const emptyFormData: CategoryFormData = {
    name: "",
    description: "",
    color: "#8B5CF6",
};

export default function AdminCategoriesPage() {
    const { user } = useUser();
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<Id<"courseCategories"> | null>(null);
    const [deleteId, setDeleteId] = useState<Id<"courseCategories"> | null>(null);
    const [formData, setFormData] = useState<CategoryFormData>(emptyFormData);
    const [ensuredOrg, setEnsuredOrg] = useState(false);

    // Get Convex user to get organizationId
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // For superadmins, also check for any organization
    const anyOrganization = useQuery(
        api.users.getOrCreateUserOrganization,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Ensure organization mutation
    const ensureOrganization = useMutation(api.users.ensureOrganization);

    // The organization ID to use - either from user or first org for superadmin
    const effectiveOrgId = convexUser?.organizationId || anyOrganization?._id;

    // Auto-ensure organization on first load if not present
    useEffect(() => {
        const tryEnsureOrg = async () => {
            if (user?.id && convexUser && !effectiveOrgId && !ensuredOrg) {
                setEnsuredOrg(true);
                try {
                    await ensureOrganization({ clerkId: user.id });
                    window.location.reload(); // Reload to get updated data
                } catch (error) {
                    console.error("Erro ao garantir organização:", error);
                }
            }
        };
        tryEnsureOrg();
    }, [user?.id, convexUser, effectiveOrgId, ensuredOrg, ensureOrganization]);

    // Get categories for the organization
    const categories = useQuery(
        api.categories.getByOrganization,
        effectiveOrgId ? { organizationId: effectiveOrgId } : "skip"
    );

    const createCategory = useMutation(api.categories.create);
    const updateCategory = useMutation(api.categories.update);
    const deleteCategory = useMutation(api.categories.remove);
    const seedCategories = useMutation(api.categories.seedDefaults);

    // Hook para invalidar cache após mutations
    const invalidateStatic = useInvalidateStaticData();

    const categoriesLoading = categories === undefined;

    // Filter categories
    const filteredCategories = (categories ?? []).filter((cat) =>
        search === "" || cat.name.toLowerCase().includes(search.toLowerCase())
    );

    // Stats
    const totalCategories = categories?.length ?? 0;
    const activeCategories = categories?.filter(c => c.isActive).length ?? 0;
    const inactiveCategories = totalCategories - activeCategories;

    const handleOpenDialog = (category?: any) => {
        if (category) {
            setEditingId(category._id);
            setFormData({
                name: category.name || "",
                description: category.description || "",
                color: category.color || "#8B5CF6",
            });
        } else {
            setEditingId(null);
            setFormData(emptyFormData);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingId(null);
        setFormData(emptyFormData);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error("Digite o nome da categoria");
            return;
        }

        if (!effectiveOrgId) {
            toast.error("Organização não encontrada. Tente recarregar a página.");
            return;
        }

        setIsLoading(true);
        try {
            if (editingId) {
                await updateCategory({
                    categoryId: editingId,
                    name: formData.name.trim(),
                    description: formData.description.trim() || undefined,
                    color: formData.color,
                });
                toast.success("Categoria atualizada com sucesso!");
            } else {
                await createCategory({
                    organizationId: effectiveOrgId,
                    name: formData.name.trim(),
                    description: formData.description.trim() || undefined,
                    color: formData.color,
                });
                toast.success("Categoria criada com sucesso!");
            }
            invalidateStatic.categories(); // Invalida cache
            handleCloseDialog();
        } catch (error: any) {
            console.error("Erro ao salvar categoria:", error);
            toast.error(error.message || "Erro ao salvar categoria");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleActive = async (categoryId: Id<"courseCategories">, isActive: boolean) => {
        try {
            await updateCategory({
                categoryId,
                isActive: !isActive,
            });
            toast.success(isActive ? "Categoria desativada" : "Categoria ativada");
            invalidateStatic.categories(); // Invalida cache
        } catch (error: any) {
            toast.error(error.message || "Erro ao atualizar categoria");
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        setIsLoading(true);
        try {
            await deleteCategory({ categoryId: deleteId });
            toast.success("Categoria excluída com sucesso!");
            invalidateStatic.categories(); // Invalida cache
            setDeleteId(null);
        } catch (error: any) {
            toast.error(error.message || "Erro ao excluir categoria");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSeedDefaults = async () => {
        if (!effectiveOrgId) {
            toast.error("Organização não encontrada");
            return;
        }

        setIsLoading(true);
        try {
            const result = await seedCategories({ organizationId: effectiveOrgId });
            if (result.created > 0) {
                toast.success(`${result.created} categorias padrão criadas!`);
                invalidateStatic.categories(); // Invalida cache
            } else {
                toast.info(result.message);
            }
        } catch (error: any) {
            toast.error(error.message || "Erro ao criar categorias padrão");
        } finally {
            setIsLoading(false);
        }
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
                    <h1 className="text-2xl md:text-3xl font-bold">Categorias de Cursos</h1>
                    <p className="text-muted-foreground">
                        Organize seus cursos por categorias
                    </p>
                </div>
                <div className="flex gap-2">
                    {totalCategories === 0 && (
                        <Button
                            variant="outline"
                            onClick={handleSeedDefaults}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Carregar Padrões
                        </Button>
                    )}
                    <Button
                        className="gap-2 gradient-bg border-0"
                        onClick={() => handleOpenDialog()}
                    >
                        <Plus className="h-4 w-4" />
                        Nova Categoria
                    </Button>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Tag className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{totalCategories}</p>
                                <p className="text-sm text-muted-foreground">Total de Categorias</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{activeCategories}</p>
                                <p className="text-sm text-muted-foreground">Ativas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <XCircle className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{inactiveCategories}</p>
                                <p className="text-sm text-muted-foreground">Inativas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Search */}
            <motion.div variants={item} className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar categoria..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </motion.div>

            {/* Categories List */}
            {categoriesLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredCategories.length === 0 ? (
                <motion.div variants={item} className="text-center py-12">
                    <Tag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                        {search ? "Nenhum resultado encontrado" : "Nenhuma categoria ainda"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        {search
                            ? "Tente outro termo de busca"
                            : "Crie categorias para organizar seus cursos"}
                    </p>
                    {!search && (
                        <div className="flex justify-center gap-2">
                            <Button variant="outline" onClick={handleSeedDefaults} disabled={isLoading}>
                                Carregar Padrões
                            </Button>
                            <Button onClick={() => handleOpenDialog()}>
                                <Plus className="h-4 w-4 mr-2" />
                                Criar Categoria
                            </Button>
                        </div>
                    )}
                </motion.div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCategories.map((category) => (
                        <Card
                            key={category._id}
                            className={cn(
                                "hover:shadow-lg transition-all group",
                                !category.isActive && "opacity-60"
                            )}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div
                                        className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 text-lg font-semibold text-white"
                                        style={{ backgroundColor: category.color }}
                                    >
                                        {category.name.charAt(0).toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium truncate">{category.name}</h3>
                                            <Badge
                                                variant={category.isActive ? "default" : "secondary"}
                                                className="shrink-0"
                                            >
                                                {category.isActive ? "Ativa" : "Inativa"}
                                            </Badge>
                                        </div>
                                        {category.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {category.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            <div
                                                className="w-4 h-4 rounded-full border"
                                                style={{ backgroundColor: category.color }}
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                {category.color}
                                            </span>
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                className="gap-2"
                                                onClick={() => handleOpenDialog(category)}
                                            >
                                                <Edit className="h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="gap-2"
                                                onClick={() => handleToggleActive(category._id, category.isActive)}
                                            >
                                                {category.isActive ? (
                                                    <>
                                                        <XCircle className="h-4 w-4" />
                                                        Desativar
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="h-4 w-4" />
                                                        Ativar
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="gap-2 text-destructive"
                                                onClick={() => setDeleteId(category._id)}
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
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? "Editar Categoria" : "Nova Categoria"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingId
                                ? "Atualize as informações da categoria"
                                : "Crie uma nova categoria para organizar seus cursos"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Categoria *</Label>
                            <Input
                                id="name"
                                placeholder="Ex: Teologia"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                                }
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                placeholder="Descreva brevemente esta categoria..."
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                                }
                                rows={3}
                            />
                        </div>



                        <div className="space-y-2">
                            <Label>Cor</Label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, color: e.target.value }))
                                    }
                                    className="h-10 w-14 rounded border cursor-pointer"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {defaultColors.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            className={cn(
                                                "w-6 h-6 rounded-full transition-all hover:scale-110",
                                                formData.color === color && "ring-2 ring-offset-2 ring-primary"
                                            )}
                                            style={{ backgroundColor: color }}
                                            onClick={() =>
                                                setFormData((prev) => ({ ...prev, color }))
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="p-4 rounded-lg border bg-muted/50">
                            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                            <div className="flex items-center gap-3">
                                <div
                                    className="h-10 w-10 rounded-lg flex items-center justify-center text-lg font-semibold text-white"
                                    style={{ backgroundColor: formData.color }}
                                >
                                    {formData.name ? formData.name.charAt(0).toUpperCase() : "?"}
                                </div>
                                <div>
                                    <p className="font-medium">
                                        {formData.name || "Nome da categoria"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formData.description || "Descrição da categoria"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading || !formData.name.trim()}
                            className="gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    {editingId ? "Atualizar" : "Criar"}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir esta categoria?
                            Cursos vinculados a ela ficarão sem categoria.
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Excluir"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
}
