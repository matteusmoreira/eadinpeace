"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Id } from "@convex/_generated/dataModel";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Users,
    Loader2,
    Heart,
    MessageCircle,
    Share2,
    MoreHorizontal,
    Trash2,
    Globe,
    Lock,
    Image,
    X,
    Repeat2,
    TrendingUp,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { CreatePostForm } from "@/components/social/CreatePostForm";
import { PostCard } from "@/components/social/PostCard";
import { SuggestedUsers } from "@/components/social/SuggestedUsers";
import { CommentSection } from "@/components/social/CommentSection";
import { MessagesPanel } from "@/components/social/MessagesPanel";

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

export default function CommunityPage() {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const conversationIdParam = searchParams.get("conversationId");

    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [shareDialogPost, setShareDialogPost] = useState<Id<"socialPosts"> | null>(null);
    const [shareComment, setShareComment] = useState("");
    const [shareVisibility, setShareVisibility] = useState<"public" | "followers" | "private">("public");
    const [isSharing, setIsSharing] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState<Id<"conversations"> | null>(
        conversationIdParam ? (conversationIdParam as Id<"conversations">) : null
    );

    // Queries
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    const feedData = useQuery(
        api.social.getFeed,
        convexUser?.organizationId && convexUser?._id
            ? {
                organizationId: convexUser.organizationId,
                userId: convexUser._id,
                limit: 20,
            }
            : "skip"
    );

    const suggestedUsers = useQuery(
        api.social.getSuggestedUsers,
        convexUser?.organizationId && convexUser?._id
            ? {
                userId: convexUser._id,
                organizationId: convexUser.organizationId,
                limit: 5,
            }
            : "skip"
    );

    const followStats = useQuery(
        api.social.getFollowStats,
        convexUser?._id ? { userId: convexUser._id } : "skip"
    );

    const conversations = useQuery(
        api.social.getConversations,
        convexUser?._id && convexUser?.organizationId
            ? { userId: convexUser._id, organizationId: convexUser.organizationId }
            : "skip"
    );

    const unreadCount = useQuery(
        api.social.getUnreadCount,
        convexUser?._id && convexUser?.organizationId
            ? { userId: convexUser._id, organizationId: convexUser.organizationId }
            : "skip"
    );

    const messages = useQuery(
        api.social.getMessages,
        selectedConversation ? { conversationId: selectedConversation } : "skip"
    );

    const communitySettings = useQuery(
        api.organizationSettings.getCommunitySettings,
        convexUser?.organizationId ? { organizationId: convexUser.organizationId } : "skip"
    );

    // Mutations
    const createPost = useMutation(api.social.createPost);
    const toggleLike = useMutation(api.social.toggleLike);
    const sharePost = useMutation(api.social.sharePost);
    const deletePost = useMutation(api.social.deletePost);
    const toggleFollow = useMutation(api.social.toggleFollow);
    const addComment = useMutation(api.social.addComment);
    const getComments = useQuery(
        api.social.getComments,
        expandedComments.size > 0 && convexUser
            ? { postId: Array.from(expandedComments)[0] as Id<"socialPosts">, userId: convexUser._id }
            : "skip"
    );
    const toggleCommentLike = useMutation(api.social.toggleCommentLike);
    const deleteComment = useMutation(api.social.deleteComment);
    const sendMessage = useMutation(api.social.sendMessage);
    const markMessagesAsRead = useMutation(api.social.markMessagesAsRead);
    const getOrCreateConversation = useMutation(api.social.getOrCreateConversation);

    // Handlers
    const handleCreatePost = async (data: {
        content: string;
        visibility: "public" | "followers" | "private";
        imageUrl?: string;
        videoUrl?: string;
    }) => {
        if (!convexUser?.organizationId) return;

        try {
            await createPost({
                authorId: convexUser._id,
                organizationId: convexUser.organizationId,
                content: data.content,
                visibility: data.visibility,
                imageUrl: data.imageUrl,
                videoUrl: data.videoUrl,
            });
            toast.success("Post publicado!");
        } catch (error) {
            toast.error("Erro ao publicar post");
        }
    };

    const handleLike = async (postId: Id<"socialPosts">) => {
        if (!convexUser) return;
        try {
            await toggleLike({ postId, userId: convexUser._id });
        } catch (error) {
            toast.error("Erro ao curtir post");
        }
    };

    const handleShare = async () => {
        if (!shareDialogPost || !convexUser?.organizationId) return;

        setIsSharing(true);
        try {
            await sharePost({
                originalPostId: shareDialogPost,
                authorId: convexUser._id,
                organizationId: convexUser.organizationId,
                shareComment: shareComment || undefined,
                visibility: shareVisibility,
            });
            toast.success("Post compartilhado!");
            setShareDialogPost(null);
            setShareComment("");
            setShareVisibility("public");
        } catch (error) {
            toast.error("Erro ao compartilhar post");
        } finally {
            setIsSharing(false);
        }
    };

    const handleDelete = async (postId: Id<"socialPosts">) => {
        if (!convexUser) return;
        try {
            await deletePost({ postId, userId: convexUser._id });
            toast.success("Post excluído");
        } catch (error) {
            toast.error("Erro ao excluir post");
        }
    };

    const handleFollow = async (userId: Id<"users">) => {
        if (!convexUser) return;
        try {
            await toggleFollow({ followerId: convexUser._id, followingId: userId });
        } catch (error) {
            toast.error("Erro ao seguir usuário");
        }
    };

    const handleAddComment = async (postId: Id<"socialPosts">, content: string, parentId?: Id<"postComments">) => {
        if (!convexUser) return;
        try {
            await addComment({
                postId,
                authorId: convexUser._id,
                content,
                parentId,
            });
        } catch (error) {
            toast.error("Erro ao adicionar comentário");
        }
    };

    const handleLikeComment = async (commentId: Id<"postComments">) => {
        if (!convexUser) return;
        try {
            await toggleCommentLike({ commentId, userId: convexUser._id });
        } catch (error) {
            toast.error("Erro ao curtir comentário");
        }
    };

    const handleDeleteComment = async (commentId: Id<"postComments">) => {
        if (!convexUser) return;
        try {
            await deleteComment({ commentId, userId: convexUser._id });
            toast.success("Comentário excluído");
        } catch (error) {
            toast.error("Erro ao excluir comentário");
        }
    };

    const handleSendMessage = async (conversationId: Id<"conversations">, content: string) => {
        if (!convexUser) return;
        try {
            await sendMessage({ conversationId, senderId: convexUser._id, content });
        } catch (error) {
            toast.error("Erro ao enviar mensagem");
        }
    };

    const handleMarkAsRead = async (conversationId: Id<"conversations">) => {
        if (!convexUser) return;
        try {
            await markMessagesAsRead({ conversationId, userId: convexUser._id });
        } catch (error) {
            console.error("Erro ao marcar como lida:", error);
        }
    };

    const handleMessageUser = async (userId: Id<"users">) => {
        if (!convexUser?.organizationId) return;
        try {
            const conversationId = await getOrCreateConversation({
                organizationId: convexUser.organizationId,
                participantIds: [convexUser._id, userId],
            });
            setSelectedConversation(conversationId);
            toast.success("Conversa iniciada!");
        } catch (error) {
            toast.error("Erro ao iniciar conversa");
        }
    };

    const toggleComments = (postId: Id<"socialPosts">) => {
        setExpandedComments((prev) => {
            const next = new Set(prev);
            if (next.has(postId)) {
                next.delete(postId);
            } else {
                next.clear();
                next.add(postId);
            }
            return next;
        });
    };

    // Loading state
    if (!convexUser || feedData === undefined) {
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
                        Conecte-se, compartilhe e interaja com a comunidade
                    </p>
                </div>

                {/* Mensagens */}
                <MessagesPanel
                    currentUserId={convexUser._id}
                    conversations={conversations || []}
                    unreadTotal={unreadCount || 0}
                    onSelectConversation={setSelectedConversation}
                    onSendMessage={handleSendMessage}
                    onMarkAsRead={handleMarkAsRead}
                    selectedConversation={selectedConversation}
                    messages={messages || []}
                    isLoadingMessages={selectedConversation !== null && messages === undefined}
                    isLoadingConversations={conversations === undefined}
                />
            </div>

            {/* Main Layout */}
            <div className="grid lg:grid-cols-12 gap-6">
                {/* Sidebar Esquerda - Perfil */}
                <div className="lg:col-span-3 space-y-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <Avatar className="h-20 w-20 ring-4 ring-background shadow-lg">
                                    <AvatarImage src={convexUser.imageUrl} />
                                    <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-2xl">
                                        {convexUser.firstName?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <h3 className="mt-4 font-semibold text-lg">
                                    {convexUser.firstName} {convexUser.lastName}
                                </h3>
                                <Badge
                                    variant="secondary"
                                    className={cn("mt-1", roleColors[convexUser.role])}
                                >
                                    {roleLabels[convexUser.role]}
                                </Badge>

                                {/* Stats */}
                                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t w-full">
                                    <Link
                                        href={`/student/community/profile/${convexUser._id}?tab=followers`}
                                        className="text-center hover:text-primary transition-colors"
                                    >
                                        <p className="font-bold text-lg">{followStats?.followersCount || 0}</p>
                                        <p className="text-xs text-muted-foreground">Seguidores</p>
                                    </Link>
                                    <Link
                                        href={`/student/community/profile/${convexUser._id}?tab=following`}
                                        className="text-center hover:text-primary transition-colors"
                                    >
                                        <p className="font-bold text-lg">{followStats?.followingCount || 0}</p>
                                        <p className="text-xs text-muted-foreground">Seguindo</p>
                                    </Link>
                                </div>

                                <Link
                                    href={`/student/community/profile/${convexUser._id}`}
                                    className="w-full mt-4"
                                >
                                    <Button variant="outline" className="w-full">
                                        Ver Meu Perfil
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Feed Central */}
                <div className="lg:col-span-6 space-y-4">
                    {/* Create Post */}
                    <CreatePostForm
                        author={{
                            _id: convexUser._id,
                            firstName: convexUser.firstName,
                            lastName: convexUser.lastName,
                            imageUrl: convexUser.imageUrl,
                        }}
                        onSubmit={handleCreatePost}
                    />

                    {/* Posts */}
                    {feedData.posts.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium mb-2">Nenhum post ainda</h3>
                                <p className="text-muted-foreground text-center">
                                    Seja o primeiro a compartilhar algo com a comunidade!
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {feedData.posts.map((post, index) => (
                                <motion.div
                                    key={post._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <PostCard
                                        post={post}
                                        currentUserId={convexUser._id}
                                        onLike={handleLike}
                                        onComment={toggleComments}
                                        onShare={(postId) => setShareDialogPost(postId)}
                                        onDelete={handleDelete}
                                    />

                                    {/* Comentários expandidos */}
                                    {expandedComments.has(post._id) && (
                                        <Card className="mt-2 border-t-0 rounded-t-none">
                                            <CardContent className="pt-4">
                                                <CommentSection
                                                    postId={post._id}
                                                    currentUserId={convexUser._id}
                                                    onAddComment={(content, parentId) =>
                                                        handleAddComment(post._id, content, parentId)
                                                    }
                                                    onLikeComment={handleLikeComment}
                                                    onDeleteComment={handleDeleteComment}
                                                />
                                            </CardContent>
                                        </Card>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar Direita - Sugestões */}
                <div className="lg:col-span-3 space-y-4">
                    <SuggestedUsers
                        users={suggestedUsers || []}
                        currentUserId={convexUser._id}
                        onFollow={handleFollow}
                        onMessage={
                            communitySettings?.directMessagesEnabled &&
                                (communitySettings.directMessagesAllowedFor === "all" ||
                                    (communitySettings.directMessagesAllowedFor === "professors_only" &&
                                        (convexUser.role === "professor" || convexUser.role === "admin" || convexUser.role === "superadmin")))
                                ? handleMessageUser
                                : undefined
                        }
                        isLoading={suggestedUsers === undefined}
                    />

                    {/* Trending - pode ser implementado depois */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Em Alta
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Tendências em breve...
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Share Dialog */}
            <Dialog open={!!shareDialogPost} onOpenChange={() => setShareDialogPost(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Compartilhar Post</DialogTitle>
                        <DialogDescription>
                            Adicione um comentário ao compartilhar
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder="O que você quer dizer sobre isso? (opcional)"
                            value={shareComment}
                            onChange={(e) => setShareComment(e.target.value)}
                            className="min-h-[100px]"
                        />
                        <Select
                            value={shareVisibility}
                            onValueChange={(v) => setShareVisibility(v as typeof shareVisibility)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="public">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        Público
                                    </div>
                                </SelectItem>
                                <SelectItem value="followers">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Apenas Seguidores
                                    </div>
                                </SelectItem>
                                <SelectItem value="private">
                                    <div className="flex items-center gap-2">
                                        <Lock className="h-4 w-4" />
                                        Privado
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShareDialogPost(null)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleShare} disabled={isSharing}>
                            {isSharing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Compartilhar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
