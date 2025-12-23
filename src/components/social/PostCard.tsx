"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Heart,
    MessageCircle,
    Share2,
    MoreHorizontal,
    Trash2,
    Globe,
    Users,
    Lock,
    Repeat2,
    Play,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Id } from "@convex/_generated/dataModel";
import Link from "next/link";

interface Author {
    _id: Id<"users">;
    firstName: string;
    lastName: string;
    imageUrl?: string;
    role: string;
}

interface Post {
    _id: Id<"socialPosts">;
    authorId: Id<"users">;
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    visibility: "public" | "followers" | "private";
    isShared: boolean;
    originalPostId?: Id<"socialPosts">;
    shareComment?: string;
    createdAt: number;
    author: Author | null;
    originalPost?: {
        content: string;
        imageUrl?: string;
        videoUrl?: string;
        author: Author | null;
    } | null;
    isLikedByUser: boolean;
}

interface PostCardProps {
    post: Post;
    currentUserId: Id<"users">;
    onLike: (postId: Id<"socialPosts">) => void;
    onComment: (postId: Id<"socialPosts">) => void;
    onShare: (postId: Id<"socialPosts">) => void;
    onDelete: (postId: Id<"socialPosts">) => void;
}

const visibilityIcons = {
    public: <Globe className="h-3 w-3" />,
    followers: <Users className="h-3 w-3" />,
    private: <Lock className="h-3 w-3" />,
};

const visibilityLabels = {
    public: "Público",
    followers: "Seguidores",
    private: "Privado",
};

const roleLabels: Record<string, string> = {
    student: "Aluno",
    professor: "Professor",
    admin: "Admin",
    superadmin: "Super Admin",
};

const roleColors: Record<string, string> = {
    student: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    professor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    admin: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    superadmin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// Função para extrair ID do vídeo de URLs do YouTube/Vimeo
const extractVideoId = (url: string): { provider: "youtube" | "vimeo" | null; id: string | null } => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/);
    if (youtubeMatch) {
        return { provider: "youtube", id: youtubeMatch[1] };
    }

    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeoMatch) {
        return { provider: "vimeo", id: vimeoMatch[1] };
    }

    return { provider: null, id: null };
};

// Componente de vídeo embutido
function EmbeddedVideo({ url }: { url: string }) {
    const [isLoading, setIsLoading] = useState(true);
    const videoInfo = extractVideoId(url);

    if (!videoInfo.provider || !videoInfo.id) {
        return null;
    }

    return (
        <div className="relative mt-3 rounded-lg overflow-hidden aspect-video bg-muted">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <Play className="h-12 w-12 text-muted-foreground animate-pulse" />
                </div>
            )}
            {videoInfo.provider === "youtube" ? (
                <iframe
                    src={`https://www.youtube.com/embed/${videoInfo.id}`}
                    title="YouTube video"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => setIsLoading(false)}
                />
            ) : (
                <iframe
                    src={`https://player.vimeo.com/video/${videoInfo.id}`}
                    title="Vimeo video"
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    onLoad={() => setIsLoading(false)}
                />
            )}
        </div>
    );
}

// Componente para renderizar texto com emojis e links clicáveis
function FormattedContent({ content }: { content: string }) {
    // Regex para detectar URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const parts = content.split(urlRegex);

    return (
        <p className="whitespace-pre-wrap break-words">
            {parts.map((part, index) => {
                if (urlRegex.test(part)) {
                    // Reset regex lastIndex
                    urlRegex.lastIndex = 0;
                    return (
                        <a
                            key={index}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            {part}
                        </a>
                    );
                }
                return <span key={index}>{part}</span>;
            })}
        </p>
    );
}

export function PostCard({
    post,
    currentUserId,
    onLike,
    onComment,
    onShare,
    onDelete,
}: PostCardProps) {
    const [isLiked, setIsLiked] = useState(post.isLikedByUser);
    const [likesCount, setLikesCount] = useState(post.likesCount);
    const [isLiking, setIsLiking] = useState(false);

    const isOwnPost = post.authorId === currentUserId;

    const handleLike = async () => {
        if (isLiking) return;
        setIsLiking(true);

        // Optimistic update
        setIsLiked(!isLiked);
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

        try {
            await onLike(post._id);
        } catch {
            // Reverter se falhar
            setIsLiked(isLiked);
            setLikesCount(post.likesCount);
        } finally {
            setIsLiking(false);
        }
    };

    const formatDate = (timestamp: number) => {
        return formatDistanceToNow(new Date(timestamp), {
            addSuffix: true,
            locale: ptBR,
        });
    };

    // Determinar conteúdo a exibir (pode ser post original se for compartilhado)
    const displayContent = post.isShared && post.originalPost ? post.originalPost.content : post.content;
    const displayImageUrl = post.isShared && post.originalPost ? post.originalPost.imageUrl : post.imageUrl;
    const displayVideoUrl = post.isShared && post.originalPost ? post.originalPost.videoUrl : post.videoUrl;
    const displayAuthor = post.isShared && post.originalPost ? post.originalPost.author : post.author;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                    {/* Se for compartilhamento, mostrar quem compartilhou */}
                    {post.isShared && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 pb-3 border-b">
                            <Repeat2 className="h-4 w-4" />
                            <Link
                                href={`/student/community/profile/${post.authorId}`}
                                className="font-medium hover:underline"
                            >
                                {post.author?.firstName} {post.author?.lastName}
                            </Link>
                            <span>compartilhou</span>
                        </div>
                    )}

                    {/* Header do post */}
                    <div className="flex items-start gap-3">
                        <Link href={`/student/community/profile/${displayAuthor?._id || post.authorId}`}>
                            <Avatar className="h-10 w-10 ring-2 ring-background shadow">
                                <AvatarImage src={displayAuthor?.imageUrl} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                                    {displayAuthor?.firstName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                        </Link>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                    href={`/student/community/profile/${displayAuthor?._id || post.authorId}`}
                                    className="font-semibold hover:underline"
                                >
                                    {displayAuthor?.firstName} {displayAuthor?.lastName}
                                </Link>
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        "text-xs px-1.5 py-0",
                                        roleColors[displayAuthor?.role || "student"]
                                    )}
                                >
                                    {roleLabels[displayAuthor?.role || "student"]}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatDate(post.createdAt)}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    {visibilityIcons[post.visibility]}
                                    {visibilityLabels[post.visibility]}
                                </span>
                            </div>
                        </div>

                        {isOwnPost && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => onDelete(post._id)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {/* Comentário do compartilhamento */}
                    {post.isShared && post.shareComment && (
                        <p className="mt-3 text-sm italic text-muted-foreground">
                            &quot;{post.shareComment}&quot;
                        </p>
                    )}

                    {/* Conteúdo do post */}
                    <div className={cn(
                        "mt-3",
                        post.isShared && "bg-muted/50 rounded-lg p-3 border"
                    )}>
                        <FormattedContent content={displayContent} />

                        {/* Imagem do post */}
                        {displayImageUrl && (
                            <div className="mt-3 rounded-lg overflow-hidden">
                                <img
                                    src={displayImageUrl}
                                    alt="Post image"
                                    className="w-full max-h-96 object-cover"
                                    onError={(e) => {
                                        // Esconder imagem se não carregar
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}

                        {/* Vídeo do post */}
                        {displayVideoUrl && <EmbeddedVideo url={displayVideoUrl} />}
                    </div>

                    {/* Contadores */}
                    {(likesCount > 0 || post.commentsCount > 0 || post.sharesCount > 0) && (
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm text-muted-foreground">
                            {likesCount > 0 && (
                                <span>{likesCount} curtida{likesCount !== 1 ? "s" : ""}</span>
                            )}
                            {post.commentsCount > 0 && (
                                <span>{post.commentsCount} comentário{post.commentsCount !== 1 ? "s" : ""}</span>
                            )}
                            {post.sharesCount > 0 && (
                                <span>{post.sharesCount} compartilhamento{post.sharesCount !== 1 ? "s" : ""}</span>
                            )}
                        </div>
                    )}

                    {/* Ações */}
                    <div className="flex items-center gap-1 mt-3 pt-3 border-t">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLike}
                            disabled={isLiking}
                            className={cn(
                                "flex-1 gap-2",
                                isLiked && "text-red-500 hover:text-red-600"
                            )}
                        >
                            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                            Curtir
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onComment(post._id)}
                            className="flex-1 gap-2"
                        >
                            <MessageCircle className="h-4 w-4" />
                            Comentar
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onShare(post._id)}
                            className="flex-1 gap-2"
                        >
                            <Share2 className="h-4 w-4" />
                            Compartilhar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
