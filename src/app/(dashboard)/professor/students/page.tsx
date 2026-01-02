"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Users,
    Search,
    BookOpen,
    TrendingUp,
    Clock,
    Award,
    Loader2,
    Mail,
    MoreVertical,
    Eye,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Id } from "@convex/_generated/dataModel";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
};

export default function ProfessorStudentsPage() {
    const { user } = useUser();
    const [search, setSearch] = useState("");
    const [courseFilter, setCourseFilter] = useState<string>("all");

    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get professor's courses
    const courses = useQuery(
        api.courses.getByInstructor,
        convexUser?._id ? { instructorId: convexUser._id } : "skip"
    );

    // Get all enrollments for professor's courses
    const allEnrollments = useQuery(api.enrollments.getAll);

    const isLoading = courses === undefined || allEnrollments === undefined;

    // Filter enrollments to only professor's courses
    const courseIds = courses?.map(c => c._id) || [];
    const myEnrollments = allEnrollments?.filter(e =>
        courseIds.includes(e.courseId)
    ) || [];

    // Apply filters
    const filteredEnrollments = myEnrollments.filter(e => {
        const matchSearch = search === "" ||
            e.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
            e.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
            e.user?.email?.toLowerCase().includes(search.toLowerCase());

        const matchCourse = courseFilter === "all" || e.courseId === courseFilter;

        return matchSearch && matchCourse;
    });

    // Stats
    const totalStudents = new Set(myEnrollments.map(e => e.userId)).size;
    const totalEnrollments = myEnrollments.length;
    const completedEnrollments = myEnrollments.filter(e => e.completedAt).length;
    const avgProgress = myEnrollments.length > 0
        ? Math.round(myEnrollments.reduce((acc, e) => acc + e.progress, 0) / myEnrollments.length)
        : 0;

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item}>
                <h1 className="text-2xl md:text-3xl font-bold">Meus Alunos</h1>
                <p className="text-muted-foreground">Acompanhe o progresso dos seus alunos</p>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{totalStudents}</p>
                                <p className="text-sm text-muted-foreground">Alunos Únicos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{totalEnrollments}</p>
                                <p className="text-sm text-muted-foreground">Matrículas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Award className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{completedEnrollments}</p>
                                <p className="text-sm text-muted-foreground">Concluídos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{avgProgress}%</p>
                                <p className="text-sm text-muted-foreground">Progresso Médio</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Filters */}
            <motion.div variants={item} className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar aluno..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger className="w-full md:w-[250px]">
                        <SelectValue placeholder="Filtrar por curso" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os cursos</SelectItem>
                        {courses?.map((course) => (
                            <SelectItem key={course._id} value={course._id}>
                                {course.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </motion.div>

            {/* Students List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredEnrollments.length === 0 ? (
                <motion.div variants={item} className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                        {search || courseFilter !== "all" ? "Nenhum resultado encontrado" : "Nenhum aluno ainda"}
                    </h3>
                    <p className="text-muted-foreground">
                        {search || courseFilter !== "all"
                            ? "Tente ajustar os filtros"
                            : "Quando alunos se matricularem, aparecerão aqui"}
                    </p>
                </motion.div>
            ) : (
                <>
                    {/* Mobile Grid View */}
                    <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                        {filteredEnrollments.map((enrollment) => (
                            <Card key={enrollment._id} className="overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <Avatar className="h-12 w-12 flex-shrink-0">
                                                <AvatarImage src={enrollment.user?.imageUrl || undefined} />
                                                <AvatarFallback className="text-lg">
                                                    {enrollment.user?.firstName?.[0]}{enrollment.user?.lastName?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold truncate">
                                                        {enrollment.user?.firstName} {enrollment.user?.lastName}
                                                    </p>
                                                    {enrollment.completedAt && (
                                                        <Badge className="bg-emerald-500 flex-shrink-0 text-xs">✓</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {enrollment.user?.email}
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
                                                    <Link href={`/professor/students/${enrollment.userId}/course/${enrollment.courseId}`} className="gap-2 flex items-center cursor-pointer">
                                                        <Eye className="h-4 w-4" />
                                                        Ver progresso
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2">
                                                    <Mail className="h-4 w-4" />
                                                    Enviar mensagem
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="mt-3 pt-3 border-t space-y-2">
                                        <p className="text-xs text-muted-foreground truncate">
                                            📚 {enrollment.course?.title}
                                        </p>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-muted-foreground">Progresso</span>
                                                <span className="text-xs font-medium">{enrollment.progress}%</span>
                                            </div>
                                            <Progress value={enrollment.progress} className="h-1.5" />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Iniciado em {formatDate(enrollment.startedAt)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </motion.div>

                    {/* Desktop List View */}
                    <motion.div variants={item} className="hidden md:block">
                        <Card>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {filteredEnrollments.map((enrollment) => (
                                        <div
                                            key={enrollment._id}
                                            className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                                        >
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={enrollment.user?.imageUrl || undefined} />
                                                <AvatarFallback>
                                                    {enrollment.user?.firstName?.[0]}{enrollment.user?.lastName?.[0]}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">
                                                        {enrollment.user?.firstName} {enrollment.user?.lastName}
                                                    </p>
                                                    {enrollment.completedAt && (
                                                        <Badge className="bg-emerald-500">Concluído</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {enrollment.user?.email}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {enrollment.course?.title}
                                                </p>
                                            </div>

                                            <div className="w-32">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm text-muted-foreground">Progresso</span>
                                                    <span className="text-sm font-medium">{enrollment.progress}%</span>
                                                </div>
                                                <Progress value={enrollment.progress} className="h-2" />
                                            </div>

                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">Iniciado em</p>
                                                <p className="text-sm">{formatDate(enrollment.startedAt)}</p>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/professor/students/${enrollment.userId}/course/${enrollment.courseId}`} className="gap-2 flex items-center cursor-pointer">
                                                            <Eye className="h-4 w-4" />
                                                            Ver progresso
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2">
                                                        <Mail className="h-4 w-4" />
                                                        Enviar mensagem
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
}
