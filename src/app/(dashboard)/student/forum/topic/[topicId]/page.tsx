"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    MessageCircle,
    Eye,
    Pin,
    Lock,
    CheckCircle,
    Clock,
    ThumbsUp,
    MoreHorizontal,
    Loader2,
    Send,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

export default function TopicPage() {
    const params = useParams();
    const router = useRouter();
    const topicId = params.topicId as Id<"forumTopics">;
    const { user } = useUser();

    const [replyContent, setReplyContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get topic
    const topic = useQuery(api.forum.getTopic, { topicId });

    // Get replies
    const replies = useQuery(api.forum.getReplies, { topicId });

    // Mutations
    const createReply = useMutation(api.forum.createReply);
    const incrementViewCount = useMutation(api.forum.incrementViewCount);
    const toggleReplyLike = useMutation(api.forum.toggleReplyLike);
    const toggleAcceptedAnswer = useMutation(api.forum.toggleAcceptedAnswer);

    // Increment view count on mount
    useEffect(() => {
        if (topicId) {
            incrementViewCount({ topicId }).catch(console.error);
        }
    }, [topicId, incrementViewCount]);

    const handleSubmitReply = async () => {
        if (!convexUser || !replyContent.trim()) {
            toast.error("Escreva uma resposta");
            return;
        }

        setIsSubmitting(true);
        try {
            await createReply({
                topicId,
                authorId: convexUser._id,
                content: replyContent.trim(),
            });
            toast.success("Resposta enviada!");
            setReplyContent("");
        } catch (error) {
            toast.error("Erro ao enviar resposta");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLikeReply = async (replyId: Id<"forumReplies">) => {
        if (!convexUser) return;
        try {
            await toggleReplyLike({
                replyId,
                userId: convexUser._id,
            });
        } catch (error) {
            toast.error("Erro ao curtir");
        }
    };

    const handleAcceptAnswer = async (replyId: Id<"forumReplies">) => {
        try {
            await toggleAcceptedAnswer({ replyId });
            toast.success("Resposta marcada como aceita!");
        } catch (error) {
            toast.error("Erro ao marcar resposta");
        }
    };

    if (!topic || !convexUser) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const isAuthor = topic.authorId === convexUser._id;
    const canAcceptAnswer = isAuthor || convexUser.role === "professor" || convexUser.role === "admin";

    return (
        <div className="container mx-auto py-6 max-w-4xl">
            {/* Back button */}
            <Link href="/student/forum">
                <Button variant="ghost" className="mb-4 gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Fórum
                </Button>
            </Link>

            {/* Topic Header */}
            <Card className="mb-6">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={topic.author?.imageUrl} />
                            <AvatarFallback>
                                {topic.author?.firstName?.[0]}{topic.author?.lastName?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                {topic.isPinned && <Pin className="h-4 w-4 text-primary" />}
                                {topic.isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                                {topic.isSolved && (
                                    <Badge className="bg-emerald-500 text-white text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Resolvido
                                    </Badge>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold mb-2">{topic.title}</h1>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                <span>
                                    Por <strong>{topic.author?.firstName} {topic.author?.lastName}</strong>
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(topic.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {topic.viewCount || 0} visualizações
                                </span>
                                <span className="flex items-center gap-1">
                                    <MessageCircle className="h-3 w-3" />
                                    {topic.replyCount || 0} respostas
                                </span>
                            </div>
                            <div className="prose dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap">{topic.content}</p>
                            </div>
                            {topic.tags && topic.tags.length > 0 && (
                                <div className="flex gap-2 mt-4">
                                    {topic.tags.map((tag: string) => (
                                        <Badge key={tag} variant="outline">{tag}</Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Replies */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Respostas ({replies?.length || 0})
                </h2>

                {replies && replies.length > 0 ? (
                    replies.map((reply: any) => (
                        <motion.div
                            key={reply._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className={reply.isAcceptedAnswer ? "border-emerald-500 border-2" : ""}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={reply.author?.imageUrl} />
                                            <AvatarFallback>
                                                {reply.author?.firstName?.[0]}{reply.author?.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        {reply.author?.firstName} {reply.author?.lastName}
                                                    </span>
                                                    {reply.isAcceptedAnswer && (
                                                        <Badge className="bg-emerald-500 text-white text-xs">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Resposta Aceita
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(reply.createdAt, {
                                                        addSuffix: true,
                                                        locale: ptBR,
                                                    })}
                                                </span>
                                            </div>
                                            <p className="whitespace-pre-wrap text-sm">{reply.content}</p>
                                            <div className="flex items-center gap-4 mt-3">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleLikeReply(reply._id)}
                                                    className="gap-1"
                                                >
                                                    <ThumbsUp className="h-4 w-4" />
                                                    {reply.likesCount || 0}
                                                </Button>
                                                {canAcceptAnswer && !topic.isSolved && !reply.isAcceptedAnswer && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleAcceptAnswer(reply._id)}
                                                        className="text-emerald-600"
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Aceitar Resposta
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                ) : (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            Nenhuma resposta ainda. Seja o primeiro a responder!
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Reply Form */}
            {!topic.isLocked ? (
                <Card className="mt-6">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={convexUser.imageUrl} />
                                <AvatarFallback>
                                    {convexUser.firstName?.[0]}{convexUser.lastName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-3">
                                <Textarea
                                    placeholder="Escreva sua resposta..."
                                    rows={4}
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                />
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleSubmitReply}
                                        disabled={isSubmitting || !replyContent.trim()}
                                        className="gradient-bg border-0 gap-2"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                        Enviar Resposta
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="mt-6">
                    <CardContent className="py-6 text-center text-muted-foreground">
                        <Lock className="h-8 w-8 mx-auto mb-2" />
                        Este tópico está bloqueado e não aceita novas respostas.
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
