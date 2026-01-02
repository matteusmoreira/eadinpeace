"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    MessageSquare,
    Send,
    ArrowLeft,
    Loader2,
    Check,
    CheckCheck,
    Search,
    Users,
    User,
    Plus,
    Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Id } from "@convex/_generated/dataModel";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function ProfessorMessagesPage() {
    const { user } = useUser();
    const [selectedConversation, setSelectedConversation] = useState<Id<"conversations"> | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [newConversationDialogOpen, setNewConversationDialogOpen] = useState(false);
    const [searchStudentTerm, setSearchStudentTerm] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get conversations
    const conversations = useQuery(
        api.social.getConversations,
        convexUser?._id && convexUser?.organizationId
            ? { userId: convexUser._id, organizationId: convexUser.organizationId }
            : "skip"
    );

    // Get messages for selected conversation
    const messages = useQuery(
        api.social.getMessages,
        selectedConversation ? { conversationId: selectedConversation } : "skip"
    );

    // Get students for new conversation (students from courses taught by this professor)
    const students = useQuery(
        api.users.getByOrganization,
        convexUser?.organizationId ? { organizationId: convexUser.organizationId } : "skip"
    );

    // Mutations
    const sendMessageMutation = useMutation(api.social.sendMessage);
    const markAsReadMutation = useMutation(api.social.markMessagesAsRead);
    const getOrCreateConversation = useMutation(api.social.getOrCreateConversation);
    const deleteMessageMutation = useMutation(api.social.deleteMessage);
    const deleteConversationMutation = useMutation(api.social.deleteConversation);


    // Filter students
    const filteredStudents = students?.filter(
        (s) =>
            s.role === "student" &&
            s._id !== convexUser?._id &&
            (searchStudentTerm === "" ||
                `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
                s.email.toLowerCase().includes(searchStudentTerm.toLowerCase()))
    );

    // Filter conversations by search
    const filteredConversations = conversations?.filter((conv) => {
        const name = `${conv.otherUser?.firstName || ""} ${conv.otherUser?.lastName || ""}`.toLowerCase();
        return name.includes(searchTerm.toLowerCase());
    });

    // Get selected conversation details
    const selectedConv = conversations?.find((c) => c._id === selectedConversation);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Mark messages as read when selecting a conversation
    useEffect(() => {
        if (selectedConversation && selectedConv?.unreadCount && convexUser?._id) {
            markAsReadMutation({
                conversationId: selectedConversation,
                userId: convexUser._id,
            });
        }
    }, [selectedConversation, selectedConv?.unreadCount, convexUser?._id]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || !convexUser?._id || isSending) return;

        setIsSending(true);
        try {
            await sendMessageMutation({
                conversationId: selectedConversation,
                senderId: convexUser._id,
                content: newMessage.trim(),
            });
            setNewMessage("");
        } finally {
            setIsSending(false);
        }
    };

    const handleStartNewConversation = async (studentId: Id<"users">) => {
        if (!convexUser?._id || !convexUser?.organizationId) return;

        try {
            const conversationId = await getOrCreateConversation({
                organizationId: convexUser.organizationId,
                participantIds: [convexUser._id, studentId],
            });
            setSelectedConversation(conversationId);
            setNewConversationDialogOpen(false);
            setSearchStudentTerm("");
        } catch (error) {
            console.error("Erro ao criar conversa:", error);
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

    const isLoading = convexUser === undefined || conversations === undefined;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Mensagens</h1>
                    <p className="text-muted-foreground">Comunique-se com seus alunos</p>
                </div>

                <Dialog open={newConversationDialogOpen} onOpenChange={setNewConversationDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 gradient-bg border-0">
                            <Plus className="h-4 w-4" />
                            Nova Conversa
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Nova Conversa</DialogTitle>
                            <DialogDescription>
                                Selecione um aluno para iniciar uma conversa
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar aluno..."
                                    value={searchStudentTerm}
                                    onChange={(e) => setSearchStudentTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <ScrollArea className="h-64">
                                <div className="space-y-2">
                                    {filteredStudents?.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">
                                            Nenhum aluno encontrado
                                        </p>
                                    ) : (
                                        filteredStudents?.map((student) => (
                                            <button
                                                key={student._id}
                                                onClick={() => handleStartNewConversation(student._id)}
                                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                                            >
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={student.imageUrl} />
                                                    <AvatarFallback>
                                                        {student.firstName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">
                                                        {student.firstName} {student.lastName}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {student.email}
                                                    </p>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </DialogContent>
                </Dialog>
            </motion.div>

            <motion.div variants={item}>
                <Card className="h-[calc(100vh-220px)] min-h-[500px]">
                    <div className="flex h-full">
                        {/* Lista de Conversas */}
                        <div
                            className={cn(
                                "w-full md:w-80 border-r flex flex-col",
                                selectedConversation ? "hidden md:flex" : "flex"
                            )}
                        >
                            <div className="p-4 border-b">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar conversa..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <ScrollArea className="flex-1">
                                {conversations?.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                        <p className="text-muted-foreground">
                                            Nenhuma conversa ainda
                                        </p>
                                        <p className="text-sm text-muted-foreground/70 mt-1">
                                            Inicie uma conversa com seus alunos
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {filteredConversations?.map((conv) => (
                                            <button
                                                key={conv._id}
                                                onClick={() => setSelectedConversation(conv._id)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left",
                                                    selectedConversation === conv._id && "bg-muted"
                                                )}
                                            >
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={conv.otherUser?.imageUrl} />
                                                    <AvatarFallback>
                                                        {conv.otherUser?.firstName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p
                                                            className={cn(
                                                                "font-medium truncate",
                                                                conv.unreadCount > 0 && "font-bold"
                                                            )}
                                                        >
                                                            {conv.otherUser?.firstName} {conv.otherUser?.lastName}
                                                        </p>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDate(conv.lastMessageAt)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p
                                                            className={cn(
                                                                "text-sm truncate",
                                                                conv.unreadCount > 0
                                                                    ? "text-foreground font-medium"
                                                                    : "text-muted-foreground"
                                                            )}
                                                        >
                                                            {conv.lastMessageSenderId === convexUser?._id && "Você: "}
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
                        </div>

                        {/* Área do Chat */}
                        <div
                            className={cn(
                                "flex-1 flex flex-col",
                                !selectedConversation ? "hidden md:flex" : "flex"
                            )}
                        >
                            {selectedConversation && selectedConv ? (
                                <>
                                    {/* Header do Chat */}
                                    <div className="flex items-center gap-3 p-4 border-b">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setSelectedConversation(null)}
                                            className="md:hidden"
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
                                            <p className="text-sm text-muted-foreground">Aluno</p>
                                        </div>
                                        {/* Botão de excluir conversa */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={async () => {
                                                if (confirm("Deseja realmente excluir esta conversa e todas as mensagens?")) {
                                                    try {
                                                        await deleteConversationMutation({
                                                            conversationId: selectedConversation,
                                                            userId: convexUser!._id,
                                                        });
                                                        setSelectedConversation(null);
                                                    } catch (error) {
                                                        console.error("Erro ao excluir conversa:", error);
                                                    }
                                                }
                                            }}
                                            className="text-muted-foreground hover:text-destructive"
                                            title="Excluir conversa"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>


                                    {/* Mensagens */}
                                    <ScrollArea className="flex-1 p-4">
                                        {messages === undefined ? (
                                            <div className="flex items-center justify-center h-full">
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {messages.map((msg) => {
                                                    const isMine = msg.senderId === convexUser?._id;
                                                    return (
                                                        <div
                                                            key={msg._id}
                                                            className={cn(
                                                                "flex group",
                                                                isMine ? "justify-end" : "justify-start"
                                                            )}
                                                        >
                                                            {/* Botão de deletar - aparece ao passar o mouse em mensagens próprias */}
                                                            {isMine && (
                                                                <button
                                                                    onClick={async () => {
                                                                        if (confirm("Deseja realmente excluir esta mensagem?")) {
                                                                            try {
                                                                                await deleteMessageMutation({
                                                                                    messageId: msg._id,
                                                                                    userId: convexUser._id,
                                                                                });
                                                                            } catch (error) {
                                                                                console.error("Erro ao excluir mensagem:", error);
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="opacity-0 group-hover:opacity-100 p-1 mr-2 text-muted-foreground hover:text-destructive transition-all self-center"
                                                                    title="Excluir mensagem"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                            <div
                                                                className={cn(
                                                                    "max-w-[80%] rounded-2xl px-4 py-2",
                                                                    isMine
                                                                        ? "bg-primary text-primary-foreground rounded-br-md"
                                                                        : "bg-muted rounded-bl-md"
                                                                )}
                                                            >
                                                                <p className="text-sm">{msg.content}</p>
                                                                <div
                                                                    className={cn(
                                                                        "flex items-center gap-1 text-xs mt-1",
                                                                        isMine
                                                                            ? "justify-end text-primary-foreground/70"
                                                                            : "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    <span>{formatTime(msg.createdAt)}</span>
                                                                    {isMine &&
                                                                        (msg.isRead ? (
                                                                            <CheckCheck className="h-3 w-3" />
                                                                        ) : (
                                                                            <Check className="h-3 w-3" />
                                                                        ))}
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
                                                        handleSendMessage();
                                                    }
                                                }}
                                            />
                                            <Button
                                                onClick={handleSendMessage}
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
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                        <MessageSquare className="h-10 w-10 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">
                                        Selecione uma conversa
                                    </h3>
                                    <p className="text-muted-foreground max-w-md">
                                        Escolha uma conversa na lista ao lado ou inicie uma nova conversa
                                        com um de seus alunos.
                                    </p>
                                    <Button
                                        onClick={() => setNewConversationDialogOpen(true)}
                                        className="mt-6 gap-2 gradient-bg border-0"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Nova Conversa
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
}
