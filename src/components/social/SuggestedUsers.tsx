"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FollowButton } from "./FollowButton";
import { Button } from "@/components/ui/button";
import { Loader2, Users, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@convex/_generated/dataModel";
import Link from "next/link";

interface User {
    _id: Id<"users">;
    firstName: string;
    lastName: string;
    imageUrl?: string;
    role: string;
}

interface SuggestedUsersProps {
    users: User[];
    currentUserId: Id<"users">;
    onFollow: (userId: Id<"users">) => Promise<void>;
    onMessage?: (userId: Id<"users">) => Promise<void>;
    isLoading?: boolean;
}

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

export function SuggestedUsers({
    users,
    currentUserId,
    onFollow,
    onMessage,
    isLoading = false,
}: SuggestedUsersProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Sugestões para você
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (users.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Sugestões para você
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Você já segue todos!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Sugestões para você
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {users.map((user) => (
                    <div key={user._id} className="flex items-center gap-3">
                        <Link href={`/student/community/profile/${user._id}`}>
                            <Avatar className="h-10 w-10 ring-2 ring-background shadow">
                                <AvatarImage src={user.imageUrl} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                                    {user.firstName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                            <Link
                                href={`/student/community/profile/${user._id}`}
                                className="font-medium text-sm hover:underline block truncate"
                            >
                                {user.firstName} {user.lastName}
                            </Link>
                            <Badge
                                variant="secondary"
                                className={cn(
                                    "text-xs px-1.5 py-0 mt-0.5",
                                    roleColors[user.role]
                                )}
                            >
                                {roleLabels[user.role]}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                            {onMessage && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => onMessage(user._id)}
                                    title="Enviar mensagem"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                </Button>
                            )}
                            <FollowButton
                                userId={user._id}
                                isFollowing={false}
                                onToggle={() => onFollow(user._id)}
                                size="sm"
                            />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
