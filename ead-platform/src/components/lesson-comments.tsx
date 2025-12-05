"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    MessageSquare,
    ThumbsUp,
    Pin,
    CheckCircle2,
    Reply,
    MoreHorizontal,
    Trash2,
    Edit2,
    Loader2,
    Send,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LessonCommentsProps {
    lessonId: Id<"lessons">;
    userId: Id<"users">;
    userRole: string;
}

export function LessonComments({ lessonId, userId, userRole }: LessonCommentsProps) {
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<Id<"lessonComments"> | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [editingId, setEditingId] = useState<Id<"lessonComments"> | null>(null);
    const [editContent, setEditContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const comments = useQuery(api.comments.getByLesson, { lessonId });
    const createComment = useMutation(api.comments.create);
    const updateComment = useMutation(api.comments.update);
    const deleteComment = useMutation(api.comments.remove);
    const toggleLike = useMutation(api.comments.toggleLike);
    const toggleResolved = useMutation(api.comments.toggleResolved);
    const togglePinned = useMutation(api.comments.togglePinned);

    const canModerate = userRole === "professor" || userRole === "admin" || userRole === "superadmin";

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;
        setIsSubmitting(true);

        try {
            await createComment({
                lessonId,
                userId,
                content: newComment.trim(),
            });
            setNewComment("");
            toast.success("Comentário enviado!");
        } catch (error) {
            toast.error("Erro ao enviar comentário");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitReply = async (parentId: Id<"lessonComments">) => {
        if (!replyContent.trim()) return;
        setIsSubmitting(true);

        try {
            await createComment({
                lessonId,
                userId,
                content: replyContent.trim(),
                parentId,
            });
            setReplyContent("");
            setReplyingTo(null);
            toast.success("Resposta enviada!");
        } catch (error) {
            toast.error("Erro ao enviar resposta");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateComment = async (commentId: Id<"lessonComments">) => {
        if (!editContent.trim()) return;
        setIsSubmitting(true);

        try {
            await updateComment({
                commentId,
                content: editContent.trim(),
            });
            setEditingId(null);
            setEditContent("");
            toast.success("Comentário atualizado!");
        } catch (error) {
            toast.error("Erro ao atualizar comentário");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: Id<"lessonComments">) => {
        if (!confirm("Tem certeza que deseja excluir este comentário?")) return;

        try {
            await deleteComment({ commentId });
            toast.success("Comentário excluído!");
        } catch (error) {
            toast.error("Erro ao excluir comentário");
        }
    };

    const handleLike = async (commentId: Id<"lessonComments">) => {
        try {
            await toggleLike({ commentId, userId });
        } catch (error) {
            toast.error("Erro ao curtir comentário");
        }
    };

    const formatDate = (timestamp: number) => {
        return formatDistanceToNow(new Date(timestamp), {
            addSuffix: true,
            locale: ptBR,
        });
    };

    if (comments === undefined) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Dúvidas e Comentários
                    <Badge variant="secondary">{comments.length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* New Comment Form */}
                <div className="space-y-3">
                    <Textarea
                        placeholder="Escreva sua dúvida ou comentário..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px] resize-none"
                    />
                    <div className="flex justify-end">
                        <Button
                            onClick={handleSubmitComment}
                            disabled={!newComment.trim() || isSubmitting}
                            className="gap-2"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            Enviar
                        </Button>
                    </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                    <AnimatePresence>
                        {comments.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                <p>Nenhum comentário ainda</p>
                                <p className="text-sm">Seja o primeiro a comentar!</p>
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <motion.div
                                    key={comment._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={cn(
                                        "p-4 rounded-lg border",
                                        comment.isPinned && "border-primary/50 bg-primary/5",
                                        comment.isResolved && "border-emerald-500/50 bg-emerald-500/5"
                                    )}
                                >
                                    {/* Comment Header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={comment.user?.imageUrl} />
                                                <AvatarFallback>
                                                    {comment.user?.name?.[0] || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{comment.user?.name}</span>
                                                    {comment.user?.role === "professor" && (
                                                        <Badge variant="secondary" className="text-xs">Professor</Badge>
                                                    )}
                                                    {comment.isPinned && (
                                                        <Badge variant="outline" className="text-xs gap-1">
                                                            <Pin className="h-3 w-3" /> Fixado
                                                        </Badge>
                                                    )}
                                                    {comment.isResolved && (
                                                        <Badge className="text-xs gap-1 bg-emerald-500">
                                                            <CheckCircle2 className="h-3 w-3" /> Resolvido
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(comment.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions Menu */}
                                        {(comment.userId === userId || canModerate) && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {comment.userId === userId && (
                                                        <DropdownMenuItem onClick={() => {
                                                            setEditingId(comment._id);
                                                            setEditContent(comment.content);
                                                        }}>
                                                            <Edit2 className="h-4 w-4 mr-2" /> Editar
                                                        </DropdownMenuItem>
                                                    )}
                                                    {canModerate && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => togglePinned({ commentId: comment._id })}>
                                                                <Pin className="h-4 w-4 mr-2" />
                                                                {comment.isPinned ? "Desafixar" : "Fixar"}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => toggleResolved({ commentId: comment._id })}>
                                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                                {comment.isResolved ? "Reabrir" : "Marcar resolvido"}
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(comment._id)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>

                                    {/* Comment Content */}
                                    {editingId === comment._id ? (
                                        <div className="mt-3 space-y-2">
                                            <Textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="min-h-[60px]"
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEditingId(null)}
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleUpdateComment(comment._id)}
                                                    disabled={isSubmitting}
                                                >
                                                    Salvar
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-sm whitespace-pre-wrap">{comment.content}</p>
                                    )}

                                    {/* Comment Actions */}
                                    <div className="flex items-center gap-4 mt-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-muted-foreground hover:text-primary"
                                            onClick={() => handleLike(comment._id)}
                                        >
                                            <ThumbsUp className="h-4 w-4 mr-1" />
                                            {comment.likesCount > 0 && comment.likesCount}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-muted-foreground"
                                            onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                                        >
                                            <Reply className="h-4 w-4 mr-1" />
                                            Responder
                                        </Button>
                                    </div>

                                    {/* Reply Form */}
                                    {replyingTo === comment._id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-3 pl-6 border-l-2"
                                        >
                                            <Textarea
                                                placeholder="Escreva sua resposta..."
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                className="min-h-[60px] text-sm"
                                            />
                                            <div className="flex gap-2 mt-2 justify-end">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setReplyingTo(null)}
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSubmitReply(comment._id)}
                                                    disabled={!replyContent.trim() || isSubmitting}
                                                >
                                                    Responder
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Replies */}
                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="mt-4 pl-6 border-l-2 space-y-3">
                                            {comment.replies.map((reply: any) => (
                                                <div key={reply._id} className="p-3 bg-muted/50 rounded-lg">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start gap-2">
                                                            <Avatar className="h-7 w-7">
                                                                <AvatarImage src={reply.user?.imageUrl} />
                                                                <AvatarFallback className="text-xs">
                                                                    {reply.user?.name?.[0] || "?"}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-sm">{reply.user?.name}</span>
                                                                    {reply.user?.role === "professor" && (
                                                                        <Badge variant="secondary" className="text-xs">Professor</Badge>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {formatDate(reply.createdAt)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {(reply.userId === userId || canModerate) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => handleDelete(reply._id)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <p className="mt-2 text-sm">{reply.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
}
