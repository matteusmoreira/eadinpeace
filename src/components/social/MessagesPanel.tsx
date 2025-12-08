"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    MessageCircle,
    Send,
    X,
    ArrowLeft,
    Loader2,
    Check,
    CheckCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Id } from "@convex/_generated/dataModel";

interface User {
    _id: Id<"users">;
    firstName: string;
    lastName: string;
    imageUrl?: string;
}

interface Message {
    _id: Id<"directMessages">;
    senderId: Id<"users">;
    content: string;
    isRead: boolean;
    createdAt: number;
    sender: User | null;
}

interface Conversation {
    _id: Id<"conversations">;
    otherUser: User | null;
    lastMessageAt: number;
    lastMessagePreview?: string;
    lastMessageSenderId?: Id<"users">;
    unreadCount: number;
}

interface MessagesPanelProps {
    currentUserId: Id<"users">;
    conversations: Conversation[];
    unreadTotal: number;
    onSelectConversation: (conversationId: Id<"conversations">) => void;
    onSendMessage: (conversationId: Id<"conversations">, content: string) => Promise<void>;
    onMarkAsRead: (conversationId: Id<"conversations">) => Promise<void>;
    selectedConversation: Id<"conversations"> | null;
    messages: Message[];
    isLoadingMessages?: boolean;
    isLoadingConversations?: boolean;
}

export function MessagesPanel({
    currentUserId,
    conversations,
    unreadTotal,
    onSelectConversation,
    onSendMessage,
    onMarkAsRead,
    selectedConversation,
    messages,
    isLoadingMessages = false,
    isLoadingConversations = false,
}: MessagesPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const selectedConv = conversations.find((c) => c._id === selectedConversation);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    useEffect(() => {
        if (selectedConversation && selectedConv?.unreadCount) {
            onMarkAsRead(selectedConversation);
        }
    }, [selectedConversation, selectedConv?.unreadCount]);

    const handleSend = async () => {
        if (!newMessage.trim() || !selectedConversation || isSending) return;

        setIsSending(true);
        try {
            await onSendMessage(selectedConversation, newMessage.trim());
            setNewMessage("");
        } finally {
            setIsSending(false);
        }
    };

    const formatDate = (timestamp: number) => {
        return formatDistanceToNow(new Date(timestamp), {
            addSuffix: true,
            locale: ptBR,
        });
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <MessageCircle className="h-5 w-5" />
                    {unreadTotal > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500"
                        >
                            {unreadTotal > 99 ? "99+" : unreadTotal}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
                <AnimatePresence mode="wait">
                    {selectedConversation && selectedConv ? (
                        // Vista do chat
                        <motion.div
                            key="chat"
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 100, opacity: 0 }}
                            className="flex flex-col h-full"
                        >
                            {/* Header do chat */}
                            <div className="flex items-center gap-3 p-4 border-b">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onSelectConversation(null as any)}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={selectedConv.otherUser?.imageUrl} />
                                    <AvatarFallback>
                                        {selectedConv.otherUser?.firstName?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold">
                                        {selectedConv.otherUser?.firstName} {selectedConv.otherUser?.lastName}
                                    </p>
                                </div>
                            </div>

                            {/* Mensagens */}
                            <ScrollArea className="flex-1 p-4">
                                {isLoadingMessages ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {messages.map((msg) => {
                                            const isMine = msg.senderId === currentUserId;
                                            return (
                                                <div
                                                    key={msg._id}
                                                    className={cn(
                                                        "flex",
                                                        isMine ? "justify-end" : "justify-start"
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            "max-w-[80%] rounded-2xl px-4 py-2",
                                                            isMine
                                                                ? "bg-primary text-primary-foreground rounded-br-md"
                                                                : "bg-muted rounded-bl-md"
                                                        )}
                                                    >
                                                        <p className="text-sm">{msg.content}</p>
                                                        <div className={cn(
                                                            "flex items-center gap-1 text-xs mt-1",
                                                            isMine ? "justify-end text-primary-foreground/70" : "text-muted-foreground"
                                                        )}>
                                                            <span>{formatTime(msg.createdAt)}</span>
                                                            {isMine && (
                                                                msg.isRead ? (
                                                                    <CheckCheck className="h-3 w-3" />
                                                                ) : (
                                                                    <Check className="h-3 w-3" />
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </ScrollArea>

                            {/* Input */}
                            <div className="p-4 border-t">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Digite uma mensagem..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                    />
                                    <Button
                                        onClick={handleSend}
                                        disabled={!newMessage.trim() || isSending}
                                        size="icon"
                                    >
                                        {isSending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        // Lista de conversas
                        <motion.div
                            key="list"
                            initial={{ x: -100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -100, opacity: 0 }}
                            className="flex flex-col h-full"
                        >
                            <SheetHeader className="p-4 border-b">
                                <SheetTitle className="flex items-center gap-2">
                                    <MessageCircle className="h-5 w-5" />
                                    Mensagens
                                </SheetTitle>
                            </SheetHeader>

                            <ScrollArea className="flex-1">
                                {isLoadingConversations ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                ) : conversations.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                        <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                        <p className="text-muted-foreground">
                                            Nenhuma conversa ainda
                                        </p>
                                        <p className="text-sm text-muted-foreground/70 mt-1">
                                            Inicie uma conversa visitando o perfil de alguém
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {conversations.map((conv) => (
                                            <button
                                                key={conv._id}
                                                onClick={() => onSelectConversation(conv._id)}
                                                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
                                            >
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={conv.otherUser?.imageUrl} />
                                                    <AvatarFallback>
                                                        {conv.otherUser?.firstName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className={cn(
                                                            "font-medium truncate",
                                                            conv.unreadCount > 0 && "font-bold"
                                                        )}>
                                                            {conv.otherUser?.firstName} {conv.otherUser?.lastName}
                                                        </p>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDate(conv.lastMessageAt)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className={cn(
                                                            "text-sm truncate",
                                                            conv.unreadCount > 0
                                                                ? "text-foreground font-medium"
                                                                : "text-muted-foreground"
                                                        )}>
                                                            {conv.lastMessageSenderId === currentUserId && "Você: "}
                                                            {conv.lastMessagePreview || "..."}
                                                        </p>
                                                        {conv.unreadCount > 0 && (
                                                            <Badge className="h-5 min-w-[20px] p-0 flex items-center justify-center text-xs bg-primary">
                                                                {conv.unreadCount}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </motion.div>
                    )}
                </AnimatePresence>
            </SheetContent>
        </Sheet>
    );
}
