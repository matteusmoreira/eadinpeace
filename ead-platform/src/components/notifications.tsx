"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    BookOpen,
    MessageSquare,
    Award,
    Trophy,
    GraduationCap,
    Megaphone,
    Clock,
    Loader2,
    X,
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface NotificationBellProps {
    userId: Id<"users">;
}

const notificationIcons: Record<string, React.ReactNode> = {
    course_update: <BookOpen className="h-5 w-5 text-blue-500" />,
    new_lesson: <BookOpen className="h-5 w-5 text-green-500" />,
    comment_reply: <MessageSquare className="h-5 w-5 text-purple-500" />,
    certificate_ready: <Award className="h-5 w-5 text-amber-500" />,
    quiz_result: <Trophy className="h-5 w-5 text-pink-500" />,
    enrollment_confirmed: <GraduationCap className="h-5 w-5 text-emerald-500" />,
    announcement: <Megaphone className="h-5 w-5 text-red-500" />,
    reminder: <Clock className="h-5 w-5 text-orange-500" />,
};

export function NotificationBell({ userId }: NotificationBellProps) {
    const [open, setOpen] = useState(false);

    const notifications = useQuery(api.notifications.getByUser, { userId, limit: 20 });
    const unreadCount = useQuery(api.notifications.getUnreadCount, { userId });
    const markAsRead = useMutation(api.notifications.markAsRead);
    const markAllAsRead = useMutation(api.notifications.markAllAsRead);
    const removeNotification = useMutation(api.notifications.remove);
    const clearAll = useMutation(api.notifications.clearAll);

    const formatDate = (timestamp: number) => {
        return formatDistanceToNow(new Date(timestamp), {
            addSuffix: true,
            locale: ptBR,
        });
    };

    const handleNotificationClick = async (notification: any) => {
        if (!notification.isRead) {
            await markAsRead({ notificationId: notification._id });
        }
        if (notification.link) {
            setOpen(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead({ userId });
            toast.success("Todas as notificações foram marcadas como lidas");
        } catch (error) {
            toast.error("Erro ao marcar notificações");
        }
    };

    const handleClearAll = async () => {
        if (!confirm("Tem certeza que deseja limpar todas as notificações?")) return;

        try {
            await clearAll({ userId });
            toast.success("Notificações removidas");
        } catch (error) {
            toast.error("Erro ao limpar notificações");
        }
    };

    const handleDelete = async (notificationId: Id<"notifications">, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await removeNotification({ notificationId });
        } catch (error) {
            toast.error("Erro ao remover notificação");
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount !== undefined && unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                            variant="destructive"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notificações</h3>
                    <div className="flex gap-1">
                        {unreadCount !== undefined && unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={handleMarkAllRead}
                            >
                                <CheckCheck className="h-3 w-3 mr-1" />
                                Marcar lidas
                            </Button>
                        )}
                    </div>
                </div>

                <ScrollArea className="h-[400px]">
                    {notifications === undefined ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Bell className="h-10 w-10 mb-2 opacity-50" />
                            <p>Nenhuma notificação</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            <AnimatePresence>
                                {notifications.map((notification) => {
                                    const content = (
                                        <motion.div
                                            key={notification._id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className={cn(
                                                "flex gap-3 p-4 transition-colors cursor-pointer hover:bg-muted/50 group",
                                                !notification.isRead && "bg-primary/5"
                                            )}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                                                notification.isRead ? "bg-muted" : "bg-primary/10"
                                            )}>
                                                {notificationIcons[notification.type] || <Bell className="h-5 w-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={cn(
                                                        "text-sm",
                                                        !notification.isRead && "font-medium"
                                                    )}>
                                                        {notification.title}
                                                    </p>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                        onClick={(e) => handleDelete(notification._id, e)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDate(notification.createdAt)}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                                            )}
                                        </motion.div>
                                    );

                                    return notification.link ? (
                                        <Link key={notification._id} href={notification.link}>
                                            {content}
                                        </Link>
                                    ) : (
                                        content
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </ScrollArea>

                {notifications && notifications.length > 0 && (
                    <div className="p-2 border-t">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-destructive"
                            onClick={handleClearAll}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Limpar todas
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

// Standalone Notifications Page Component
interface NotificationsPafeProps {
    userId: Id<"users">;
}

export function NotificationsPage({ userId }: NotificationsPafeProps) {
    const notifications = useQuery(api.notifications.getByUser, { userId, limit: 100 });
    const markAsRead = useMutation(api.notifications.markAsRead);
    const markAllAsRead = useMutation(api.notifications.markAllAsRead);
    const removeNotification = useMutation(api.notifications.remove);
    const clearAll = useMutation(api.notifications.clearAll);

    const formatDate = (timestamp: number) => {
        return formatDistanceToNow(new Date(timestamp), {
            addSuffix: true,
            locale: ptBR,
        });
    };

    if (notifications === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Notificações</h1>
                    <p className="text-muted-foreground">
                        Suas atualizações e avisos
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => markAllAsRead({ userId })}>
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Marcar todas como lidas
                    </Button>
                    <Button variant="destructive" onClick={() => clearAll({ userId })}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpar todas
                    </Button>
                </div>
            </div>

            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Bell className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-lg">Nenhuma notificação</p>
                    <p className="text-sm">Você não tem notificações no momento</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <motion.div
                            key={notification._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "flex gap-4 p-4 rounded-lg border transition-colors",
                                !notification.isRead && "bg-primary/5 border-primary/30"
                            )}
                        >
                            <div className={cn(
                                "h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0",
                                notification.isRead ? "bg-muted" : "bg-primary/10"
                            )}>
                                {notificationIcons[notification.type] || <Bell className="h-6 w-6" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className={cn(
                                            "font-medium",
                                            !notification.isRead && "text-primary"
                                        )}>
                                            {notification.title}
                                        </h3>
                                        <p className="text-muted-foreground mt-1">
                                            {notification.message}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {formatDate(notification.createdAt)}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {!notification.isRead && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => markAsRead({ notificationId: notification._id })}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive"
                                            onClick={() => removeNotification({ notificationId: notification._id })}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                {notification.link && (
                                    <Link href={notification.link}>
                                        <Button variant="link" className="px-0 h-auto mt-2">
                                            Ver detalhes →
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
