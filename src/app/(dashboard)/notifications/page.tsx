"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    Award,
    BookOpen,
    MessageCircle,
    Info,
    AlertTriangle,
    Loader2,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Id } from "@convex/_generated/dataModel";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
};

const typeConfig: Record<string, { icon: any, color: string }> = {
    info: {
        icon: Info,
        color: "bg-blue-500/10 text-blue-500",
    },
    success: {
        icon: Check,
        color: "bg-emerald-500/10 text-emerald-500",
    },
    warning: {
        icon: AlertTriangle,
        color: "bg-amber-500/10 text-amber-500",
    },
    achievement: {
        icon: Award,
        color: "bg-violet-500/10 text-violet-500",
    },
    course_update: {
        icon: BookOpen,
        color: "bg-blue-500/10 text-blue-500",
    },
    new_lesson: {
        icon: BookOpen,
        color: "bg-emerald-500/10 text-emerald-500",
    },
    comment_reply: {
        icon: MessageCircle,
        color: "bg-indigo-500/10 text-indigo-500",
    },
    certificate_ready: {
        icon: Award,
        color: "bg-yellow-500/10 text-yellow-500",
    },
    quiz_result: {
        icon: CheckCheck,
        color: "bg-green-500/10 text-green-500",
    },
    enrollment_confirmed: {
        icon: Check,
        color: "bg-emerald-500/10 text-emerald-500",
    },
    announcement: {
        icon: Bell,
        color: "bg-orange-500/10 text-orange-500",
    },
    reminder: {
        icon: Bell,
        color: "bg-gray-500/10 text-gray-500",
    },
};

export default function NotificationsPage() {
    const { user } = useUser();

    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get notifications
    const notifications = useQuery(
        api.notifications.getByUser,
        convexUser?._id ? { userId: convexUser._id, limit: 50 } : "skip"
    );

    const markAsRead = useMutation(api.notifications.markAsRead);
    const markAllAsRead = useMutation(api.notifications.markAllAsRead);
    const removeNotification = useMutation(api.notifications.remove);

    const isLoading = notifications === undefined;

    const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

    const handleMarkAsRead = async (notificationId: Id<"notifications">) => {
        await markAsRead({ notificationId });
    };

    const handleMarkAllAsRead = async () => {
        if (!convexUser) return;
        await markAllAsRead({ userId: convexUser._id });
    };

    const handleDelete = async (notificationId: Id<"notifications">) => {
        await removeNotification({ notificationId });
    };

    const formatDate = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Agora";
        if (minutes < 60) return `${minutes}min atrás`;
        if (hours < 24) return `${hours}h atrás`;
        if (days < 7) return `${days}d atrás`;
        return new Date(timestamp).toLocaleDateString("pt-BR");
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Notificações</h1>
                    <p className="text-muted-foreground">
                        {unreadCount > 0
                            ? `Você tem ${unreadCount} notificação${unreadCount > 1 ? "ões" : ""} não lida${unreadCount > 1 ? "s" : ""}`
                            : "Todas as notificações foram lidas"}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" onClick={handleMarkAllAsRead} className="gap-2">
                        <CheckCheck className="h-4 w-4" />
                        Marcar todas como lidas
                    </Button>
                )}
            </motion.div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : notifications?.length === 0 ? (
                <motion.div variants={item} className="text-center py-12">
                    <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma notificação</h3>
                    <p className="text-muted-foreground">
                        Você será notificado sobre novidades e conquistas aqui
                    </p>
                </motion.div>
            ) : (
                <motion.div variants={item} className="space-y-2">
                    {notifications.map((notification) => {
                        const config = typeConfig[notification.type] || typeConfig.info;
                        const Icon = config.icon;

                        return (
                            <Card
                                key={notification._id}
                                className={cn(
                                    "transition-all hover:shadow-md",
                                    !notification.isRead && "border-l-4 border-l-primary bg-primary/5"
                                )}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", config.color)}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h4 className={cn("font-medium", !notification.isRead && "text-primary")}>
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground mt-0.5">
                                                        {notification.message}
                                                    </p>
                                                </div>
                                                <span className="text-xs text-muted-foreground shrink-0">
                                                    {formatDate(notification.createdAt)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-3">
                                                {!notification.isRead && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleMarkAsRead(notification._id)}
                                                        className="h-8 text-xs gap-1"
                                                    >
                                                        <Check className="h-3 w-3" />
                                                        Marcar como lida
                                                    </Button>
                                                )}
                                                {notification.link && (
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                                                        Ver detalhes
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(notification._id)}
                                                    className="h-8 text-xs text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </motion.div>
            )}
        </motion.div>
    );
}
