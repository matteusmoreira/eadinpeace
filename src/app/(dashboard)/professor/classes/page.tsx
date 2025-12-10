"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
    GraduationCap,
    Calendar,
    Settings,
    Loader2,
    BookOpen,
    BarChart3,
    UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
};

export default function ProfessorClassesPage() {
    const { user } = useUser();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Get classes where user is instructor
    const classes = useQuery(api.classes.getByInstructor, {});

    const isLoading = classes === undefined;

    // Filter classes
    const filteredClasses = (classes ?? []).filter((cls: any) => {
        const matchSearch = search === "" ||
            cls.name?.toLowerCase().includes(search.toLowerCase()) ||
            cls.course?.title?.toLowerCase().includes(search.toLowerCase());

        const matchStatus = statusFilter === "all" ||
            (statusFilter === "active" && cls.isActive) ||
            (statusFilter === "inactive" && !cls.isActive);

        return matchSearch && matchStatus;
    });

    // Stats
    const totalClasses = classes?.length ?? 0;
    const activeClasses = classes?.filter((c: any) => c.isActive).length ?? 0;
    const totalStudents = classes?.reduce((acc: number, c: any) => acc + (c.enrolledCount || 0), 0) ?? 0;

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Minhas Turmas</h1>
                    <p className="text-muted-foreground">Gerencie as turmas onde você é professor</p>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{totalClasses}</p>
                                <p className="text-sm text-muted-foreground">Total de Turmas</p>
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
                                <p className="text-3xl font-bold">{activeClasses}</p>
                                <p className="text-sm text-muted-foreground">Turmas Ativas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <GraduationCap className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{totalStudents}</p>
                                <p className="text-sm text-muted-foreground">Total de Alunos</p>
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
                        placeholder="Buscar turma ou curso..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="active">Ativas</SelectItem>
                        <SelectItem value="inactive">Inativas</SelectItem>
                    </SelectContent>
                </Select>
            </motion.div>

            {/* Classes Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredClasses.length === 0 ? (
                <motion.div variants={item} className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                        {search || statusFilter !== "all" ? "Nenhum resultado encontrado" : "Você ainda não tem turmas"}
                    </h3>
                    <p className="text-muted-foreground">
                        {search || statusFilter !== "all"
                            ? "Tente ajustar os filtros"
                            : "Entre em contato com o administrador para ser adicionado como professor de uma turma"}
                    </p>
                </motion.div>
            ) : (
                <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredClasses.map((cls: any) => (
                        <Card key={cls._id} className="hover:shadow-lg transition-all overflow-hidden">
                            {/* Header with course thumbnail */}
                            <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 relative">
                                {cls.course?.thumbnail ? (
                                    <img
                                        src={cls.course.thumbnail}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <BookOpen className="h-12 w-12 text-primary/40" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <Badge variant={cls.isActive ? "default" : "secondary"}>
                                        {cls.isActive ? "Ativa" : "Inativa"}
                                    </Badge>
                                    <Badge variant="outline" className="bg-background/80">
                                        {cls.instructorRole === "main" ? "Principal" : "Auxiliar"}
                                    </Badge>
                                </div>
                            </div>

                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg line-clamp-1">{cls.name}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                        {cls.course?.title}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <GraduationCap className="h-4 w-4" />
                                        {cls.enrolledCount || 0} alunos
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {formatDate(cls.startDate)}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <Link href={`/professor/classes/${cls._id}`} className="flex-1">
                                        <Button variant="outline" className="w-full gap-2">
                                            <Settings className="h-4 w-4" />
                                            Gerenciar
                                        </Button>
                                    </Link>
                                    <Link href={`/professor/classes/${cls._id}/reports`}>
                                        <Button variant="ghost" size="icon">
                                            <BarChart3 className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
}
