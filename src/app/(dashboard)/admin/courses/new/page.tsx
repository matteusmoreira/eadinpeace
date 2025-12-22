"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
    ArrowLeft,
    Save,
    Loader2,
    BookOpen,
    Tag,
    BarChart3,
    Image as ImageIcon,
    Upload,
    X,
    Plus,
    Trash2,
    Edit,
    Settings,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Id } from "@convex/_generated/dataModel";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

const levels = [
    { value: "beginner", label: "Iniciante", description: "Para quem está começando" },
    { value: "intermediate", label: "Intermediário", description: "Para quem já tem conhecimentos básicos" },
    { value: "advanced", label: "Avançado", description: "Para quem busca aprofundamento" },
];

export default function AdminNewCoursePage() {
    const router = useRouter();
    const { user } = useUser();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [thumbnailStorageId, setThumbnailStorageId] = useState<Id<"_storage"> | null>(null);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [deleteCategoryId, setDeleteCategoryId] = useState<Id<"courseCategories"> | null>(null);
    const [newCategory, setNewCategory] = useState({ name: "", description: "", color: "#8B5CF6" });

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        description: "",
        category: "",
        level: "beginner" as "beginner" | "intermediate" | "advanced",
        instructorId: "",
    });

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

    // The organization ID to use - either from user or first org for superadmin
    const effectiveOrgId = convexUser?.organizationId || anyOrganization?._id;

    // Get all users from org to select as instructor
    const orgUsers = useQuery(api.users.getAll);
    const instructors = orgUsers?.filter(u =>
        u.organizationId === effectiveOrgId &&
        (u.role === "professor" || u.role === "admin")
    ) || [];

    // Get categories for the organization
    const categories = useQuery(
        api.categories.getByOrganization,
        effectiveOrgId ? { organizationId: effectiveOrgId } : "skip"
    );

    const createCourse = useMutation(api.courses.create);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const uploadThumbnail = useMutation(api.files.uploadCourseThumbnail);
    const createCategory = useMutation(api.categories.create);
    const updateCategory = useMutation(api.categories.update);
    const deleteCategory = useMutation(api.categories.remove);
    const seedCategories = useMutation(api.categories.seedDefaults);

    // Seed default categories if none exist
    useEffect(() => {
        if (categories && categories.length === 0 && effectiveOrgId) {
            seedCategories({ organizationId: effectiveOrgId });
        }
    }, [categories, effectiveOrgId, seedCategories]);

    // Auto-generate slug from title
    useEffect(() => {
        const slug = formData.title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        setFormData((prev) => ({ ...prev, slug }));
    }, [formData.title]);

    // Set current user as default instructor
    useEffect(() => {
        if (convexUser && !formData.instructorId) {
            setFormData((prev) => ({ ...prev, instructorId: String(convexUser._id) }));
        }
    }, [convexUser, formData.instructorId]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Selecione um arquivo de imagem válido");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("A imagem deve ter no máximo 5MB");
            return;
        }

        setIsUploading(true);

        try {
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setThumbnailPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);

            // Upload to Convex
            const uploadUrl = await generateUploadUrl();
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) {
                throw new Error("Erro no upload");
            }

            const { storageId } = await result.json();
            setThumbnailStorageId(storageId);
            toast.success("Imagem carregada com sucesso!");
        } catch (error) {
            toast.error("Erro ao carregar imagem");
            setThumbnailPreview(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveThumbnail = () => {
        setThumbnailPreview(null);
        setThumbnailStorageId(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleCreateCategory = async () => {
        const categoryName = newCategory.name.trim();

        if (!categoryName) {
            toast.error("Digite o nome da categoria");
            return;
        }

        if (!effectiveOrgId) {
            toast.error("Organização não encontrada. Tente recarregar a página.");
            return;
        }

        setIsLoading(true);
        try {
            await createCategory({
                organizationId: effectiveOrgId,
                name: categoryName,
                description: newCategory.description.trim() || undefined,
                color: newCategory.color,
            });
            toast.success("Categoria criada com sucesso!");
            setNewCategory({ name: "", description: "", color: "#8B5CF6" });
            setCategoryDialogOpen(false);
        } catch (error: any) {
            console.error("Erro ao criar categoria:", error);
            toast.error(error.message || "Erro ao criar categoria");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory || !editingCategory.name.trim()) {
            toast.error("Digite o nome da categoria");
            return;
        }

        setIsLoading(true);
        try {
            await updateCategory({
                categoryId: editingCategory._id,
                name: editingCategory.name,
                description: editingCategory.description || undefined,
                color: editingCategory.color,
            });
            toast.success("Categoria atualizada!");
            setEditingCategory(null);
        } catch (error: any) {
            toast.error(error.message || "Erro ao atualizar categoria");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!deleteCategoryId) return;

        setIsLoading(true);
        try {
            await deleteCategory({ categoryId: deleteCategoryId });
            toast.success("Categoria excluída!");
            setDeleteCategoryId(null);
        } catch (error: any) {
            toast.error(error.message || "Erro ao excluir categoria");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!effectiveOrgId) {
            toast.error("Organização não encontrada");
            return;
        }

        if (!formData.instructorId) {
            toast.error("Selecione um instrutor");
            return;
        }

        if (!formData.category) {
            toast.error("Selecione uma categoria");
            return;
        }

        setIsLoading(true);

        try {
            const courseId = await createCourse({
                title: formData.title,
                slug: formData.slug,
                description: formData.description,
                thumbnail: undefined, // Will be updated after upload
                category: formData.category,
                level: formData.level,
                organizationId: effectiveOrgId,
                instructorId: formData.instructorId as any,
            });

            // Upload thumbnail if exists
            if (thumbnailStorageId) {
                await uploadThumbnail({
                    courseId,
                    storageId: thumbnailStorageId,
                });
            }

            toast.success("Curso criado com sucesso!");
            router.push(`/admin/courses/${courseId}`);
        } catch (error: any) {
            toast.error(error.message || "Erro ao criar curso");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-3xl mx-auto space-y-6"
        >
            {/* Header */}
            <motion.div variants={item} className="flex items-center gap-4">
                <Link href="/admin/courses">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Novo Curso</h1>
                    <p className="text-muted-foreground">
                        Crie um novo curso para sua organização
                    </p>
                </div>
            </motion.div>

            <form onSubmit={handleSubmit}>
                <motion.div variants={item} className="space-y-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Informações Básicas
                            </CardTitle>
                            <CardDescription>
                                Dados principais do curso
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título do Curso *</Label>
                                <Input
                                    id="title"
                                    placeholder="Ex: Introdução à Teologia"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug (URL) *</Label>
                                <Input
                                    id="slug"
                                    placeholder="introducao-teologia"
                                    value={formData.slug}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, slug: e.target.value }))
                                    }
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    URL: /cursos/{formData.slug || "slug"}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição *</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Descreva o que os alunos irão aprender neste curso..."
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                                    }
                                    rows={4}
                                    required
                                />
                            </div>

                            {/* Thumbnail Upload */}
                            <div className="space-y-2">
                                <Label>Thumbnail do Curso</Label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />

                                {thumbnailPreview ? (
                                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                                        <img
                                            src={thumbnailPreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2"
                                            onClick={handleRemoveThumbnail}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={cn(
                                            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                                            "hover:border-primary hover:bg-primary/5",
                                            isUploading && "opacity-50 pointer-events-none"
                                        )}
                                    >
                                        {isUploading ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                <p className="text-sm text-muted-foreground">Carregando...</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <Upload className="h-8 w-8 text-muted-foreground" />
                                                <p className="font-medium">Clique para fazer upload</p>
                                                <p className="text-sm text-muted-foreground">
                                                    PNG, JPG ou WEBP até 5MB
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category and Level */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Tag className="h-5 w-5" />
                                        Categoria e Nível
                                    </CardTitle>
                                    <CardDescription>
                                        Classifique o curso para facilitar a busca
                                    </CardDescription>
                                </div>
                                <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-1">
                                            <Settings className="h-4 w-4" />
                                            Gerenciar
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Gerenciar Categorias</DialogTitle>
                                            <DialogDescription>
                                                Adicione, edite ou exclua categorias de cursos
                                            </DialogDescription>
                                        </DialogHeader>

                                        {/* Add new category */}
                                        <div className="space-y-3 border-b pb-4">
                                            <Label>Nova Categoria</Label>
                                            {!effectiveOrgId && (
                                                <p className="text-xs text-amber-500">
                                                    ⚠️ Carregando organização... Aguarde.
                                                </p>
                                            )}
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Nome da categoria"
                                                    value={newCategory.name}
                                                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                                                />
                                                <input
                                                    type="color"
                                                    value={newCategory.color}
                                                    onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                                                    className="h-10 w-12 rounded border cursor-pointer"
                                                />
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    onClick={handleCreateCategory}
                                                    disabled={isLoading || !newCategory.name.trim() || !effectiveOrgId}
                                                >
                                                    {isLoading ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Plus className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Existing categories */}
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {categories?.map((cat) => (
                                                <div key={cat._id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted">
                                                    {editingCategory?._id === cat._id ? (
                                                        <>
                                                            <Input
                                                                value={editingCategory.name}
                                                                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                                                className="flex-1"
                                                            />
                                                            <input
                                                                type="color"
                                                                value={editingCategory.color || "#8B5CF6"}
                                                                onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                                                                className="h-8 w-10 rounded border cursor-pointer"
                                                            />
                                                            <Button size="sm" onClick={handleUpdateCategory} disabled={isLoading}>
                                                                Salvar
                                                            </Button>
                                                            <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)}>
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div
                                                                className="w-4 h-4 rounded-full shrink-0"
                                                                style={{ backgroundColor: cat.color || "#8B5CF6" }}
                                                            />
                                                            <span className="flex-1">{cat.name}</span>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => setEditingCategory(cat)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="text-destructive"
                                                                onClick={() => setDeleteCategoryId(cat._id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Categoria *</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({ ...prev, category: value }))
                                        }
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma categoria" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories?.filter(c => c.isActive).map((cat) => (
                                                <SelectItem key={cat._id} value={cat.name}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: cat.color || "#8B5CF6" }}
                                                        />
                                                        {cat.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Instrutor *</Label>
                                    <Select
                                        value={formData.instructorId}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({ ...prev, instructorId: value }))
                                        }
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o instrutor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {instructors.length === 0 ? (
                                                <SelectItem value="no-instructors" disabled>
                                                    Nenhum instrutor disponível
                                                </SelectItem>
                                            ) : (
                                                instructors.map((instructor) => (
                                                    <SelectItem key={instructor._id} value={String(instructor._id)}>
                                                        {`${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || instructor.email}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Level Selection */}
                            <div className="space-y-3">
                                <Label>Nível de Dificuldade</Label>
                                <div className="grid gap-3 md:grid-cols-3">
                                    {levels.map((level) => (
                                        <div
                                            key={level.value}
                                            className={cn(
                                                "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
                                                formData.level === level.value
                                                    ? "border-primary bg-primary/5"
                                                    : "border-muted hover:border-muted-foreground/50"
                                            )}
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    level: level.value as typeof formData.level,
                                                }))
                                            }
                                        >
                                            <div className="text-center">
                                                <BarChart3 className={cn(
                                                    "h-6 w-6 mx-auto mb-2",
                                                    level.value === "beginner" && "text-emerald-500",
                                                    level.value === "intermediate" && "text-amber-500",
                                                    level.value === "advanced" && "text-red-500"
                                                )} />
                                                <div className="font-medium">{level.label}</div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {level.description}
                                                </div>
                                            </div>
                                            {formData.level === level.value && (
                                                <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Link href="/admin/courses">
                            <Button type="button" variant="outline">
                                Cancelar
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            className="gap-2 gradient-bg border-0"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Criar Curso
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </form>

            {/* Delete Category Dialog */}
            <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
}
