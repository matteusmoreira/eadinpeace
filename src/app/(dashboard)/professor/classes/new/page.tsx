"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import {
    ArrowLeft,
    Loader2,
    Users,
    BookOpen,
    Calendar,
    Save,
    Hash,
    FileText,
    Settings,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Id } from "@convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
};

export default function NewClassPage() {
    const router = useRouter();
    const { user } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [courseId, setCourseId] = useState<string>("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [capacity, setCapacity] = useState<string>("");
    const [enrollmentType, setEnrollmentType] = useState<"manual" | "open" | "token" | "approval">("manual");
    const [requiresApproval, setRequiresApproval] = useState(false);

    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get courses where user is instructor
    const courses = useQuery(
        api.courses.getByInstructor,
        convexUser?._id ? { instructorId: convexUser._id } : "skip"
    );

    const createClass = useMutation(api.classes.create);

    const isLoading = courses === undefined;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!courseId) {
            toast.error("Selecione um curso");
            return;
        }

        if (!name.trim()) {
            toast.error("Informe o nome da turma");
            return;
        }

        if (!startDate) {
            toast.error("Informe a data de início");
            return;
        }

        setIsSubmitting(true);
        try {
            await createClass({
                courseId: courseId as Id<"courses">,
                name: name.trim(),
                description: description.trim() || undefined,
                startDate: new Date(startDate).getTime(),
                endDate: endDate ? new Date(endDate).getTime() : undefined,
                capacity: capacity ? parseInt(capacity) : undefined,
                enrollmentType,
                requiresApproval,
            });

            toast.success("Turma criada com sucesso!");
            router.push("/professor/classes");
        } catch (error: any) {
            toast.error(error.message || "Erro ao criar turma");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Header */}
            <motion.div variants={item} className="flex items-center gap-4">
                <Link href="/professor/classes">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Nova Turma</h1>
                    <p className="text-muted-foreground">Crie uma nova turma para um dos seus cursos</p>
                </div>
            </motion.div>

            {courses?.length === 0 ? (
                <motion.div variants={item}>
                    <Card>
                        <CardContent className="py-12 text-center">
                            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">Nenhum curso disponível</h3>
                            <p className="text-muted-foreground mb-4">
                                Você precisa ter pelo menos um curso para criar uma turma.
                            </p>
                            <Link href="/professor/courses/new">
                                <Button>Criar Curso</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <motion.div variants={item} className="grid gap-6 md:grid-cols-2">
                        {/* Main Info */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Informações Básicas
                                </CardTitle>
                                <CardDescription>
                                    Configure as informações principais da turma
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="course">Curso *</Label>
                                        <Select value={courseId} onValueChange={setCourseId}>
                                            <SelectTrigger id="course">
                                                <SelectValue placeholder="Selecione um curso" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {courses?.map((course: any) => (
                                                    <SelectItem key={course._id} value={course._id}>
                                                        {course.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nome da Turma *</Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Ex: Turma 2024.1"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Descrição</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Descrição opcional da turma..."
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Schedule */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Cronograma
                                </CardTitle>
                                <CardDescription>
                                    Defina as datas da turma
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Data de Início *</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="endDate">Data de Término</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Deixe em branco para turma sem data de término
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="capacity">Capacidade Máxima</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="capacity"
                                            type="number"
                                            min="1"
                                            value={capacity}
                                            onChange={(e) => setCapacity(e.target.value)}
                                            placeholder="Sem limite"
                                            className="pl-10"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Deixe em branco para turma sem limite de alunos
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Enrollment Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Configurações de Matrícula
                                </CardTitle>
                                <CardDescription>
                                    Configure como os alunos podem se matricular
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="enrollmentType">Tipo de Matrícula</Label>
                                    <Select
                                        value={enrollmentType}
                                        onValueChange={(value: "manual" | "open" | "token" | "approval") => setEnrollmentType(value)}
                                    >
                                        <SelectTrigger id="enrollmentType">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="manual">
                                                <div className="flex flex-col">
                                                    <span>Manual</span>
                                                    <span className="text-xs text-muted-foreground">Apenas professor/admin pode matricular</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="open">
                                                <div className="flex flex-col">
                                                    <span>Aberta</span>
                                                    <span className="text-xs text-muted-foreground">Qualquer aluno pode se matricular</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="token">
                                                <div className="flex flex-col">
                                                    <span>Por Token</span>
                                                    <span className="text-xs text-muted-foreground">Alunos precisam de um código de acesso</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="approval">
                                                <div className="flex flex-col">
                                                    <span>Com Aprovação</span>
                                                    <span className="text-xs text-muted-foreground">Matrículas precisam ser aprovadas</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {(enrollmentType === "open" || enrollmentType === "token") && (
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="requiresApproval">Requer Aprovação</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Matrículas ficam pendentes até serem aprovadas
                                            </p>
                                        </div>
                                        <Switch
                                            id="requiresApproval"
                                            checked={requiresApproval}
                                            onCheckedChange={setRequiresApproval}
                                        />
                                    </div>
                                )}

                                <div className="pt-4 border-t">
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Como funciona?
                                    </h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        {enrollmentType === "manual" && (
                                            <>
                                                <li>• Você controla quem pode acessar a turma</li>
                                                <li>• Adicione alunos manualmente pela gestão da turma</li>
                                            </>
                                        )}
                                        {enrollmentType === "open" && (
                                            <>
                                                <li>• Alunos podem encontrar e se matricular</li>
                                                <li>• Ideal para cursos públicos</li>
                                            </>
                                        )}
                                        {enrollmentType === "token" && (
                                            <>
                                                <li>• Gere códigos de acesso para compartilhar</li>
                                                <li>• Controle quem recebe o código</li>
                                            </>
                                        )}
                                        {enrollmentType === "approval" && (
                                            <>
                                                <li>• Alunos solicitam matrícula</li>
                                                <li>• Você aprova ou rejeita cada solicitação</li>
                                            </>
                                        )}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Actions */}
                    <motion.div variants={item} className="flex justify-end gap-4 mt-6">
                        <Link href="/professor/classes">
                            <Button type="button" variant="outline">
                                Cancelar
                            </Button>
                        </Link>
                        <Button type="submit" disabled={isSubmitting} className="gap-2">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Criar Turma
                                </>
                            )}
                        </Button>
                    </motion.div>
                </form>
            )}
        </motion.div>
    );
}
