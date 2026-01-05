"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Users,
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    MessageSquare,
    BookOpen,
    Trophy,
    Loader2,
    Eye,
    GraduationCap,
    Send,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function AdminStudentsPage() {
    const { user } = useUser();
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [messageDialogOpen, setMessageDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [messageTitle, setMessageTitle] = useState("");
    const [messageContent, setMessageContent] = useState("");

    // Get current user to find their organization
    const currentUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get all users from organization
    const allUsers = useQuery(api.users.getByOrganization,
        currentUser?.organizationId
            ? { organizationId: currentUser.organizationId }
            : "skip"
    );

    // Get enrollments for organization
    const courses = useQuery(api.courses.getByOrganization,
        currentUser?.organizationId
            ? { organizationId: currentUser.organizationId }
            : "skip"
    );

    const removeUser = useMutation(api.users.remove);
    const sendNotification = useMutation(api.notifications.create);

    // Filter only students
    const students = (allUsers || []).filter(u => u.role === "student");

    const filteredStudents = students.filter((student) => {
        const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleDelete = (student: any) => {
        setSelectedStudent(student);
        setDeleteDialogOpen(true);
    };

    const handleSendMessage = (student: any) => {
        setSelectedStudent(student);
        setMessageTitle("");
        setMessageContent("");
        setMessageDialogOpen(true);
    };

    const confirmSendMessage = async () => {
        if (!selectedStudent || !messageTitle.trim() || !messageContent.trim()) {
            toast.error("Preencha o título e a mensagem");
            return;
        }

        setIsSendingMessage(true);
        try {
            await sendNotification({
                userId: selectedStudent._id,
                type: "announcement",
                title: messageTitle.trim(),
                message: messageContent.trim(),
            });
            toast.success(`Mensagem enviada para ${selectedStudent.firstName}!`);
            setMessageDialogOpen(false);
            setSelectedStudent(null);
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Erro ao enviar mensagem");
        } finally {
            setIsSendingMessage(false);
        }
    };

    const confirmDelete = async () => {
        if (!selectedStudent) return;

        setIsDeleting(true);
        try {
            await removeUser({ userId: selectedStudent._id });
            setDeleteDialogOpen(false);
            setSelectedStudent(null);
        } catch (error) {
            console.error("Error deleting student:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const getLastLogin = (timestamp?: number) => {
        if (!timestamp) return "Nunca";
        const diff = Date.now() - timestamp;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return "Há poucos minutos";
        if (hours < 24) return `Há ${hours}h`;
        const days = Math.floor(hours / 24);
        return `Há ${days} dia${days > 1 ? "s" : ""}`;
    };

    const isLoading = allUsers === undefined;

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Alunos</h1>
                    <p className="text-muted-foreground">
                        Gerencie os alunos da sua organização
                    </p>
                </div>
                <Link href="/admin/users/new">
                    <Button className="gap-2 gradient-bg border-0">
                        <Plus className="h-4 w-4" />
                        Novo Aluno
                    </Button>
                </Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{students.length}</p>
                                <p className="text-sm text-muted-foreground">Total de Alunos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {students.filter(s => s.isActive).length}
                                </p>
                                <p className="text-sm text-muted-foreground">Alunos Ativos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{courses?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Cursos Disponíveis</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                <Trophy className="h-5 w-5 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">0</p>
                                <p className="text-sm text-muted-foreground">Certificados</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Search */}
            <motion.div variants={item} className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar alunos..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </motion.div>

            {/* Loading State */}
            {isLoading && (
                <motion.div variants={item} className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </motion.div>
            )}

            {/* Mobile Grid View */}
            {!isLoading && (
                <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                    {filteredStudents.map((student) => (
                        <Card key={student._id} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Avatar className="h-12 w-12 flex-shrink-0">
                                            <AvatarImage src={student.imageUrl || undefined} />
                                            <AvatarFallback className="text-lg">
                                                {student.firstName?.[0]}{student.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold truncate">
                                                {student.firstName} {student.lastName}
                                            </p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {student.email}
                                            </p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="flex-shrink-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/admin/users/${student._id}`}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Ver Perfil
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/admin/users/${student._id}/edit`}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Editar
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleSendMessage(student)}>
                                                <MessageSquare className="h-4 w-4 mr-2" />
                                                Enviar Mensagem
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => handleDelete(student)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "flex-shrink-0",
                                            student.isActive
                                                ? "border-emerald-500 text-emerald-500"
                                                : "border-amber-500 text-amber-500"
                                        )}
                                    >
                                        {student.isActive ? "Ativo" : "Inativo"}
                                    </Badge>
                                    <div className="text-xs text-muted-foreground text-right">
                                        <p>Último login: {getLastLogin(student.lastLoginAt)}</p>
                                        <p>Desde: {new Date(student.createdAt).toLocaleDateString("pt-BR")}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </motion.div>
            )}

            {/* Desktop Table View */}
            {!isLoading && (
                <motion.div variants={item} className="hidden md:block">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Aluno</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Último Login</TableHead>
                                        <TableHead>Membro Desde</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStudents.map((student) => (
                                        <TableRow key={student._id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={student.imageUrl || undefined} />
                                                        <AvatarFallback>
                                                            {student.firstName?.[0]}{student.lastName?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{student.firstName} {student.lastName}</p>
                                                        <p className="text-sm text-muted-foreground">{student.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        student.isActive
                                                            ? "border-emerald-500 text-emerald-500"
                                                            : "border-amber-500 text-amber-500"
                                                    )}
                                                >
                                                    {student.isActive ? "Ativo" : "Inativo"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {getLastLogin(student.lastLoginAt)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(student.createdAt).toLocaleDateString("pt-BR")}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/users/${student._id}`}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                Ver Perfil
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/users/${student._id}/edit`}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Editar
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleSendMessage(student)}>
                                                            <MessageSquare className="h-4 w-4 mr-2" />
                                                            Enviar Mensagem
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => handleDelete(student)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Empty State */}
            {!isLoading && filteredStudents.length === 0 && (
                <motion.div variants={item} className="text-center py-12">
                    <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhum aluno encontrado</h3>
                    <p className="text-muted-foreground">
                        {searchQuery
                            ? "Tente ajustar sua busca"
                            : "Adicione alunos para começar"}
                    </p>
                </motion.div>
            )}

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir Aluno</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir <strong>{selectedStudent?.firstName} {selectedStudent?.lastName}</strong>?
                            Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Excluindo...
                                </>
                            ) : (
                                "Excluir"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Message Dialog */}
            <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enviar Mensagem</DialogTitle>
                        <DialogDescription>
                            Enviar mensagem para <strong>{selectedStudent?.firstName} {selectedStudent?.lastName}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="messageTitle">Título</Label>
                            <Input
                                id="messageTitle"
                                placeholder="Assunto da mensagem"
                                value={messageTitle}
                                onChange={(e) => setMessageTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="messageContent">Mensagem</Label>
                            <Textarea
                                id="messageContent"
                                placeholder="Digite sua mensagem..."
                                rows={4}
                                value={messageContent}
                                onChange={(e) => setMessageContent(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMessageDialogOpen(false)} disabled={isSendingMessage}>
                            Cancelar
                        </Button>
                        <Button onClick={confirmSendMessage} disabled={isSendingMessage} className="gap-2">
                            {isSendingMessage ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Enviar
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
