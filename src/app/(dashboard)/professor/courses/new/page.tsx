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
    Image,
    Target,
    DollarSign,
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
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

const levels = [
    { value: "beginner", label: "Iniciante", description: "Para quem está começando" },
    { value: "intermediate", label: "Intermediário", description: "Conhecimento prévio necessário" },
    { value: "advanced", label: "Avançado", description: "Para especialistas" },
];

const categories = [
    "Desenvolvimento Web",
    "Desenvolvimento Mobile",
    "Data Science",
    "Design",
    "Marketing Digital",
    "Negócios",
    "Finanças",
    "Idiomas",
    "Música",
    "Fotografia",
    "Outro",
];

export default function NewCoursePage() {
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
        price: 0,
    });

    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get user's organization (for professor)
    const organizations = useQuery(api.organizations.getAll);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!convexUser) {
            toast.error("Usuário não encontrado");
            return;
        }

        // Use user's organization or first available
        const organizationId = convexUser.organizationId || organizations?.[0]?._id;

        if (!organizationId) {
            toast.error("Nenhuma organização encontrada");
            return;
        }

        setIsLoading(true);

        try {
            const courseId = await createCourse({
                title: formData.title,
                slug: formData.slug,
                description: formData.description,
                thumbnail: formData.thumbnail || undefined,
                organizationId,
                instructorId: convexUser._id,
                category: formData.category,
                level: formData.level,
                price: formData.price > 0 ? formData.price : undefined,
            });

            toast.success("Curso criado com sucesso!");
            router.push(`/professor/courses/${courseId}`);
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
                <Link href="/professor/courses">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Novo Curso</h1>
                    <p className="text-muted-foreground">Crie um novo curso</p>
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
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título do Curso *</Label>
                                <Input
                                    id="title"
                                    placeholder="Ex: JavaScript do Zero ao Avançado"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug (URL)</Label>
                                <Input
                                    id="slug"
                                    placeholder="javascript-do-zero"
                                    value={formData.slug}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, slug: e.target.value }))
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    URL: /cursos/{formData.slug || "slug-do-curso"}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição *</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Descreva o que os alunos vão aprender..."
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="thumbnail">URL da Thumbnail (opcional)</Label>
                                <Input
                                    id="thumbnail"
                                    placeholder="https://..."
                                    value={formData.thumbnail}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, thumbnail: e.target.value }))
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category & Level */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Categoria e Nível
                            </CardTitle>
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
                                    <Label>Nível *</Label>
                                    <Select
                                        value={formData.level}
                                        onValueChange={(value) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                level: value as typeof formData.level
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {levels.map((level) => (
                                                <SelectItem key={level.value} value={level.value}>
                                                    <div>
                                                        <div className="font-medium">{level.label}</div>
                                                        <div className="text-xs text-muted-foreground">{level.description}</div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Preço (opcional)
                            </CardTitle>
                            <CardDescription>
                                Deixe em branco ou 0 para curso gratuito
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="price">Preço (R$)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.price || ""}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            price: parseFloat(e.target.value) || 0
                                        }))
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Link href="/professor/courses">
                            <Button type="button" variant="outline">
                                Cancelar
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            className="gap-2 gradient-bg border-0"
                            disabled={isLoading || !formData.title || !formData.category}
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
