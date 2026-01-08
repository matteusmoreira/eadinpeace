"use client";

import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Id } from "@convex/_generated/dataModel";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    ArrowLeft,
    Loader2,
    MessageCircle,
    Users,
    FileText,
    Calendar,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { PostCard } from "@/components/social/PostCard";
import { FollowButton } from "@/components/social/FollowButton";

const roleLabels: Record<string, string> = {
    student: "Aluno",
    professor: "Professor",
    admin: "Administrador",
    superadmin: "Super Admin",
};

const roleColors: Record<string, string> = {
    student: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    professor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    admin: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    superadmin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user: clerkUser } = useUser();
    const userId = params.userId as Id<"users">;
    const initialTab = searchParams.get("tab") || "posts";

    // Current user
    const currentUser = useQuery(
        api.users.getByClerkId,
        clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
    );

    // Profile data
    const profile = useQuery(
        api.social.getUserProfile,
        currentUser?._id
            ? { userId, viewerId: currentUser._id }
            : "skip"
    );

    const userPosts = useQuery(
        api.social.getUserPosts,
        currentUser?._id
            ? { userId, viewerId: currentUser._id, limit: 20 }
            : "skip"
    );

    const followers = useQuery(
        api.social.getFollowers,
        { userId, limit: 50 }
    );

    const following = useQuery(
        api.social.getFollowing,
        { userId, limit: 50 }
    );

    const communitySettings = useQuery(
        api.organizationSettings.getCommunitySettings,
        currentUser?.organizationId ? { organizationId: currentUser.organizationId } : "skip"
    );

    // Mutations
    const toggleFollow = useMutation(api.social.toggleFollow);
    const toggleLike = useMutation(api.social.toggleLike);
    const deletePost = useMutation(api.social.deletePost);
    const getOrCreateConversation = useMutation(api.social.getOrCreateConversation);

    const handleFollow = async () => {
        if (!currentUser) return;
        try {
            await toggleFollow({ followerId: currentUser._id, followingId: userId });
        } catch (error) {
            toast.error("Erro ao seguir usuário");
        }
    };

    const handleMessage = async () => {
        if (!currentUser?.organizationId) return;
        try {
            const conversationId = await getOrCreateConversation({
                organizationId: currentUser.organizationId,
                participantIds: [currentUser._id, userId],
            });
            // Abrir painel de mensagens ou redirecionar
            router.push(`/student/community?conversationId=${conversationId}`);
            toast.success("Conversa iniciada!");
        } catch (error) {
            toast.error("Erro ao iniciar conversa");
        }
    };

    const handleLike = async (postId: Id<"socialPosts">) => {
        if (!currentUser) return;
        try {
            await toggleLike({ postId, userId: currentUser._id });
        } catch (error) {
            toast.error("Erro ao curtir post");
        }
    };

    const handleDelete = async (postId: Id<"socialPosts">) => {
        if (!currentUser) return;
        try {
            await deletePost({ postId, userId: currentUser._id });
            toast.success("Post excluído");
        } catch (error) {
            toast.error("Erro ao excluir post");
        }
    };

    const formatDate = (timestamp: number) => {
        return formatDistanceToNow(new Date(timestamp), {
            addSuffix: true,
            locale: ptBR,
        });
    };

    // Loading
    if (!currentUser || !profile) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back button */}
            <Link href="/student/community">
                <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para Comunidade
                </Button>
            </Link>

            {/* Profile Header */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Avatar */}
                        <div className="flex justify-center md:justify-start">
                            <Avatar className="h-32 w-32 ring-4 ring-background shadow-xl">
                                <AvatarImage src={profile.imageUrl} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-4xl">
                                    {profile.firstName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center gap-3">
                                <h1 className="text-2xl font-bold">
                                    {profile.firstName} {profile.lastName}
                                </h1>
                                <Badge
                                    variant="secondary"
                                    className={cn("inline-flex w-fit mx-auto md:mx-0", roleColors[profile.role])}
                                >
                                    {roleLabels[profile.role]}
                                </Badge>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center justify-center md:justify-start gap-8 mt-4">
                                <div className="text-center">
                                    <p className="font-bold text-xl">{profile.postsCount}</p>
                                    <p className="text-sm text-muted-foreground">Posts</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-xl">{profile.followersCount}</p>
                                    <p className="text-sm text-muted-foreground">Seguidores</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-xl">{profile.followingCount}</p>
                                    <p className="text-sm text-muted-foreground">Seguindo</p>
                                </div>
                            </div>

                            {/* Actions */}
                            {!profile.isOwnProfile && (
                                <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                                    <FollowButton
                                        userId={userId}
                                        isFollowing={profile.isFollowing}
                                        onToggle={handleFollow}
                                    />
                                    {communitySettings?.directMessagesEnabled &&
                                        (communitySettings.directMessagesAllowedFor === "all" ||
                                            (communitySettings.directMessagesAllowedFor === "professors_only" &&
                                                (currentUser?.role === "professor" || currentUser?.role === "admin" || currentUser?.role === "superadmin"))) && (
                                            <Button
                                                variant="outline"
                                                onClick={handleMessage}
                                                className="gap-2"
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                                Mensagem
                                            </Button>
                                        )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue={initialTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="posts" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Posts
                    </TabsTrigger>
                    <TabsTrigger value="followers" className="gap-2">
                        <Users className="h-4 w-4" />
                        Seguidores
                    </TabsTrigger>
                    <TabsTrigger value="following" className="gap-2">
                        <Users className="h-4 w-4" />
                        Seguindo
                    </TabsTrigger>
                </TabsList>

                {/* Posts Tab */}
                <TabsContent value="posts" className="mt-6">
                    {!userPosts || userPosts.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium mb-2">Nenhum post ainda</h3>
                                <p className="text-muted-foreground text-center">
                                    {profile.isOwnProfile
                                        ? "Você ainda não publicou nada."
                                        : "Este usuário ainda não publicou nada."
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {userPosts.map((post: any, index: number) => (
                                <motion.div
                                    key={post._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <PostCard
                                        post={{
                                            ...post,
                                            isLikedByUser: false, // TODO: Adicionar verificação
                                        }}
                                        currentUserId={currentUser._id}
                                        onLike={handleLike}
                                        onComment={() => { }}
                                        onShare={() => { }}
                                        onDelete={handleDelete}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Followers Tab */}
                <TabsContent value="followers" className="mt-6">
                    {!followers || followers.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium mb-2">Nenhum seguidor ainda</h3>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-3">
                            {followers.map((follower: any) => (
                                <UserListItem
                                    key={follower._id}
                                    user={follower}
                                    currentUserId={currentUser._id}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Following Tab */}
                <TabsContent value="following" className="mt-6">
                    {!following || following.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium mb-2">Não segue ninguém ainda</h3>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-3">
                            {following.map((followedUser: any) => (
                                <UserListItem
                                    key={followedUser._id}
                                    user={followedUser}
                                    currentUserId={currentUser._id}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

interface UserListItemProps {
    user: {
        _id: Id<"users">;
        firstName: string;
        lastName: string;
        imageUrl?: string;
        role: string;
    };
    currentUserId: Id<"users">;
}

function UserListItem({ user, currentUserId }: UserListItemProps) {
    const isCurrentUser = user._id === currentUserId;

    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-4">
                <Link href={`/student/community/profile/${user._id}`}>
                    <Avatar className="h-12 w-12 ring-2 ring-background shadow">
                        <AvatarImage src={user.imageUrl} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                            {user.firstName?.[0]}
                        </AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                    <Link
                        href={`/student/community/profile/${user._id}`}
                        className="font-medium hover:underline"
                    >
                        {user.firstName} {user.lastName}
                    </Link>
                    <Badge
                        variant="secondary"
                        className={cn("ml-2 text-xs", roleColors[user.role])}
                    >
                        {roleLabels[user.role]}
                    </Badge>
                </div>
                {!isCurrentUser && (
                    <Link href={`/student/community/profile/${user._id}`}>
                        <Button variant="outline" size="sm">
                            Ver Perfil
                        </Button>
                    </Link>
                )}
            </CardContent>
        </Card>
    );
}
