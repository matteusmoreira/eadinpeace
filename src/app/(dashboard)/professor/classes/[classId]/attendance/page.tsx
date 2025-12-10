"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    Calendar,
    Loader2,
    Plus,
    Check,
    X,
    Clock,
    MoreVertical,
    Trash2,
    Edit,
    UserCheck,
    UserX,
    AlertCircle,
    CheckCircle2,
    ClipboardList,
    Percent,
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

type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface StudentAttendance {
    userId: Id<"users">;
    status: AttendanceStatus;
    notes?: string;
}

export default function AttendancePage() {
    const params = useParams();
    const classId = params.classId as Id<"classes">;

    const [createSessionDialog, setCreateSessionDialog] = useState(false);
    const [markAttendanceDialog, setMarkAttendanceDialog] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<Id<"attendanceSessions"> | null>(null);
    const [selectedSession, setSelectedSession] = useState<Id<"attendanceSessions"> | null>(null);

    const [sessionForm, setSessionForm] = useState({
        title: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
    });

    const [attendanceMap, setAttendanceMap] = useState<Map<string, StudentAttendance>>(new Map());

    // Queries
    const classDetails = useQuery(api.classes.getById, { classId });
    const sessions = useQuery(api.attendance.getSessionsByClass, { classId });
    const sessionDetails = useQuery(
        api.attendance.getAttendanceBySession,
        selectedSession ? { sessionId: selectedSession } : "skip"
    );
    const stats = useQuery(api.attendance.getClassAttendanceStats, { classId });

    // Mutations
    const createSession = useMutation(api.attendance.createSession);
    const deleteSession = useMutation(api.attendance.deleteSession);
    const markBulkAttendance = useMutation(api.attendance.markBulkAttendance);

    const isLoading = classDetails === undefined || sessions === undefined;

    // Initialize attendance map when session details load
    const initializeAttendanceMap = () => {
        if (!sessionDetails) return;

        const newMap = new Map<string, StudentAttendance>();

        // First, add existing attendances
        sessionDetails.attendances?.forEach((att: any) => {
            newMap.set(att.userId, {
                userId: att.userId,
                status: att.status,
                notes: att.notes,
            });
        });

        // Then add students without attendance yet (default to "absent")
        sessionDetails.enrolledStudents?.forEach((student: any) => {
            if (!newMap.has(student.userId)) {
                newMap.set(student.userId, {
                    userId: student.userId,
                    status: "absent",
                    notes: undefined,
                });
            }
        });

        setAttendanceMap(newMap);
    };

    const handleOpenMarkDialog = (sessionId: Id<"attendanceSessions">) => {
        setSelectedSession(sessionId);
        setMarkAttendanceDialog(true);
    };

    const handleCreateSession = async () => {
        try {
            const dateTimestamp = new Date(sessionForm.date).getTime();
            await createSession({
                classId,
                title: sessionForm.title || undefined,
                date: dateTimestamp,
                notes: sessionForm.notes || undefined,
            });
            toast.success("Sessão de presença criada!");
            setCreateSessionDialog(false);
            setSessionForm({ title: "", date: new Date().toISOString().split("T")[0], notes: "" });
        } catch (error: any) {
            toast.error(error.message || "Erro ao criar sessão");
        }
    };

    const handleDeleteSession = async () => {
        if (!deleteConfirm) return;
        try {
            await deleteSession({ sessionId: deleteConfirm });
            toast.success("Sessão excluída");
            setDeleteConfirm(null);
        } catch (error: any) {
            toast.error(error.message || "Erro ao excluir sessão");
        }
    };

    const handleSaveAttendance = async () => {
        if (!selectedSession) return;

        try {
            const attendances = Array.from(attendanceMap.values()).map((att) => ({
                userId: att.userId,
                status: att.status,
                notes: att.notes,
            }));

            await markBulkAttendance({
                sessionId: selectedSession,
                attendances,
            });

            toast.success("Presença registrada com sucesso!");
            setMarkAttendanceDialog(false);
            setSelectedSession(null);
            setAttendanceMap(new Map());
        } catch (error: any) {
            toast.error(error.message || "Erro ao salvar presença");
        }
    };

    const updateStudentStatus = (userId: Id<"users">, status: AttendanceStatus) => {
        const newMap = new Map(attendanceMap);
        const current = newMap.get(userId);
        if (current) {
            newMap.set(userId, { ...current, status });
        } else {
            newMap.set(userId, { userId, status });
        }
        setAttendanceMap(newMap);
    };

    const setAllStatus = (status: AttendanceStatus) => {
        const newMap = new Map(attendanceMap);
        sessionDetails?.enrolledStudents?.forEach((student: any) => {
            const current = newMap.get(student.userId);
            if (current) {
                newMap.set(student.userId, { ...current, status });
            } else {
                newMap.set(student.userId, { userId: student.userId, status });
            }
        });
        setAttendanceMap(newMap);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const formatShortDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "present":
                return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Presente</Badge>;
            case "absent":
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Ausente</Badge>;
            case "late":
                return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Atrasado</Badge>;
            case "excused":
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Justificado</Badge>;
            default:
                return <Badge variant="secondary">-</Badge>;
        }
    };

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

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Header */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href={`/professor/classes/${classId}`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Controle de Presença</h1>
                        <p className="text-muted-foreground">
                            Turma: {classDetails.name}
                        </p>
                    </div>
                </div>
                <Button onClick={() => setCreateSessionDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Sessão
                </Button>
            </motion.div>

            {/* Stats Cards */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <ClipboardList className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.totalSessions || 0}</p>
                                <p className="text-xs text-muted-foreground">Sessões</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <UserCheck className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.stats?.present || 0}</p>
                                <p className="text-xs text-muted-foreground">Presenças</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <UserX className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.stats?.absent || 0}</p>
                                <p className="text-xs text-muted-foreground">Ausências</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Percent className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.overallAttendanceRate || 0}%</p>
                                <p className="text-xs text-muted-foreground">Frequência</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Sessions List */}
            <motion.div variants={item}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Sessões de Presença
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {sessions && sessions.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Título</TableHead>
                                        <TableHead className="hidden md:table-cell">Presentes</TableHead>
                                        <TableHead className="hidden md:table-cell">Ausentes</TableHead>
                                        <TableHead className="hidden md:table-cell">Taxa</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessions.map((session: any) => {
                                        const total = session.stats?.present + session.stats?.late || 0;
                                        const totalStudents = session.stats?.total || 0;
                                        const rate = totalStudents > 0 ? Math.round((total / totalStudents) * 100) : 0;

                                        return (
                                            <TableRow key={session._id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                                                            <Calendar className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <span className="font-medium">{formatShortDate(session.date)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {session.title || <span className="text-muted-foreground">Sem título</span>}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                                        {session.stats?.present || 0}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                                                        {session.stats?.absent || 0}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={rate} className="w-16 h-2" />
                                                        <span className="text-sm text-muted-foreground">{rate}%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-1"
                                                            onClick={() => handleOpenMarkDialog(session._id)}
                                                        >
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Marcar
                                                        </Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    className="gap-2 text-destructive"
                                                                    onClick={() => setDeleteConfirm(session._id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    Excluir
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12">
                                <ClipboardList className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                                <p className="text-muted-foreground mb-4">Nenhuma sessão de presença criada</p>
                                <Button variant="outline" onClick={() => setCreateSessionDialog(true)} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Criar Primeira Sessão
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Top Students by Attendance */}
            {stats && stats.studentStats && stats.studentStats.length > 0 && (
                <motion.div variants={item}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Frequência por Aluno
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {stats.studentStats.map((student: any, index: number) => (
                                    <div key={student.userId} className="flex items-center gap-3">
                                        <span className="w-6 text-sm text-muted-foreground">{index + 1}.</span>
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={student.imageUrl} />
                                            <AvatarFallback>
                                                {student.name?.split(" ")[0]?.[0] || ""}
                                                {student.name?.split(" ")[1]?.[0] || ""}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{student.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {student.sessionsAttended} de {student.totalSessions} sessões
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Progress value={student.attendanceRate} className="w-20 h-2" />
                                            <span className={`text-sm font-medium ${student.attendanceRate >= 75 ? "text-emerald-500" :
                                                    student.attendanceRate >= 50 ? "text-amber-500" : "text-red-500"
                                                }`}>
                                                {student.attendanceRate}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Create Session Dialog */}
            <Dialog open={createSessionDialog} onOpenChange={setCreateSessionDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Sessão de Presença</DialogTitle>
                        <DialogDescription>
                            Crie uma nova sessão para registrar a presença dos alunos
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="sessionDate">Data *</Label>
                            <Input
                                id="sessionDate"
                                type="date"
                                value={sessionForm.date}
                                onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sessionTitle">Título (opcional)</Label>
                            <Input
                                id="sessionTitle"
                                placeholder="Ex: Aula 1 - Introdução"
                                value={sessionForm.title}
                                onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sessionNotes">Observações (opcional)</Label>
                            <Textarea
                                id="sessionNotes"
                                placeholder="Anotações sobre a aula..."
                                value={sessionForm.notes}
                                onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateSessionDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateSession} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Criar Sessão
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Mark Attendance Dialog */}
            <Dialog
                open={markAttendanceDialog}
                onOpenChange={(open) => {
                    setMarkAttendanceDialog(open);
                    if (!open) {
                        setSelectedSession(null);
                        setAttendanceMap(new Map());
                    }
                }}
            >
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Marcar Presença</DialogTitle>
                        <DialogDescription>
                            {sessionDetails?.session && formatDate(sessionDetails.session.date)}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Quick Actions */}
                    <div className="flex gap-2 py-2 border-b">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-emerald-500"
                            onClick={() => {
                                if (attendanceMap.size === 0) initializeAttendanceMap();
                                setAllStatus("present");
                            }}
                        >
                            <Check className="h-3 w-3" />
                            Todos Presentes
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-red-500"
                            onClick={() => {
                                if (attendanceMap.size === 0) initializeAttendanceMap();
                                setAllStatus("absent");
                            }}
                        >
                            <X className="h-3 w-3" />
                            Todos Ausentes
                        </Button>
                    </div>

                    {/* Students List */}
                    <div className="flex-1 overflow-y-auto py-2">
                        {sessionDetails?.enrolledStudents?.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                <p>Nenhum aluno matriculado nesta turma</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {sessionDetails?.enrolledStudents?.map((student: any) => {
                                    // Initialize attendance if needed
                                    if (attendanceMap.size === 0 && sessionDetails) {
                                        initializeAttendanceMap();
                                    }

                                    const attendance = attendanceMap.get(student.userId);
                                    const status = attendance?.status || student.currentStatus || "absent";

                                    return (
                                        <div
                                            key={student.userId}
                                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={student.user?.imageUrl} />
                                                    <AvatarFallback>
                                                        {student.user?.firstName?.[0] || ""}
                                                        {student.user?.lastName?.[0] || ""}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {student.user?.firstName} {student.user?.lastName}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {student.user?.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant={status === "present" ? "default" : "outline"}
                                                    size="sm"
                                                    className={`w-8 h-8 p-0 ${status === "present" ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
                                                    onClick={() => updateStudentStatus(student.userId, "present")}
                                                    title="Presente"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant={status === "absent" ? "default" : "outline"}
                                                    size="sm"
                                                    className={`w-8 h-8 p-0 ${status === "absent" ? "bg-red-500 hover:bg-red-600" : ""}`}
                                                    onClick={() => updateStudentStatus(student.userId, "absent")}
                                                    title="Ausente"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant={status === "late" ? "default" : "outline"}
                                                    size="sm"
                                                    className={`w-8 h-8 p-0 ${status === "late" ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                                                    onClick={() => updateStudentStatus(student.userId, "late")}
                                                    title="Atrasado"
                                                >
                                                    <Clock className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant={status === "excused" ? "default" : "outline"}
                                                    size="sm"
                                                    className={`w-8 h-8 p-0 ${status === "excused" ? "bg-blue-500 hover:bg-blue-600" : ""}`}
                                                    onClick={() => updateStudentStatus(student.userId, "excused")}
                                                    title="Justificado"
                                                >
                                                    <AlertCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="border-t pt-4">
                        <Button variant="outline" onClick={() => setMarkAttendanceDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveAttendance} className="gap-2">
                            <Check className="h-4 w-4" />
                            Salvar Presença
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir esta sessão? Todos os registros de presença serão removidos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteSession}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
}
