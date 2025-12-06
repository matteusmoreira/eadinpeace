"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Play,
    BookOpen,
    Clock,
    GraduationCap,
    Loader2,
    ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function StudentContinuePage() {
    const { user } = useUser();

    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get user enrollments
    const enrollments = useQuery(
        api.enrollments.getByUser,
        convexUser?._id ? { userId: convexUser._id } : "skip"
    );

    const isLoading = enrollments === undefined;

    // Get in-progress enrollments (not completed), sorted by last accessed
    const inProgressEnrollments = (enrollments ?? [])
        .filter(e => !e.completedAt && e.progress > 0)
        .sort((a, b) => (b.lastAccessedAt || 0) - (a.lastAccessedAt || 0));

    // Get the last accessed course
    const lastCourse = inProgressEnrollments[0];

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours === 0) return `${mins}min`;
        return `${hours}h ${mins}min`;
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Header */}
            <motion.div variants={item}>
                <h1 className="text-2xl md:text-3xl font-bold">Continuar Estudando</h1>
                <p className="text-muted-foreground">
                    Retome de onde você parou
                </p>
            </motion.div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : !lastCourse ? (
                /* Empty State */
                <motion.div variants={item}>
                    <Card className="text-center py-12">
                        <CardContent>
                            <div className="h-20 w-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                <BookOpen className="h-10 w-10 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">
                                Nenhum curso em andamento
                            </h3>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                Você ainda não começou nenhum curso. Explore nosso catálogo
                                e comece sua jornada de aprendizado!
                            </p>
                            <Link href="/student/courses">
                                <Button className="gap-2">
                                    <GraduationCap className="h-4 w-4" />
                                    Explorar Cursos
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <>
                    {/* Last Accessed Course - Highlighted */}
                    <motion.div variants={item}>
                        <Card className="overflow-hidden bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                            <CardHeader>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    Último acesso: {formatDate(lastCourse.lastAccessedAt)}
                                </div>
                                <CardTitle className="text-2xl">
                                    {lastCourse.course?.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <GraduationCap className="h-4 w-4" />
                                        {lastCourse.course?.instructor?.firstName} {lastCourse.course?.instructor?.lastName}
                                    </span>
                                    <Badge variant="outline">
                                        {lastCourse.course?.lessonCount || 0} aulas
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Progresso do curso</span>
                                        <span className="font-medium">{Math.round(lastCourse.progress)}%</span>
                                    </div>
                                    <Progress value={lastCourse.progress} className="h-3" />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Link href={`/student/courses/${lastCourse.courseId}`} className="flex-1">
                                        <Button className="w-full gap-2" size="lg">
                                            <Play className="h-5 w-5" />
                                            Continuar de onde parei
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Other In-Progress Courses */}
                    {inProgressEnrollments.length > 1 && (
                        <motion.div variants={item} className="space-y-4">
                            <h2 className="text-lg font-semibold">Outros cursos em andamento</h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                {inProgressEnrollments.slice(1).map((enrollment) => (
                                    <Card key={enrollment._id} className="hover:shadow-lg transition-all">
                                        <CardContent className="pt-6">
                                            <div className="flex gap-4">
                                                <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                    {enrollment.course?.thumbnail ? (
                                                        <img
                                                            src={enrollment.course.thumbnail}
                                                            alt=""
                                                            className="h-full w-full object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <GraduationCap className="h-8 w-8 text-primary" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium truncate">
                                                        {enrollment.course?.title}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {Math.round(enrollment.progress)}% concluído
                                                    </p>
                                                    <Progress
                                                        value={enrollment.progress}
                                                        className="h-2 mt-2"
                                                    />
                                                </div>
                                            </div>
                                            <Link href={`/student/courses/${enrollment.courseId}`}>
                                                <Button variant="ghost" size="sm" className="w-full mt-4 gap-2">
                                                    Continuar <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </>
            )}
        </motion.div>
    );
}
