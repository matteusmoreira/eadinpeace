"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    MessageCircle,
    Heart,
    Reply,
    Pin,
    CheckCircle,
    MoreVertical,
    Send,
    Loader2,
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
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LessonCommentsProps {
    lessonId: Id<"lessons">;
    userId: Id<"users">;
    userRole: "student" | "professor" | "admin" | "superadmin";
}

export function LessonComments({ lessonId, userId, userRole }: LessonCommentsProps) {
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<Id<"lessonComments"> | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const comments = useQuery(api.comments.getByLesson, { lessonId });
    const createComment = useMutation(api.comments.create);
    const likeComment = useMutation(api.comments.toggleLike);
    const toggleResolved = useMutation(api.comments.toggleResolved);
    const togglePinned = useMutation(api.comments.togglePinned);
    const removeComment = useMutation(api.comments.remove);

    const canModerate = userRole === "professor" || userRole === "admin" || userRole === "superadmin";

    const handleSubmit = async () => {
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            await createComment({
                lessonId,
                userId,
                content: newComment,
            });
            setNewComment("");
        } catch (error) {
            console.error("Error creating comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReply = async (parentId: Id<"lessonComments">) => {
        if (!replyContent.trim()) return;

        setIsSubmitting(true);
        try {
            await createComment({
                lessonId,
                userId,
                content: replyContent,
                parentId,
            });
            setReplyContent("");
            setReplyingTo(null);
        } catch (error) {
            console.error("Error creating reply:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (timestamp: number) => {
        return formatDistanceToNow(new Date(timestamp), {
            addSuffix: true,
            locale: ptBR,
        });
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "professor":
                return <Badge className="bg-amber-500 text-white text-xs">Professor</Badge>;
            case "admin":
                return <Badge className="bg-primary text-primary-foreground text-xs">Admin</Badge>;
            case "superadmin":
                return <Badge className="bg-violet-500 text-white text-xs">Super Admin</Badge>;
            default:
                return null;
        }
    };

    // Separar comentários fixados dos demais
    const pinnedComments = comments?.filter(c => c.isPinned) || [];
    const regularComments = comments?.filter(c => !c.isPinned) || [];

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircle className="h-5 w-5" />
                    Comentários
                    {comments && (
                        <Badge variant="secondary" className="ml-2">
                            {comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
                {/* New Comment Form */}
                <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback>EU</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                        <Textarea
                            placeholder="Escreva um comentário ou dúvida..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[80px] resize-none"
                        />
                        <div className="flex justify-end">
                            <Button
                                onClick={handleSubmit}
                                disabled={!newComment.trim() || isSubmitting}
                                className="gap-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                Comentar
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Comments List */}
                {comments === undefined ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">Nenhum comentário ainda</p>
                        <p className="text-sm">Seja o primeiro a comentar!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Pinned Comments */}
                        {pinnedComments.map((comment) => (
                            <CommentItem
                                key={comment._id}
                                comment={comment}
                                formatDate={formatDate}
                                getRoleBadge={getRoleBadge}
                                canModerate={canModerate}
                                userId={userId}
                                replyingTo={replyingTo}
                                setReplyingTo={setReplyingTo}
                                replyContent={replyContent}
                                setReplyContent={setReplyContent}
                                handleReply={handleReply}
                                isSubmitting={isSubmitting}
                                likeComment={likeComment}
                                toggleResolved={toggleResolved}
                                togglePinned={togglePinned}
                                removeComment={removeComment}
                                isPinned={true}
                            />
                        ))}

                        {/* Regular Comments */}
                        {regularComments.map((comment) => (
                            <CommentItem
                                key={comment._id}
                                comment={comment}
                                formatDate={formatDate}
                                getRoleBadge={getRoleBadge}
                                canModerate={canModerate}
                                userId={userId}
                                replyingTo={replyingTo}
                                setReplyingTo={setReplyingTo}
                                replyContent={replyContent}
                                setReplyContent={setReplyContent}
                                handleReply={handleReply}
                                isSubmitting={isSubmitting}
                                likeComment={likeComment}
                                toggleResolved={toggleResolved}
                                togglePinned={togglePinned}
                                removeComment={removeComment}
                                isPinned={false}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface CommentItemProps {
    comment: any;
    formatDate: (timestamp: number) => string;
    getRoleBadge: (role: string) => React.ReactNode | null;
    canModerate: boolean;
    userId: Id<"users">;
    replyingTo: Id<"lessonComments"> | null;
    setReplyingTo: (id: Id<"lessonComments"> | null) => void;
    replyContent: string;
    setReplyContent: (content: string) => void;
    handleReply: (parentId: Id<"lessonComments">) => void;
    isSubmitting: boolean;
    likeComment: any;
    toggleResolved: any;
    togglePinned: any;
    removeComment: any;
    isPinned: boolean;
}

function CommentItem({
    comment,
    formatDate,
    getRoleBadge,
    canModerate,
    userId,
    replyingTo,
    setReplyingTo,
    replyContent,
    setReplyContent,
    handleReply,
    isSubmitting,
    likeComment,
    toggleResolved,
    togglePinned,
    removeComment,
    isPinned,
}: CommentItemProps) {
    return (
        <div className={`rounded-lg p-4 space-y-3 ${isPinned ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-muted/30'}`}>
            {/* Comment Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user?.imageUrl} />
                        <AvatarFallback>
                            {comment.user?.name?.split(' ').map((n: string) => n[0]).join('') || '??'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{comment.user?.name || 'Usuário'}</span>
                            {comment.user?.role && getRoleBadge(comment.user.role)}
                            {isPinned && (
                                <Badge variant="outline" className="text-amber-500 border-amber-500">
                                    <Pin className="h-3 w-3 mr-1" />
                                    Fixado
                                </Badge>
                            )}
                            {comment.isResolved && (
                                <Badge className="bg-emerald-500 text-white">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Resolvido
                                </Badge>
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                    </div>
                </div>

                {/* Actions Menu */}
                {(canModerate || comment.userId === userId) && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {canModerate && (
                                <>
                                    <DropdownMenuItem onClick={() => togglePinned({ commentId: comment._id })}>
                                        <Pin className="h-4 w-4 mr-2" />
                                        {isPinned ? 'Desfixar' : 'Fixar'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => toggleResolved({ commentId: comment._id })}>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        {comment.isResolved ? 'Marcar não resolvido' : 'Marcar como resolvido'}
                                    </DropdownMenuItem>
                                </>
                            )}
                            {comment.userId === userId && (
                                <DropdownMenuItem
                                    className="text-red-500"
                                    onClick={() => removeComment({ commentId: comment._id })}
                                >
                                    Excluir
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Comment Content */}
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

            {/* Comment Actions */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-muted-foreground hover:text-red-500"
                    onClick={() => likeComment({ commentId: comment._id })}
                >
                    <Heart className="h-4 w-4 mr-1" />
                    {comment.likes > 0 && comment.likes}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-muted-foreground"
                    onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                >
                    <Reply className="h-4 w-4 mr-1" />
                    Responder
                </Button>
            </div>

            {/* Reply Form */}
            {replyingTo === comment._id && (
                <div className="flex gap-2 pt-2">
                    <Textarea
                        placeholder="Escreva sua resposta..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="min-h-[60px] resize-none text-sm"
                    />
                    <div className="flex flex-col gap-1">
                        <Button
                            size="sm"
                            onClick={() => handleReply(comment._id)}
                            disabled={!replyContent.trim() || isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                setReplyingTo(null);
                                setReplyContent("");
                            }}
                        >
                            ✕
                        </Button>
                    </div>
                </div>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 space-y-3 pt-2 border-l-2 border-muted pl-4">
                    {comment.replies.map((reply: any) => (
                        <div key={reply._id} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={reply.user?.imageUrl} />
                                    <AvatarFallback className="text-xs">
                                        {reply.user?.name?.split(' ').map((n: string) => n[0]).join('') || '??'}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">{reply.user?.name || 'Usuário'}</span>
                                {reply.user?.role && getRoleBadge(reply.user.role)}
                                <span className="text-xs text-muted-foreground">{formatDate(reply.createdAt)}</span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-muted-foreground hover:text-red-500"
                                onClick={() => likeComment({ commentId: reply._id })}
                            >
                                <Heart className="h-3 w-3 mr-1" />
                                {reply.likes > 0 && reply.likes}
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
