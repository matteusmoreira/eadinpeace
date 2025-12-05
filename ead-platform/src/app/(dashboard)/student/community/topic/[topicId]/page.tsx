"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MessageSquare,
    ArrowLeft,
    ThumbsUp,
    CheckCircle2,
    Pin,
    Lock,
    MoreHorizontal,
    Trash2,
    Send,
    Loader2,
    Clock,
    Eye,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Id } from "@convex/_generated/dataModel";

export default function TopicPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useUser();
    const [replyContent, setReplyContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const topicId = params.topicId as Id<"forumTopics">;

    const convexUser = useQuery(api.users.getByClerkId, {
        clerkId: user?.id || ""
    });

    const topic = useQuery(api.forum.getTopic, { topicId });
    const replies = useQuery(api.forum.getReplies, { topicId });

    const createReply = useMutation(api.forum.createReply);
    const toggleReplyLike = useMutation(api.forum.toggleReplyLike);
    const toggleAcceptedAnswer = useMutation(api.forum.toggleAcceptedAnswer);
    const deleteReply = useMutation(api.forum.deleteReply);
    const deleteTopic = useMutation(api.forum.deleteTopic);
    const togglePinned = useMutation(api.forum.togglePinned);
    const toggleLocked = useMutation(api.forum.toggleLocked);
    const toggleSolved = useMutation(api.forum.toggleSolved);
    const incrementViewCount = useMutation(api.forum.incrementViewCount);

    // Increment view count on load
    useState(() => {
        if (topicId) {
            incrementViewCount({ topicId });
        }
    });

    const formatDate = (timestamp: number) => {
        return formatDistanceToNow(new Date(timestamp), {
            addSuffix: true,
            locale: ptBR,
        });
    };

    const handleSubmitReply = async () => {
        if (!replyContent.trim() || !convexUser) {
            toast.error("Digite uma resposta");
            return;
        }

        setIsSubmitting(true);
        try {
            await createReply({
                topicId,
                authorId: convexUser._id,
                content: replyContent.trim(),
            });
            setReplyContent("");
            toast.success("Resposta enviada!");
        } catch (error: any) {
            toast.error(error.message || "Erro ao enviar resposta");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLike = async (replyId: Id<"forumReplies">) => {
        if (!convexUser) return;
        try {
            await toggleReplyLike({ replyId, userId: convexUser._id });
        } catch (error) {
            toast.error("Erro ao curtir");
        }
    };

    const handleAcceptAnswer = async (replyId: Id<"forumReplies">) => {
        try {
            await toggleAcceptedAnswer({ replyId });
            toast.success("Resposta marcada como solução!");
        } catch (error) {
            toast.error("Erro ao marcar resposta");
        }
    };

    const handleDeleteReply = async (replyId: Id<"forumReplies">) => {
        if (!confirm("Tem certeza que deseja excluir esta resposta?")) return;
        try {
            await deleteReply({ replyId });
            toast.success("Resposta excluída");
        } catch (error) {
            toast.error("Erro ao excluir resposta");
        }
    };

    const handleDeleteTopic = async () => {
        if (!confirm("Tem certeza que deseja excluir este tópico e todas as respostas?")) return;
        try {
            await deleteTopic({ topicId });
            toast.success("Tópico excluído");
            router.push("/student/community");
        } catch (error) {
            toast.error("Erro ao excluir tópico");
        }
    };

    const canModerate = convexUser?.role === "professor" || convexUser?.role === "admin" || convexUser?.role === "superadmin";
    const isTopicAuthor = topic?.authorId === convexUser?._id;

    if (!convexUser || topic === undefined || replies === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!topic) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-medium mb-2">Tópico não encontrado</h2>
                <Link href="/student/community">
                    <Button variant="outline">Voltar ao Fórum</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Back button */}
            <Link href="/student/community">
                <Button variant="ghost" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Fórum
                </Button>
            </Link>

            {/* Topic */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                {topic.isPinned && (
                                    <Badge variant="secondary" className="text-xs gap-1">
                                        <Pin className="h-3 w-3" /> Fixado
                                    </Badge>
                                )}
                                {topic.isLocked && (
                                    <Badge variant="outline" className="text-xs gap-1">
                                        <Lock className="h-3 w-3" /> Fechado
                                    </Badge>
                                )}
                                {topic.isSolved && (
                                    <Badge className="text-xs gap-1 bg-emerald-500">
                                        <CheckCircle2 className="h-3 w-3" /> Resolvido
                                    </Badge>
                                )}
                                <Badge variant="outline">{topic.categoryName}</Badge>
                            </div>
                            <CardTitle className="text-xl">{topic.title}</CardTitle>
                        </div>

                        {(isTopicAuthor || canModerate) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {canModerate && (
                                        <>
                                            <DropdownMenuItem onClick={() => togglePinned({ topicId })}>
                                                <Pin className="h-4 w-4 mr-2" />
                                                {topic.isPinned ? "Desafixar" : "Fixar"}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => toggleLocked({ topicId })}>
                                                <Lock className="h-4 w-4 mr-2" />
                                                {topic.isLocked ? "Desbloquear" : "Bloquear"}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => toggleSolved({ topicId })}>
                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                {topic.isSolved ? "Reabrir" : "Marcar como resolvido"}
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    <DropdownMenuItem onClick={handleDeleteTopic} className="text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir tópico
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={topic.author?.imageUrl} />
                            <AvatarFallback>{topic.author?.firstName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">
                                    {topic.author?.firstName} {topic.author?.lastName}
                                </span>
                                {topic.author?.role === "professor" && (
                                    <Badge variant="secondary">Professor</Badge>
                                )}
                                <span className="text-sm text-muted-foreground">
                                    • {formatDate(topic.createdAt)}
                                </span>
                            </div>
                            <p className="whitespace-pre-wrap">{topic.content}</p>
                            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Eye className="h-4 w-4" />
                                    {topic.viewCount} visualizações
                                </span>
                                <span className="flex items-center gap-1">
                                    <MessageSquare className="h-4 w-4" />
                                    {topic.replyCount} respostas
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Replies */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                    Respostas ({replies.length})
                </h3>

                {replies.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Nenhuma resposta ainda</p>
                            <p className="text-sm">Seja o primeiro a responder!</p>
                        </CardContent>
                    </Card>
                ) : (
                    replies.map((reply, index) => (
                        <motion.div
                            key={reply._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className={cn(
                                reply.isAcceptedAnswer && "border-emerald-500 bg-emerald-500/5"
                            )}>
                                <CardContent className="pt-6">
                                    <div className="flex gap-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={reply.author?.imageUrl} />
                                            <AvatarFallback>{reply.author?.firstName?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        {reply.author?.firstName} {reply.author?.lastName}
                                                    </span>
                                                    {reply.author?.role === "professor" && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Professor
                                                        </Badge>
                                                    )}
                                                    {reply.isAcceptedAnswer && (
                                                        <Badge className="text-xs bg-emerald-500 gap-1">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Resposta Aceita
                                                        </Badge>
                                                    )}
                                                    <span className="text-sm text-muted-foreground">
                                                        • {formatDate(reply.createdAt)}
                                                    </span>
                                                </div>
                                                {(reply.authorId === convexUser._id || canModerate) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleDeleteReply(reply._id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <p className="mt-2 whitespace-pre-wrap">{reply.content}</p>
                                            <div className="flex items-center gap-4 mt-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 gap-1 text-muted-foreground hover:text-primary"
                                                    onClick={() => handleLike(reply._id)}
                                                >
                                                    <ThumbsUp className="h-4 w-4" />
                                                    {reply.likesCount > 0 && reply.likesCount}
                                                </Button>
                                                {(isTopicAuthor || canModerate) && !reply.isAcceptedAnswer && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 gap-1 text-muted-foreground hover:text-emerald-500"
                                                        onClick={() => handleAcceptAnswer(reply._id)}
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Marcar como solução
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Reply Form */}
            {!topic.isLocked && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Sua Resposta</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Escreva sua resposta..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="min-h-[120px] mb-4"
                        />
                        <div className="flex justify-end">
                            <Button onClick={handleSubmitReply} disabled={isSubmitting} className="gap-2">
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                Enviar Resposta
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {topic.isLocked && (
                <Card className="bg-muted">
                    <CardContent className="py-6 text-center text-muted-foreground">
                        <Lock className="h-6 w-6 mx-auto mb-2" />
                        <p>Este tópico está bloqueado para novas respostas</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
