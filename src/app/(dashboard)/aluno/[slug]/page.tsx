"use client";

import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    Edit,
    Mail,
    Calendar,
    Clock,
    GraduationCap,
    BookOpen,
    Trophy,
    Award,
    User,
    Loader2,
    Building2,
    CheckCircle,
    XCircle,
} from "lucide-react";
import Link from "next/link";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

const roleLabels: Record<string, string> = {
    admin: "Administrador",
    professor: "Professor",
    student: "Aluno",
    superadmin: "Super Admin",
};

const roleColors: Record<string, string> = {
    admin: "bg-primary text-primary-foreground",
    professor: "bg-amber-500 text-white",
    student: "bg-emerald-500 text-white",
    superadmin: "bg-violet-500 text-white",
};

export default function StudentProfilePage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    // Get user by slug
    const user = useQuery(api.users.getBySlug, { slug });

    // Get user stats
    const stats = useQuery(
        api.users.getStats,
        user ? { userId: user._id } : "skip"
    );

    // Get user enrollments
    const enrollments = useQuery(
        api.enrollments.getByUser,
        user ? { userId: user._id } : "skip"
    );

    if (user === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (user === null) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <User className="h-16 w-16 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Usuário não encontrado</h2>
                <p className="text-muted-foreground">O usuário solicitado não existe ou você não tem permissão para visualizá-lo.</p>
                <Button onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>
            </div>
        );
    }

    const formatDate = (timestamp?: number) => {
        if (!timestamp) return "N/A";
        return new Date(timestamp).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
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

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Header with back button */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Perfil do Aluno</h1>
                        <p className="text-muted-foreground">
                            Visualize as informações do aluno
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <a href={`mailto:${user.email}`}>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Email
                        </a>
                    </Button>
                    <Link href={`/admin/users/${user._id}/edit`}>
                        <Button className="gap-2 gradient-bg border-0">
                            <Edit className="h-4 w-4" />
                            Editar
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* Profile Card */}
            <motion.div variants={item}>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Avatar and basic info */}
                            <div className="flex flex-col items-center md:items-start gap-4">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={user.imageUrl || undefined} />
                                    <AvatarFallback className="text-2xl">
                                        {user.firstName?.[0]}{user.lastName?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-center md:text-left">
                                    <h2 className="text-xl font-bold">
                                        {user.firstName} {user.lastName}
                                    </h2>
                                    <p className="text-muted-foreground">{user.email}</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        /{user.slug}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                                        <Badge className={roleColors[user.role] || "bg-muted"}>
                                            {roleLabels[user.role] || user.role}
                                        </Badge>
                                        {user.isActive ? (
                                            <Badge variant="outline" className="border-emerald-500 text-emerald-500">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Ativo
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="border-amber-500 text-amber-500">
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Inativo
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Separator orientation="vertical" className="hidden md:block h-auto" />
                            <Separator className="md:hidden" />

                            {/* Details */}
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Membro desde
                                    </p>
                                    <p className="font-medium">{formatDate(user.createdAt)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Último acesso
                                    </p>
                                    <p className="font-medium">{getLastLogin(user.lastLoginAt)}</p>
                                </div>
                                {user.organizationId && (
                                    <div className="space-y-1 sm:col-span-2">
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            Organização
                                        </p>
                                        <p className="font-medium">Vinculado à organização</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Stats */}
            {user.role === "student" && (
                <motion.div variants={item} className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats?.coursesInProgress || 0}</p>
                                    <p className="text-sm text-muted-foreground">Cursos em Andamento</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <GraduationCap className="h-5 w-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats?.coursesCompleted || 0}</p>
                                    <p className="text-sm text-muted-foreground">Cursos Concluídos</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <Award className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats?.certificates || 0}</p>
                                    <p className="text-sm text-muted-foreground">Certificados</p>
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
                                    <p className="text-2xl font-bold">{stats?.achievements || 0}</p>
                                    <p className="text-sm text-muted-foreground">Conquistas</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Enrollments */}
            {user.role === "student" && enrollments && enrollments.length > 0 && (
                <motion.div variants={item}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Cursos Matriculados
                            </CardTitle>
                            <CardDescription>
                                Cursos em que o aluno está matriculado
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {enrollments.map((enrollment) => (
                                    <div
                                        key={enrollment._id}
                                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <BookOpen className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {enrollment.course?.title || "Curso"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Progresso: {enrollment.progress || 0}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {enrollment.completedAt ? (
                                                <Badge className="bg-emerald-500 text-white">
                                                    Concluído
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">Em andamento</Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Empty enrollments state for students */}
            {user.role === "student" && enrollments && enrollments.length === 0 && (
                <motion.div variants={item}>
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center">
                                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">Nenhum curso matriculado</h3>
                                <p className="text-muted-foreground">
                                    Este aluno ainda não está matriculado em nenhum curso.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </motion.div>
    );
}
