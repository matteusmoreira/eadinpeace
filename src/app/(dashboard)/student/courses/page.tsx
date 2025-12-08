"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    BookOpen,
    Search,
    Play,
    Clock,
    Users,
    GraduationCap,
    Star,
    Loader2,
    Filter,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Id } from "@convex/_generated/dataModel";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

const levelLabels = {
    beginner: "Iniciante",
    intermediate: "Intermediário",
    advanced: "Avançado",
};

const levelColors = {
    beginner: "bg-emerald-500/10 text-emerald-600",
    intermediate: "bg-amber-500/10 text-amber-600",
    advanced: "bg-red-500/10 text-red-600",
};

export default function StudentCoursesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [levelFilter, setLevelFilter] = useState("all");
    const { user } = useUser();

    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get user's organization
    const organizationId = convexUser?.organizationId;

    // Get all organizations to get the first one if user has none
    const organizations = useQuery(api.organizations.getAll);
    const effectiveOrgId = organizationId || organizations?.[0]?._id;

    // Get published courses
    const courses = useQuery(
        api.courses.getPublishedByOrganization,
        effectiveOrgId ? { organizationId: effectiveOrgId } : "skip"
    );

    // Get user enrollments
    const enrollments = useQuery(
        api.enrollments.getByUser,
        convexUser?._id ? { userId: convexUser._id } : "skip"
    );

    const enroll = useMutation(api.enrollments.enroll);

    const isLoading = courses === undefined;

    const filteredCourses = (courses || []).filter((course) => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLevel = levelFilter === "all" || course.level === levelFilter;
        return matchesSearch && matchesLevel;
    });

    // Check if user is enrolled in a course
    const isEnrolled = (courseId: Id<"courses">) => {
        return enrollments?.some(e => e.courseId === courseId);
    };

    // Get enrollment progress
    const getEnrollmentProgress = (courseId: Id<"courses">) => {
        const enrollment = enrollments?.find(e => e.courseId === courseId);
        return enrollment?.progress || 0;
    };

    const handleEnroll = async (courseId: Id<"courses">) => {
        if (!convexUser) {
            toast.error("Faça login para se matricular");
            return;
        }

        try {
            await enroll({
                userId: convexUser._id,
                courseId,
            });
            toast.success("Matrícula realizada com sucesso!");
        } catch (error) {
            toast.error("Erro ao realizar matrícula");
        }
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}min`;
        return `${hours}h ${mins}min`;
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item}>
                <h1 className="text-2xl md:text-3xl font-bold">Catálogo de Cursos</h1>
                <p className="text-muted-foreground">Explore e matricule-se nos cursos disponíveis</p>
            </motion.div>

            {/* Search & Filters */}
            <motion.div variants={item} className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar cursos..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Nível" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os níveis</SelectItem>
                        <SelectItem value="beginner">Iniciante</SelectItem>
                        <SelectItem value="intermediate">Intermediário</SelectItem>
                        <SelectItem value="advanced">Avançado</SelectItem>
                    </SelectContent>
                </Select>
            </motion.div>

            {/* Courses Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredCourses.length === 0 ? (
                <motion.div variants={item} className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhum curso encontrado</h3>
                    <p className="text-muted-foreground">
                        {searchQuery ? "Tente buscar por outro termo" : "Novos cursos em breve!"}
                    </p>
                </motion.div>
            ) : (
                <motion.div variants={item} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCourses.map((course) => {
                        const enrolled = isEnrolled(course._id);
                        const progress = getEnrollmentProgress(course._id);

                        return (
                            <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-all group">
                                {/* Thumbnail */}
                                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative">
                                    {course.thumbnail ? (
                                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <GraduationCap className="h-16 w-16 text-primary/30" />
                                        </div>
                                    )}
                                    {enrolled && (
                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80">
                                            <div className="flex items-center justify-between text-white text-sm mb-1">
                                                <span>Progresso</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <Progress value={progress} className="h-1.5" />
                                        </div>
                                    )}
                                </div>

                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className={cn("text-xs", levelColors[course.level])}>
                                            {levelLabels[course.level]}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">{course.category}</span>
                                    </div>
                                    <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                                    <CardDescription className="line-clamp-2">
                                        {course.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {/* Instructor */}
                                    {course.instructor && (
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={course.instructor.imageUrl || undefined} />
                                                <AvatarFallback className="text-xs">
                                                    {course.instructor.firstName?.[0]}{course.instructor.lastName?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm text-muted-foreground">
                                                {course.instructor.firstName} {course.instructor.lastName}
                                            </span>
                                        </div>
                                    )}

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            {formatDuration(course.duration)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="h-3.5 w-3.5" />
                                            {course.lessonCount || 0} aulas
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3.5 w-3.5" />
                                            {course.enrollmentCount || 0}
                                        </span>
                                    </div>

                                    {/* Price & Action */}
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="font-bold text-lg">
                                            {course.price && course.price > 0 ? (
                                                <span>R$ {course.price.toFixed(2)}</span>
                                            ) : (
                                                <Badge className="bg-emerald-500">Grátis</Badge>
                                            )}
                                        </div>

                                        {enrolled ? (
                                            <Link href={`/student/courses/${course._id}`}>
                                                <Button className="gap-2">
                                                    <Play className="h-4 w-4" />
                                                    Continuar
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Button
                                                className="gap-2 gradient-bg border-0"
                                                onClick={() => handleEnroll(course._id)}
                                            >
                                                Matricular-se
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </motion.div>
            )}
        </motion.div>
    );
}
