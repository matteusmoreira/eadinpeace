"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Users,
    GraduationCap,
    Calendar,
    Loader2,
    MoreVertical,
    Trash2,
    Check,
    X,
    Copy,
    Link as LinkIcon,
    BookOpen,
    Eye,
    Clock,
    Award,
    UserPlus,
    BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@convex/_generated/dataModel";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
};

export default function ProfessorClassDetailPage() {
    const params = useParams();
    const classId = params.classId as Id<"classes">;

    const [activeTab, setActiveTab] = useState("students");
    const [createTokenDialog, setCreateTokenDialog] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        type: "approve" | "reject" | "remove";
        userId: Id<"users">;
        name: string;
    } | null>(null);

    const [tokenForm, setTokenForm] = useState({
        name: "",
        usageLimit: "",
        validityDays: "30" as "7" | "30" | "null",
    });

    // Queries
    const classDetails = useQuery(api.classes.getById, { classId });
    const enrollments = useQuery(api.classes.getEnrollments, { classId });
    const stats = useQuery(api.classes.getStats, { classId });

    // Mutations
    const removeStudent = useMutation(api.classes.removeStudent);
    const approveEnrollment = useMutation(api.classes.approveEnrollment);
    const rejectEnrollment = useMutation(api.classes.rejectEnrollment);
    const createEnrollmentToken = useMutation(api.classes.createEnrollmentToken);
    const revokeToken = useMutation(api.classes.revokeEnrollmentToken);

    const isLoading = classDetails === undefined;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!classDetails) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-bold mb-2">Turma não encontrada</h2>
                <Link href="/professor/classes">
                    <Button>Voltar às turmas</Button>
                </Link>
            </div>
        );
    }

    const handleConfirmAction = async () => {
        if (!confirmAction) return;

        try {
            switch (confirmAction.type) {
                case "approve":
                    await approveEnrollment({ classId, userId: confirmAction.userId });
                    toast.success("Inscrição aprovada!");
                    break;
                case "reject":
                    await rejectEnrollment({ classId, userId: confirmAction.userId });
                    toast.success("Inscrição rejeitada");
                    break;
                case "remove":
                    await removeStudent({ classId, userId: confirmAction.userId });
                    toast.success("Aluno removido");
                    break;
            }
        } catch (error: any) {
            toast.error(error.message || "Erro ao executar ação");
        }
        setConfirmAction(null);
    };

    const handleCreateToken = async () => {
        try {
            const result = await createEnrollmentToken({
                classId,
                name: tokenForm.name || undefined,
                usageLimit: tokenForm.usageLimit ? parseInt(tokenForm.usageLimit) : undefined,
                validityDays: tokenForm.validityDays === "null" ? null : parseInt(tokenForm.validityDays) as 7 | 30,
            });

            const enrollUrl = `${window.location.origin}/student/classes/enroll?token=${result.token}`;
            navigator.clipboard.writeText(enrollUrl);
            toast.success("Token criado e link copiado!");
            setCreateTokenDialog(false);
            setTokenForm({ name: "", usageLimit: "", validityDays: "30" });
        } catch (error: any) {
            toast.error(error.message || "Erro ao criar token");
        }
    };

    const copyTokenLink = (token: string) => {
        const enrollUrl = `${window.location.origin}/student/classes/enroll?token=${token}`;
        navigator.clipboard.writeText(enrollUrl);
        toast.success("Link copiado!");
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatDateTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Separate enrollments by status
    const activeStudents = (enrollments as any[] ?? []).filter((e) => e?.status === "active");
    const pendingStudents = (enrollments as any[] ?? []).filter((e) => e?.status === "pending");
    const completedStudents = (enrollments as any[] ?? []).filter((e) => e?.status === "completed");

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Header */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/professor/classes">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl md:text-3xl font-bold">{classDetails.name}</h1>
                            <Badge variant={classDetails.isActive ? "default" : "secondary"}>
                                {classDetails.isActive ? "Ativa" : "Inativa"}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            Curso: {(classDetails.course as any)?.title}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/professor/classes/${classId}/attendance`}>
                        <Button variant="outline" className="gap-2">
                            <Users className="h-4 w-4" />
                            Presença
                        </Button>
                    </Link>
                    <Link href={`/professor/classes/${classId}/reports`}>
                        <Button variant="outline" className="gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Relatórios
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <GraduationCap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.totalEnrolled || 0}</p>
                                <p className="text-xs text-muted-foreground">Alunos Ativos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <UserPlus className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.pendingEnrollments || 0}</p>
                                <p className="text-xs text-muted-foreground">Pendentes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Award className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.completedCount || 0}</p>
                                <p className="text-xs text-muted-foreground">Concluídos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.averageProgress || 0}%</p>
                                <p className="text-xs text-muted-foreground">Progresso Médio</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={item}>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-grid">
                        <TabsTrigger value="students" className="gap-2">
                            <GraduationCap className="h-4 w-4 hidden md:block" />
                            Alunos
                        </TabsTrigger>
                        <TabsTrigger value="tokens" className="gap-2">
                            <LinkIcon className="h-4 w-4 hidden md:block" />
                            Tokens
                        </TabsTrigger>
                    </TabsList>

                    {/* Students Tab */}
                    <TabsContent value="students" className="space-y-4">
                        {/* Pending Approvals */}
                        {pendingStudents.length > 0 && (
                            <Card className="border-amber-500/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <UserPlus className="h-4 w-4 text-amber-500" />
                                        Aguardando Aprovação ({pendingStudents.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {pendingStudents.map((enrollment: any) => (
                                            <div
                                                key={enrollment._id}
                                                className="flex items-center justify-between p-3648 bg-muted/50 rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={enrollment.user?.imageUrl} />
                                                        <AvatarFallback>
                                                            {enrollment.user?.firstName?.[0] || ""}
                                                            {enrollment.user?.lastName?.[0] || ""}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {enrollment.user?.firstName} {enrollment.user?.lastName}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatDateTime(enrollment.enrolledAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-1 text-emerald-500 hover:text-emerald-600"
                                                        onClick={() => setConfirmAction({
                                                            type: "approve",
                                                            userId: enrollment.user?._id,
                                                            name: `${enrollment.user?.firstName} ${enrollment.user?.lastName}`,
                                                        })}
                                                    >
                                                        <Check className="h-3 w-3" />
                                                        Aprovar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-1 text-destructive hover:text-destructive"
                                                        onClick={() => setConfirmAction({
                                                            type: "reject",
                                                            userId: enrollment.user?._id,
                                                            name: `${enrollment.user?.firstName} ${enrollment.user?.lastName}`,
                                                        })}
                                                    >
                                                        <X className="h-3 w-3" />
                                                        Rejeitar
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Active Students */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Alunos Ativos ({activeStudents.length})</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Aluno</TableHead>
                                            <TableHead>Progresso</TableHead>
                                            <TableHead className="hidden md:table-cell">Nota Média</TableHead>
                                            <TableHead className="hidden md:table-cell">Última Atividade</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activeStudents.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    Nenhum aluno inscrito
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            activeStudents.map((enrollment: any) => (
                                                <TableRow key={enrollment._id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={enrollment.user?.imageUrl} />
                                                                <AvatarFallback>
                                                                    {enrollment.user?.firstName?.[0] || ""}
                                                                    {enrollment.user?.lastName?.[0] || ""}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium text-sm">
                                                                    {enrollment.user?.firstName} {enrollment.user?.lastName}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground hidden md:block">
                                                                    {enrollment.user?.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Progress value={enrollment.progressPercent} className="w-20 h-2" />
                                                            <span className="text-sm text-muted-foreground">
                                                                {enrollment.progressPercent}%
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        {enrollment.averageScore !== null ? (
                                                            <span className={enrollment.averageScore >= 70 ? "text-emerald-500" : "text-amber-500"}>
                                                                {enrollment.averageScore}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                                        {enrollment.lastActivity ? formatDateTime(enrollment.lastActivity) : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <Link href={`/professor/classes/${classId}/student/${enrollment.user?._id}`}>
                                                                    <DropdownMenuItem className="gap-2">
                                                                        <Eye className="h-4 w-4" />
                                                                        Ver Progresso
                                                                    </DropdownMenuItem>
                                                                </Link>
                                                                <DropdownMenuItem
                                                                    className="gap-2 text-destructive"
                                                                    onClick={() => setConfirmAction({
                                                                        type: "remove",
                                                                        userId: enrollment.user?._id,
                                                                        name: `${enrollment.user?.firstName} ${enrollment.user?.lastName}`,
                                                                    })}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    Remover
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Completed Students */}
                        {completedStudents.length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Award className="h-4 w-4 text-emerald-500" />
                                        Concluídos ({completedStudents.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {completedStudents.map((enrollment: any) => (
                                            <div
                                                key={enrollment._id}
                                                className="flex items-center gap-3 p-2 bg-emerald-500/5 rounded-lg"
                                            >
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={enrollment.user?.imageUrl} />
                                                    <AvatarFallback>
                                                        {enrollment.user?.firstName?.[0] || ""}
                                                        {enrollment.user?.lastName?.[0] || ""}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">
                                                        {enrollment.user?.firstName} {enrollment.user?.lastName}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Nota: {enrollment.averageScore || "-"}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="text-emerald-500">
                                                    100%
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Tokens Tab */}
                    <TabsContent value="tokens" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold">Tokens de Matrícula</h3>
                                <p className="text-sm text-muted-foreground">
                                    Crie links para alunos se inscreverem
                                </p>
                            </div>
                            <Button onClick={() => setCreateTokenDialog(true)} className="gap-2">
                                <LinkIcon className="h-4 w-4" />
                                Criar Token
                            </Button>
                        </div>

                        <div className="grid gap-4">
                            {(classDetails.tokens as any[] ?? []).map((token: any) => (
                                <Card key={token._id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    {token.name || `Token ${token.token?.substring(0, 6)}...`}
                                                </p>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        Usado: {token.usageCount}
                                                        {token.usageLimit && `/${token.usageLimit}`}
                                                    </span>
                                                    {token.expiresAt && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            Expira: {formatDate(token.expiresAt)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-1"
                                                    onClick={() => copyTokenLink(token.token)}
                                                >
                                                    <Copy className="h-3 w-3" />
                                                    Copiar Link
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => revokeToken({ tokenId: token._id })}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {(!classDetails.tokens || (classDetails.tokens as any[]).length === 0) && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <LinkIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>Nenhum token ativo</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </motion.div>

            {/* Create Token Dialog */}
            <Dialog open={createTokenDialog} onOpenChange={setCreateTokenDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Criar Token de Matrícula</DialogTitle>
                        <DialogDescription>
                            Gere um link que alunos podem usar para se inscrever
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="tokenName">Nome (opcional)</Label>
                            <Input
                                id="tokenName"
                                placeholder="Ex: Link para turma de janeiro"
                                value={tokenForm.name}
                                onChange={(e) => setTokenForm({ ...tokenForm, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="usageLimit">Limite de Uso</Label>
                                <Input
                                    id="usageLimit"
                                    type="number"
                                    placeholder="Ilimitado"
                                    value={tokenForm.usageLimit}
                                    onChange={(e) => setTokenForm({ ...tokenForm, usageLimit: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Validade</Label>
                                <Select
                                    value={tokenForm.validityDays}
                                    onValueChange={(v) => setTokenForm({ ...tokenForm, validityDays: v as "7" | "30" | "null" })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">7 dias</SelectItem>
                                        <SelectItem value="30">30 dias</SelectItem>
                                        <SelectItem value="null">Sem expiração</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateTokenDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateToken} className="gap-2">
                            <LinkIcon className="h-4 w-4" />
                            Criar e Copiar Link
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmAction?.type === "approve" && (
                                <>Deseja aprovar a inscrição de <strong>{confirmAction.name}</strong>?</>
                            )}
                            {confirmAction?.type === "reject" && (
                                <>Deseja rejeitar a inscrição de <strong>{confirmAction.name}</strong>?</>
                            )}
                            {confirmAction?.type === "remove" && (
                                <>Deseja remover <strong>{confirmAction.name}</strong> da turma?</>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmAction}
                            className={confirmAction?.type === "approve" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
                        >
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
}
