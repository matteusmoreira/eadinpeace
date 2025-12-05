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
    ArrowLeft,
    Save,
    Loader2,
    BookOpen,
    Tag,
    BarChart3,
    Image as ImageIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

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

const categories = [
    "Teologia",
    "Bíblia",
    "Liderança",
    "Discipulado",
    "Missões",
    "Louvor e Adoração",
    "Família",
    "Aconselhamento",
    "Evangelismo",
    "Ministério Infantil",
    "Juventude",
    "Outros",
];

export default function AdminNewCoursePage() {
    const router = useRouter();
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        description: "",
        thumbnail: "",
        category: "",
        level: "beginner" as "beginner" | "intermediate" | "advanced",
        instructorId: "",
    });

    // Get Convex user to get organizationId
    const convexUser = useQuery(api.users.getByClerkId, {
        clerkId: user?.id || ""
    });

    // Get all users from org to select as instructor
    const orgUsers = useQuery(api.users.getAll);
    const instructors = orgUsers?.filter(u =>
        u.organizationId === convexUser?.organizationId &&
        (u.role === "professor" || u.role === "admin")
    ) || [];

    const createCourse = useMutation(api.courses.create);

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
            setFormData((prev) => ({ ...prev, instructorId: convexUser._id }));
        }
    }, [convexUser, formData.instructorId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!convexUser?.organizationId) {
            toast.error("Organização não encontrada");
            return;
        }

        if (!formData.instructorId) {
            toast.error("Selecione um instrutor");
            return;
        }

        setIsLoading(true);

        try {
            const courseId = await createCourse({
                title: formData.title,
                slug: formData.slug,
                description: formData.description,
                thumbnail: formData.thumbnail || undefined,
                category: formData.category,
                level: formData.level,
                organizationId: convexUser.organizationId,
                instructorId: formData.instructorId as any,
            });

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

                            <div className="space-y-2">
                                <Label htmlFor="thumbnail">URL da Thumbnail (opcional)</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="thumbnail"
                                            placeholder="https://..."
                                            value={formData.thumbnail}
                                            onChange={(e) =>
                                                setFormData((prev) => ({ ...prev, thumbnail: e.target.value }))
                                            }
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category and Level */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Tag className="h-5 w-5" />
                                Categoria e Nível
                            </CardTitle>
                            <CardDescription>
                                Classifique o curso para facilitar a busca
                            </CardDescription>
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
                                            {categories.map((cat) => (
                                                <SelectItem key={cat} value={cat}>
                                                    {cat}
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
                                            {instructors.map((instructor) => (
                                                <SelectItem key={instructor._id} value={instructor._id}>
                                                    {instructor.firstName} {instructor.lastName}
                                                </SelectItem>
                                            ))}
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
        </motion.div>
    );
}
