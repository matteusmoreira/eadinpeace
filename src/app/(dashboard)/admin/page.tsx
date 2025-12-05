"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Users,
    BookOpen,
    GraduationCap,
    TrendingUp,
    ArrowUpRight,
    Plus,
    Activity,
    Award,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";

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

const roleColors: Record<string, string> = {
    admin: "bg-primary text-primary-foreground",
    professor: "bg-amber-500 text-white",
    student: "bg-muted text-muted-foreground",
};

export default function AdminDashboardPage() {
    const { user } = useUser();

    // Get Convex user
    const convexUser = useQuery(api.users.getByClerkId, {
        clerkId: user?.id || ""
    });

    // Get organization stats
    const organizationId = convexUser?.organizationId;

    const courses = useQuery(
        api.courses.getByOrganization,
        organizationId ? { organizationId } : "skip"
    );

    const allUsers = useQuery(api.users.getAll);

    // Filter users by organization
    const orgUsers = allUsers?.filter(u => u.organizationId === organizationId) || [];

    const isLoading = courses === undefined || allUsers === undefined;

    // Calculate stats
    const totalUsers = orgUsers.length;
    const professors = orgUsers.filter(u => u.role === "professor").length;
    const students = orgUsers.filter(u => u.role === "student").length;
    const totalCourses = courses?.length || 0;
    const publishedCourses = courses?.filter(c => c.isPublished).length || 0;
    const totalEnrollments = courses?.reduce((acc, c) => acc + (c.enrollmentCount || 0), 0) || 0;

    // Recent users (last 5)
    const recentUsers = [...orgUsers]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);

    const formatDate = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (hours < 1) return "Agora";
        if (hours < 24) return `Há ${hours}h`;
        if (days < 7) return `Há ${days}d`;
        return new Date(timestamp).toLocaleDateString("pt-BR");
    };

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
                    <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Visão geral da sua organização
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/users/new">
                        <Button variant="outline" className="gap-2">
                            <Users className="h-4 w-4" />
                            Novo Usuário
                        </Button>
                    </Link>
                    <Link href="/admin/courses/new">
                        <Button className="gap-2 gradient-bg border-0">
                            <BookOpen className="h-4 w-4" />
                            Novo Curso
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="hover:shadow-lg transition-all duration-300">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Total de Usuários</p>
                                        <p className="text-3xl font-bold">{totalUsers}</p>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <span>{students} alunos • {professors} professores</span>
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all duration-300">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Professores</p>
                                        <p className="text-3xl font-bold">{professors}</p>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <GraduationCap className="h-4 w-4" />
                                            <span>Ativos</span>
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                        <GraduationCap className="h-6 w-6 text-amber-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all duration-300">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Cursos</p>
                                        <p className="text-3xl font-bold">{totalCourses}</p>
                                        <div className="flex items-center gap-1 text-sm text-emerald-500">
                                            <ArrowUpRight className="h-4 w-4" />
                                            <span>{publishedCourses} publicados</span>
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <BookOpen className="h-6 w-6 text-emerald-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all duration-300">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Matrículas</p>
                                        <p className="text-3xl font-bold">{totalEnrollments}</p>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <TrendingUp className="h-4 w-4" />
                                            <span>Em todos os cursos</span>
                                        </div>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                        <Award className="h-6 w-6 text-violet-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Recent Users */}
                        <motion.div variants={item}>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Usuários Recentes</CardTitle>
                                        <CardDescription>Últimos cadastros</CardDescription>
                                    </div>
                                    <Link href="/admin/users">
                                        <Button variant="ghost" size="sm">Ver todos</Button>
                                    </Link>
                                </CardHeader>
                                <CardContent>
                                    {recentUsers.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>Nenhum usuário ainda</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {recentUsers.map((u) => (
                                                <div key={u._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarImage src={u.imageUrl || undefined} />
                                                            <AvatarFallback>
                                                                {u.firstName?.[0]}{u.lastName?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">{u.firstName} {u.lastName}</p>
                                                            <p className="text-sm text-muted-foreground">{u.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge className={roleColors[u.role] || "bg-muted"}>
                                                            {u.role === "professor"
                                                                ? "Professor"
                                                                : u.role === "admin"
                                                                    ? "Admin"
                                                                    : "Aluno"}
                                                        </Badge>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {formatDate(u.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Recent Courses */}
                        <motion.div variants={item}>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Cursos</CardTitle>
                                        <CardDescription>Últimos cursos criados</CardDescription>
                                    </div>
                                    <Link href="/admin/courses">
                                        <Button variant="ghost" size="sm">Ver todos</Button>
                                    </Link>
                                </CardHeader>
                                <CardContent>
                                    {courses?.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p>Nenhum curso ainda</p>
                                            <Link href="/admin/courses/new">
                                                <Button variant="link" className="mt-2">Criar primeiro curso</Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {courses?.slice(0, 5).map((course) => (
                                                <div key={course._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                            <BookOpen className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{course.title}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {course.enrollmentCount || 0} alunos • {course.lessonCount || 0} aulas
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge variant={course.isPublished ? "default" : "secondary"}>
                                                        {course.isPublished ? "Publicado" : "Rascunho"}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </>
            )}
        </motion.div>
    );
}
