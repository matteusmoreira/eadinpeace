"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Reply, Loader2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Id } from "@convex/_generated/dataModel";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

interface Author {
    _id: Id<"users">;
    firstName: string;
    lastName: string;
    imageUrl?: string;
}

interface Comment {
    _id: Id<"postComments">;
    authorId: Id<"users">;
    content: string;
    likesCount: number;
    createdAt: number;
    author: Author | null;
    isLikedByUser: boolean;
    replies?: Comment[];
}

interface CommentSectionProps {
    postId: Id<"socialPosts">;
    currentUserId: Id<"users">;
    onAddComment: (content: string, parentId?: Id<"postComments">) => Promise<void>;
    onLikeComment: (commentId: Id<"postComments">) => Promise<void>;
    onDeleteComment: (commentId: Id<"postComments">) => Promise<void>;
    isAdding?: boolean;
}

export function CommentSection({
    postId,
    currentUserId,
    onAddComment,
    onLikeComment,
    onDeleteComment,
    isAdding = false,
}: CommentSectionProps) {
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<Id<"postComments"> | null>(null);
    const [replyContent, setReplyContent] = useState("");

    const commentsData = useQuery(api.social.getComments, { postId, userId: currentUserId });
    const comments = commentsData || [];

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;
        await onAddComment(newComment.trim());
        setNewComment("");
    };

    const handleSubmitReply = async (parentId: Id<"postComments">) => {
        if (!replyContent.trim()) return;
        await onAddComment(replyContent.trim(), parentId);
        setReplyContent("");
        setReplyingTo(null);
    };

    const formatDate = (timestamp: number) => {
        return formatDistanceToNow(new Date(timestamp), {
            addSuffix: true,
            locale: ptBR,
        });
    };

    return (
        <div className="space-y-4 mt-4 pt-4 border-t">
            {/* Formulário de novo comentário */}
            <div className="flex gap-3">
                <div className="flex-1">
                    <Textarea
                        placeholder="Escreva um comentário..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[60px] resize-none"
                    />
                </div>
                <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isAdding}
                    size="sm"
                >
                    {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Comentar
                </Button>
            </div>

            {/* Lista de comentários */}
            <div className="space-y-4">
                {comments.map((comment) => (
                    <CommentItem
                        key={comment._id}
                        comment={comment}
                        currentUserId={currentUserId}
                        onLike={onLikeComment}
                        onDelete={onDeleteComment}
                        onReply={() => setReplyingTo(comment._id)}
                        isReplying={replyingTo === comment._id}
                        replyContent={replyingTo === comment._id ? replyContent : ""}
                        onReplyContentChange={setReplyContent}
                        onSubmitReply={() => handleSubmitReply(comment._id)}
                        onCancelReply={() => {
                            setReplyingTo(null);
                            setReplyContent("");
                        }}
                        formatDate={formatDate}
                    />
                ))}
            </div>
        </div>
    );
}

interface CommentItemProps {
    comment: Comment;
    currentUserId: Id<"users">;
    onLike: (commentId: Id<"postComments">) => Promise<void>;
    onDelete: (commentId: Id<"postComments">) => Promise<void>;
    onReply: () => void;
    isReplying: boolean;
    replyContent: string;
    onReplyContentChange: (content: string) => void;
    onSubmitReply: () => void;
    onCancelReply: () => void;
    formatDate: (timestamp: number) => string;
    isReply?: boolean;
}

function CommentItem({
    comment,
    currentUserId,
    onLike,
    onDelete,
    onReply,
    isReplying,
    replyContent,
    onReplyContentChange,
    onSubmitReply,
    onCancelReply,
    formatDate,
    isReply = false,
}: CommentItemProps) {
    const [isLiked, setIsLiked] = useState(comment.isLikedByUser);
    const [likesCount, setLikesCount] = useState(comment.likesCount);
    const [isLiking, setIsLiking] = useState(false);

    const isOwnComment = comment.authorId === currentUserId;

    const handleLike = async () => {
        if (isLiking) return;
        setIsLiking(true);

        setIsLiked(!isLiked);
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

        try {
            await onLike(comment._id);
        } catch {
            setIsLiked(isLiked);
            setLikesCount(comment.likesCount);
        } finally {
            setIsLiking(false);
        }
    };

    return (
        <div className={cn("space-y-3", isReply && "ml-10")}>
            <div className="flex gap-3">
                <Link href={`/student/community/profile/${comment.authorId}`}>
                    <Avatar className={cn("ring-2 ring-background shadow", isReply ? "h-7 w-7" : "h-8 w-8")}>
                        <AvatarImage src={comment.author?.imageUrl} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-xs">
                            {comment.author?.firstName?.[0]}
                        </AvatarFallback>
                    </Avatar>
                </Link>

                <div className="flex-1">
                    <div className="bg-muted/50 rounded-lg px-3 py-2">
                        <Link
                            href={`/student/community/profile/${comment.authorId}`}
                            className="font-medium text-sm hover:underline"
                        >
                            {comment.author?.firstName} {comment.author?.lastName}
                        </Link>
                        <p className="text-sm mt-1">{comment.content}</p>
                    </div>

                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{formatDate(comment.createdAt)}</span>
                        <button
                            onClick={handleLike}
                            disabled={isLiking}
                            className={cn(
                                "font-medium hover:underline",
                                isLiked && "text-red-500"
                            )}
                        >
                            {likesCount > 0 && `${likesCount} `}Curtir
                        </button>
                        {!isReply && (
                            <button onClick={onReply} className="font-medium hover:underline">
                                Responder
                            </button>
                        )}
                        {isOwnComment && (
                            <button
                                onClick={() => onDelete(comment._id)}
                                className="font-medium hover:underline text-destructive"
                            >
                                Excluir
                            </button>
                        )}
                    </div>

                    {/* Formulário de resposta */}
                    {isReplying && (
                        <div className="flex gap-2 mt-2">
                            <Textarea
                                placeholder="Escreva uma resposta..."
                                value={replyContent}
                                onChange={(e) => onReplyContentChange(e.target.value)}
                                className="min-h-[40px] text-sm"
                            />
                            <div className="flex flex-col gap-1">
                                <Button size="sm" onClick={onSubmitReply} disabled={!replyContent.trim()}>
                                    Enviar
                                </Button>
                                <Button size="sm" variant="ghost" onClick={onCancelReply}>
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Respostas */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="space-y-3 ml-10">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply._id}
                            comment={reply}
                            currentUserId={currentUserId}
                            onLike={onLike}
                            onDelete={onDelete}
                            onReply={() => { }}
                            isReplying={false}
                            replyContent=""
                            onReplyContentChange={() => { }}
                            onSubmitReply={() => { }}
                            onCancelReply={() => { }}
                            formatDate={formatDate}
                            isReply
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
