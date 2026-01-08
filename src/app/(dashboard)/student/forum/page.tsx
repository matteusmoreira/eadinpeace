"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    MessageSquare,
    Plus,
    Search,
    Eye,
    MessageCircle,
    Pin,
    Lock,
    CheckCircle,
    Clock,
    TrendingUp,
    Loader2,
    Folder,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

export default function ForumPage() {
    const { user } = useUser();
    const [selectedCategory, setSelectedCategory] = useState<Id<"forumCategories"> | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isNewTopicOpen, setIsNewTopicOpen] = useState(false);
    const [newTopicTitle, setNewTopicTitle] = useState("");
    const [newTopicContent, setNewTopicContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get categories
    const categories = useQuery(
        api.forum.getCategories,
        convexUser?.organizationId ? { organizationId: convexUser.organizationId } : "skip"
    );

    // Get topics
    const topics = useQuery(
        api.forum.getRecentTopics,
        convexUser?.organizationId ? { organizationId: convexUser.organizationId, limit: 50 } : "skip"
    );

    // Create topic mutation
    const createTopic = useMutation(api.forum.createTopic);

    const handleCreateTopic = async () => {
        if (!convexUser || !selectedCategory || !newTopicTitle.trim() || !newTopicContent.trim()) {
            toast.error("Preencha todos os campos");
            return;
        }

        setIsSubmitting(true);
        try {
            await createTopic({
                categoryId: selectedCategory,
                organizationId: convexUser.organizationId!,
                authorId: convexUser._id,
                title: newTopicTitle.trim(),
                content: newTopicContent.trim(),
            });
            toast.success("Tópico criado com sucesso!");
            setNewTopicTitle("");
            setNewTopicContent("");
            setIsNewTopicOpen(false);
        } catch (error) {
            toast.error("Erro ao criar tópico");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredTopics = topics?.filter((topic: any) => {
        const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            topic.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || topic.categoryId === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (!convexUser) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Fórum</h1>
                    <p className="text-muted-foreground">
                        Participe de discussões, tire dúvidas e compartilhe conhecimento
                    </p>
                </div>
                <Dialog open={isNewTopicOpen} onOpenChange={setIsNewTopicOpen}>
                    <DialogTrigger asChild>
                        <Button className="gradient-bg border-0 gap-2">
                            <Plus className="h-4 w-4" />
                            Novo Tópico
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Criar Novo Tópico</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Categoria</label>
                                <div className="flex flex-wrap gap-2">
                                    {categories?.map((cat: any) => (
                                        <Button
                                            key={cat._id}
                                            variant={selectedCategory === cat._id ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setSelectedCategory(cat._id)}
                                        >
                                            {cat.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Título</label>
                                <Input
                                    placeholder="Qual é a sua pergunta ou tema?"
                                    value={newTopicTitle}
                                    onChange={(e) => setNewTopicTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Conteúdo</label>
                                <Textarea
                                    placeholder="Descreva detalhadamente..."
                                    rows={6}
                                    value={newTopicContent}
                                    onChange={(e) => setNewTopicContent(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsNewTopicOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleCreateTopic}
                                    disabled={isSubmitting || !selectedCategory}
                                    className="gradient-bg border-0"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : null}
                                    Publicar
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
                {/* Sidebar - Categorias */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Folder className="h-5 w-5" />
                            Categorias
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <Button
                            variant={!selectedCategory ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => setSelectedCategory(null)}
                        >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Todos os Tópicos
                        </Button>
                        {categories?.map((cat: any) => (
                            <Button
                                key={cat._id}
                                variant={selectedCategory === cat._id ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                onClick={() => setSelectedCategory(cat._id)}
                            >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                {cat.name}
                            </Button>
                        ))}
                    </CardContent>
                </Card>

                {/* Main Content - Topics */}
                <div className="md:col-span-3 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar tópicos..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Topics List */}
                    <div className="space-y-3">
                        {!filteredTopics ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : filteredTopics.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium mb-2">Nenhum tópico encontrado</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Seja o primeiro a iniciar uma discussão!
                                    </p>
                                    <Button onClick={() => setIsNewTopicOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Criar Tópico
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredTopics.map((topic: any) => (
                                <motion.div
                                    key={topic._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Link href={`/student/forum/topic/${topic._id}`}>
                                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-4">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={topic.author?.imageUrl} />
                                                        <AvatarFallback>
                                                            {topic.author?.firstName?.[0]}{topic.author?.lastName?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {topic.isPinned && (
                                                                <Pin className="h-4 w-4 text-primary" />
                                                            )}
                                                            {topic.isLocked && (
                                                                <Lock className="h-4 w-4 text-muted-foreground" />
                                                            )}
                                                            {topic.isSolved && (
                                                                <Badge className="bg-emerald-500 text-white text-xs">
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    Resolvido
                                                                </Badge>
                                                            )}
                                                            <h3 className="font-semibold line-clamp-1">
                                                                {topic.title}
                                                            </h3>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                            {topic.content}
                                                        </p>
                                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {formatDistanceToNow(topic.createdAt, {
                                                                    addSuffix: true,
                                                                    locale: ptBR,
                                                                })}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Eye className="h-3 w-3" />
                                                                {topic.viewCount || 0}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <MessageCircle className="h-3 w-3" />
                                                                {topic.replyCount || 0}
                                                            </span>
                                                            {topic.category && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {topic.category.name}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
