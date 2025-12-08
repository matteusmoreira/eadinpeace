"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Megaphone,
    Plus,
    Trash2,
    Edit2,
    Users,
    User,
    Calendar,
    Loader2,
    AlertCircle,
    Search,
    X,
    UserCheck,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Id } from "@convex/_generated/dataModel";

const priorityColors = {
    low: "bg-slate-500",
    medium: "bg-amber-500",
    high: "bg-red-500",
};

const priorityLabels = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
};

const roleLabels: Record<string, string> = {
    student: "Aluno",
    professor: "Professor",
    admin: "Admin",
    superadmin: "Superadmin",
};

type SelectedUser = {
    _id: Id<"users">;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    imageUrl?: string;
};

export default function AnnouncementsPage() {
    const { user } = useUser();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [targetRoles, setTargetRoles] = useState<string[]>(["all"]);
    const [expiresIn, setExpiresIn] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New: User selection mode
    const [selectionMode, setSelectionMode] = useState<"group" | "users">("group");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchRole, setSearchRole] = useState<string>("all");
    const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);

    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    const announcements = useQuery(
        api.notifications.getAnnouncements,
        convexUser?.organizationId
            ? { organizationId: convexUser.organizationId, includeExpired: true }
            : "skip"
    );

    // Search users query
    const searchResults = useQuery(
        api.notifications.searchUsers,
        convexUser?.organizationId && selectionMode === "users"
            ? {
                organizationId: convexUser.organizationId,
                search: searchQuery,
                role: searchRole !== "all" ? searchRole : undefined,
                limit: 15
            }
            : "skip"
    );

    const createAnnouncement = useMutation(api.notifications.createAnnouncement);
    const deleteAnnouncement = useMutation(api.notifications.deleteAnnouncement);
    const updateAnnouncement = useMutation(api.notifications.updateAnnouncement);

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim() || !convexUser?.organizationId) {
            toast.error("Preencha todos os campos");
            return;
        }

        if (selectionMode === "users" && selectedUsers.length === 0) {
            toast.error("Selecione pelo menos um usuário");
            return;
        }

        setIsSubmitting(true);
        try {
            let expiresAt: number | undefined;
            if (expiresIn) {
                const days = parseInt(expiresIn);
                if (!isNaN(days)) {
                    expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
                }
            }

            const result = await createAnnouncement({
                organizationId: convexUser.organizationId,
                authorId: convexUser._id,
                title: title.trim(),
                content: content.trim(),
                priority,
                targetRoles: selectionMode === "users" ? [] : targetRoles,
                targetUserIds: selectionMode === "users" ? selectedUsers.map(u => u._id) : undefined,
                expiresAt,
            });

            toast.success(`Anúncio criado! ${result.notified} usuário(s) notificado(s).`);
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            toast.error("Erro ao criar anúncio");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (announcementId: any) => {
        if (!confirm("Tem certeza que deseja excluir este anúncio?")) return;

        try {
            await deleteAnnouncement({ announcementId });
            toast.success("Anúncio excluído");
        } catch (error) {
            toast.error("Erro ao excluir anúncio");
        }
    };

    const handleTogglePublish = async (announcementId: any, currentlyPublished: boolean) => {
        try {
            await updateAnnouncement({
                announcementId,
                isPublished: !currentlyPublished,
            });
            toast.success(currentlyPublished ? "Anúncio despublicado" : "Anúncio publicado");
        } catch (error) {
            toast.error("Erro ao atualizar anúncio");
        }
    };

    const resetForm = () => {
        setTitle("");
        setContent("");
        setPriority("medium");
        setTargetRoles(["all"]);
        setExpiresIn("");
        setSelectionMode("group");
        setSearchQuery("");
        setSearchRole("all");
        setSelectedUsers([]);
    };

    const toggleRole = (role: string) => {
        if (role === "all") {
            setTargetRoles(["all"]);
        } else {
            const newRoles = targetRoles.filter(r => r !== "all");
            if (newRoles.includes(role)) {
                setTargetRoles(newRoles.filter(r => r !== role));
            } else {
                setTargetRoles([...newRoles, role]);
            }
        }
    };

    const addUser = (user: SelectedUser) => {
        if (!selectedUsers.find(u => u._id === user._id)) {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const removeUser = (userId: Id<"users">) => {
        setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
    };

    const filteredSearchResults = searchResults?.filter(
        u => !selectedUsers.find(su => su._id === u._id)
    ) || [];

    if (!convexUser || announcements === undefined) {
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
                        <Megaphone className="h-6 w-6" />
                        Anúncios
                    </h1>
                    <p className="text-muted-foreground">
                        Envie comunicados para alunos, professores ou usuários específicos
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 gradient-bg border-0">
                            <Plus className="h-4 w-4" />
                            Novo Anúncio
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Criar Anúncio</DialogTitle>
                            <DialogDescription>
                                O anúncio será enviado como notificação para os usuários selecionados
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: Manutenção programada"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">Conteúdo</Label>
                                <Textarea
                                    id="content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Escreva o conteúdo do anúncio..."
                                    className="min-h-[100px]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Prioridade</Label>
                                    <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Baixa</SelectItem>
                                            <SelectItem value="medium">Média</SelectItem>
                                            <SelectItem value="high">Alta</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Expira em (dias)</Label>
                                    <Input
                                        type="number"
                                        value={expiresIn}
                                        onChange={(e) => setExpiresIn(e.target.value)}
                                        placeholder="Nunca"
                                        min="1"
                                    />
                                </div>
                            </div>

                            {/* Selection Mode Tabs */}
                            <div className="space-y-3">
                                <Label>Enviar para</Label>
                                <Tabs value={selectionMode} onValueChange={(v) => setSelectionMode(v as "group" | "users")}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="group" className="gap-2">
                                            <Users className="h-4 w-4" />
                                            Por Grupo
                                        </TabsTrigger>
                                        <TabsTrigger value="users" className="gap-2">
                                            <User className="h-4 w-4" />
                                            Por Usuário
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="group" className="mt-3">
                                        <div className="flex flex-wrap gap-3 p-3 border rounded-lg bg-muted/30">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <Checkbox
                                                    checked={targetRoles.includes("all")}
                                                    onCheckedChange={() => toggleRole("all")}
                                                />
                                                <span className="text-sm">Todos</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <Checkbox
                                                    checked={targetRoles.includes("student")}
                                                    onCheckedChange={() => toggleRole("student")}
                                                    disabled={targetRoles.includes("all")}
                                                />
                                                <span className="text-sm">Alunos</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <Checkbox
                                                    checked={targetRoles.includes("professor")}
                                                    onCheckedChange={() => toggleRole("professor")}
                                                    disabled={targetRoles.includes("all")}
                                                />
                                                <span className="text-sm">Professores</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <Checkbox
                                                    checked={targetRoles.includes("admin")}
                                                    onCheckedChange={() => toggleRole("admin")}
                                                    disabled={targetRoles.includes("all")}
                                                />
                                                <span className="text-sm">Admins</span>
                                            </label>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="users" className="mt-3 space-y-3">
                                        {/* Selected Users */}
                                        {selectedUsers.length > 0 && (
                                            <div className="space-y-2">
                                                <Label className="text-sm text-muted-foreground">
                                                    Usuários selecionados ({selectedUsers.length})
                                                </Label>
                                                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-primary/5">
                                                    {selectedUsers.map((u) => (
                                                        <Badge
                                                            key={u._id}
                                                            variant="secondary"
                                                            className="gap-1 pr-1"
                                                        >
                                                            <span>{u.firstName} {u.lastName}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-4 w-4 hover:bg-destructive/20"
                                                                onClick={() => removeUser(u._id)}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Search Section */}
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Buscar por nome ou email..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="pl-9"
                                                    />
                                                </div>
                                                <Select value={searchRole} onValueChange={setSearchRole}>
                                                    <SelectTrigger className="w-[140px]">
                                                        <SelectValue placeholder="Filtrar" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Todos</SelectItem>
                                                        <SelectItem value="student">Alunos</SelectItem>
                                                        <SelectItem value="professor">Professores</SelectItem>
                                                        <SelectItem value="admin">Admins</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Search Results */}
                                        <ScrollArea className="h-[200px] border rounded-lg">
                                            <div className="p-2 space-y-1">
                                                {searchResults === undefined ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                                    </div>
                                                ) : filteredSearchResults.length === 0 ? (
                                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                                        {searchQuery
                                                            ? "Nenhum usuário encontrado"
                                                            : "Digite para buscar usuários"}
                                                    </div>
                                                ) : (
                                                    filteredSearchResults.map((u) => (
                                                        <div
                                                            key={u._id}
                                                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                                                            onClick={() => addUser(u as SelectedUser)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={u.imageUrl} />
                                                                    <AvatarFallback className="text-xs">
                                                                        {u.firstName?.[0]}{u.lastName?.[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="text-sm font-medium">
                                                                        {u.firstName} {u.lastName}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {u.email}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="text-xs">
                                                                    {roleLabels[u.role] || u.role}
                                                                </Badge>
                                                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Enviar Anúncio
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Announcements List */}
            {announcements.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Megaphone className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium mb-1">Nenhum anúncio</h3>
                        <p className="text-muted-foreground text-center">
                            Crie seu primeiro anúncio para comunicar-se com a equipe
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {announcements.map((announcement) => (
                        <motion.div
                            key={announcement._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className={cn(
                                !announcement.isPublished && "opacity-60"
                            )}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className={cn(
                                                "h-3 w-3 rounded-full mt-1.5",
                                                priorityColors[announcement.priority]
                                            )} />
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    {announcement.title}
                                                    <Badge variant={announcement.isPublished ? "default" : "secondary"}>
                                                        {announcement.isPublished ? "Publicado" : "Rascunho"}
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        {priorityLabels[announcement.priority]}
                                                    </Badge>
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-2 mt-1">
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarImage src={announcement.author?.imageUrl} />
                                                        <AvatarFallback className="text-xs">
                                                            {announcement.author?.name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span>{announcement.author?.name}</span>
                                                    <span>•</span>
                                                    <Calendar className="h-3 w-3" />
                                                    <span>
                                                        {formatDistanceToNow(new Date(announcement.createdAt), {
                                                            addSuffix: true,
                                                            locale: ptBR,
                                                        })}
                                                    </span>
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleTogglePublish(announcement._id, announcement.isPublished)}
                                            >
                                                {announcement.isPublished ? "Despublicar" : "Publicar"}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive"
                                                onClick={() => handleDelete(announcement._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground whitespace-pre-wrap">
                                        {announcement.content}
                                    </p>
                                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            {announcement.targetRoles.includes("all")
                                                ? "Todos os usuários"
                                                : announcement.targetRoles.length === 0
                                                    ? "Usuários específicos"
                                                    : announcement.targetRoles.map(r => roleLabels[r] || r).join(", ")}
                                        </div>
                                        {announcement.expiresAt && (
                                            <div className="flex items-center gap-1">
                                                <AlertCircle className="h-4 w-4" />
                                                Expira em{" "}
                                                {formatDistanceToNow(new Date(announcement.expiresAt), { locale: ptBR })}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

