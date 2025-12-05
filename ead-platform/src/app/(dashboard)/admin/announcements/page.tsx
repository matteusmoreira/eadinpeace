"use client";

import { useState } from "react";
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
import {
    Megaphone,
    Plus,
    Trash2,
    Edit2,
    Users,
    Calendar,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

export default function AnnouncementsPage() {
    const { user } = useUser();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [targetRoles, setTargetRoles] = useState<string[]>(["all"]);
    const [expiresIn, setExpiresIn] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const convexUser = useQuery(api.users.getByClerkId, {
        clerkId: user?.id || ""
    });

    const announcements = useQuery(
        api.notifications.getAnnouncements,
        convexUser?.organizationId
            ? { organizationId: convexUser.organizationId, includeExpired: true }
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
                targetRoles,
                expiresAt,
            });

            toast.success(`Anúncio criado! ${result.notified} usuários notificados.`);
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
                        Envie comunicados para alunos e professores
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 gradient-bg border-0">
                            <Plus className="h-4 w-4" />
                            Novo Anúncio
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
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
                            <div className="space-y-2">
                                <Label>Enviar para</Label>
                                <div className="flex flex-wrap gap-3">
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
                                                : announcement.targetRoles.join(", ")}
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
