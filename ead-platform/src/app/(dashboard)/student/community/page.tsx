"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    MessageSquare,
    Plus,
    MessagesSquare,
    Eye,
    Clock,
    CheckCircle2,
    Pin,
    Lock,
    Loader2,
    Users,
    BookOpen,
    HelpCircle,
    Lightbulb,
    Megaphone,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Id } from "@convex/_generated/dataModel";

const categoryIcons: Record<string, React.ReactNode> = {
    general: <MessagesSquare className="h-5 w-5" />,
    help: <HelpCircle className="h-5 w-5" />,
    ideas: <Lightbulb className="h-5 w-5" />,
    courses: <BookOpen className="h-5 w-5" />,
    announcements: <Megaphone className="h-5 w-5" />,
};

export default function CommunityPage() {
    const { user } = useUser();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Id<"forumCategories"> | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const convexUser = useQuery(api.users.getByClerkId, {
        clerkId: user?.id || ""
    });

    const categories = useQuery(
        api.forum.getCategories,
        convexUser?.organizationId
            ? { organizationId: convexUser.organizationId }
            : "skip"
    );

    const recentTopics = useQuery(
        api.forum.getRecentTopics,
        convexUser?.organizationId
            ? { organizationId: convexUser.organizationId, limit: 10 }
            : "skip"
    );

    const createTopic = useMutation(api.forum.createTopic);
    const createCategory = useMutation(api.forum.createCategory);

    const handleCreateTopic = async () => {
        if (!title.trim() || !content.trim() || !selectedCategory || !convexUser) {
            toast.error("Preencha todos os campos");
            return;
        }

        setIsSubmitting(true);
        try {
            const topicId = await createTopic({
                categoryId: selectedCategory,
                organizationId: convexUser.organizationId!,
                authorId: convexUser._id,
                title: title.trim(),
                content: content.trim(),
            });

            toast.success("Tópico criado com sucesso!");
            setIsDialogOpen(false);
            setTitle("");
            setContent("");
            setSelectedCategory(null);
        } catch (error) {
            toast.error("Erro ao criar tópico");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Create default categories if none exist
    const handleCreateDefaultCategories = async () => {
        if (!convexUser?.organizationId) return;

        const defaultCategories = [
            { name: "Geral", description: "Discussões gerais sobre a plataforma", icon: "general" },
            { name: "Dúvidas", description: "Tire suas dúvidas sobre os cursos", icon: "help" },
            { name: "Ideias", description: "Sugira melhorias e novas funcionalidades", icon: "ideas" },
            { name: "Cursos", description: "Discussões sobre conteúdo dos cursos", icon: "courses" },
        ];

        for (const cat of defaultCategories) {
            await createCategory({
                organizationId: convexUser.organizationId,
                name: cat.name,
                description: cat.description,
                icon: cat.icon,
            });
        }

        toast.success("Categorias criadas!");
    };

    const formatDate = (timestamp: number) => {
        return formatDistanceToNow(new Date(timestamp), {
            addSuffix: true,
            locale: ptBR,
        });
    };

    if (!convexUser || categories === undefined || recentTopics === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        Comunidade
                    </h1>
                    <p className="text-muted-foreground">
                        Conecte-se com outros alunos e tire suas dúvidas
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 gradient-bg border-0">
                            <Plus className="h-4 w-4" />
                            Novo Tópico
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Criar Novo Tópico</DialogTitle>
                            <DialogDescription>
                                Inicie uma discussão com a comunidade
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                <Select
                                    value={selectedCategory?.toString()}
                                    onValueChange={(v) => setSelectedCategory(v as Id<"forumCategories">)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat._id} value={cat._id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="title">Título</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Título do tópico"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">Conteúdo</Label>
                                <Textarea
                                    id="content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Descreva sua dúvida ou discussão..."
                                    className="min-h-[150px]"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleCreateTopic} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Criar Tópico
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* No Categories - Show setup button */}
            {categories.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <MessagesSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Fórum não configurado</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Crie as categorias iniciais para começar a usar o fórum
                        </p>
                        {(convexUser.role === "admin" || convexUser.role === "superadmin") && (
                            <Button onClick={handleCreateDefaultCategories}>
                                Criar Categorias Padrão
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {categories.length > 0 && (
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Categories */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="font-semibold text-lg">Categorias</h2>
                        <div className="space-y-2">
                            {categories.map((category) => (
                                <Link
                                    key={category._id}
                                    href={`/student/community/category/${category._id}`}
                                >
                                    <motion.div
                                        whileHover={{ x: 4 }}
                                        className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            {categoryIcons[category.icon || "general"] || <MessagesSquare className="h-5 w-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium">{category.name}</p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {category.description}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">{category.topicCount}</p>
                                            <p className="text-xs text-muted-foreground">tópicos</p>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Recent Topics */}
                    <div className="lg:col-span-2">
                        <h2 className="font-semibold text-lg mb-4">Discussões Recentes</h2>
                        {recentTopics.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <h3 className="text-lg font-medium mb-2">Nenhum tópico ainda</h3>
                                    <p className="text-muted-foreground text-center">
                                        Seja o primeiro a iniciar uma discussão!
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {recentTopics.map((topic, index) => (
                                    <motion.div
                                        key={topic._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Link href={`/student/community/topic/${topic._id}`}>
                                            <Card className="hover:bg-muted/50 transition-colors">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start gap-4">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={topic.author?.imageUrl} />
                                                            <AvatarFallback>
                                                                {topic.author?.firstName?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                {topic.isPinned && (
                                                                    <Badge variant="secondary" className="text-xs gap-1">
                                                                        <Pin className="h-3 w-3" />
                                                                        Fixado
                                                                    </Badge>
                                                                )}
                                                                {topic.isLocked && (
                                                                    <Badge variant="outline" className="text-xs gap-1">
                                                                        <Lock className="h-3 w-3" />
                                                                        Fechado
                                                                    </Badge>
                                                                )}
                                                                {topic.isSolved && (
                                                                    <Badge className="text-xs gap-1 bg-emerald-500">
                                                                        <CheckCircle2 className="h-3 w-3" />
                                                                        Resolvido
                                                                    </Badge>
                                                                )}
                                                                <Badge variant="outline" className="text-xs">
                                                                    {topic.categoryName}
                                                                </Badge>
                                                            </div>
                                                            <h3 className="font-medium line-clamp-1">
                                                                {topic.title}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                                {topic.content}
                                                            </p>
                                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                                <span>
                                                                    {topic.author?.firstName} {topic.author?.lastName}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {formatDate(topic.createdAt)}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <MessageSquare className="h-3 w-3" />
                                                                    {topic.replyCount} respostas
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Eye className="h-3 w-3" />
                                                                    {topic.viewCount}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
