"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Clock,
    Users,
    BookOpen,
    GraduationCap,
    Play,
    ArrowLeft,
    CheckCircle2,
    Lock,
    FileText,
    ClipboardList,
    Video,
    AlertCircle
} from "lucide-react";

const levelLabels = {
    beginner: "Iniciante",
    intermediate: "Intermediário",
    advanced: "Avançado",
};

const levelColors = {
    beginner: "bg-emerald-500",
    intermediate: "bg-amber-500",
    advanced: "bg-rose-500",
};

export default function PublicCourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const course = useQuery(api.courses.getPublicCourseBySlug, { slug });

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}min`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}min`;
    };

    const totalLessons = course?.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0;
    const freeLessons = course?.modules?.reduce((acc, mod) =>
        acc + (mod.lessons?.filter(l => l.isFree).length || 0), 0) || 0;

    const getLessonIcon = (type: string | undefined, isFree: boolean) => {
        if (!isFree) return <Lock className="h-4 w-4 text-muted-foreground" />;

        switch (type) {
            case "video":
                return <Video className="h-4 w-4 text-primary" />;
            case "text":
                return <FileText className="h-4 w-4 text-purple-500" />;
            case "pdf":
                return <FileText className="h-4 w-4 text-red-500" />;
            case "exam":
                return <ClipboardList className="h-4 w-4 text-amber-500" />;
            default:
                return <Play className="h-4 w-4 text-primary" />;
        }
    };

    if (course === undefined) {
        return (
            <div className="min-h-screen bg-background">
                {/* Header skeleton */}
                <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                    <div className="container mx-auto px-4 py-4">
                        <Skeleton className="h-10 w-32" />
                    </div>
                </header>
                <div className="container mx-auto px-4 py-8">
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-64 w-full rounded-2xl" />
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                        <div>
                            <Skeleton className="h-96 w-full rounded-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (course === null) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Curso não encontrado</h1>
                    <p className="text-muted-foreground mb-6">
                        Este curso não existe ou não está disponível publicamente.
                    </p>
                    <Link href="/courses">
                        <Button>Ver todos os cursos</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/courses">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="/" className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold hidden sm:block">EAD</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/sign-in">
                            <Button variant="ghost">Entrar</Button>
                        </Link>
                        <Link href="/sign-up">
                            <Button className="gradient-bg border-0">Cadastrar</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Hero */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Thumbnail */}
                            <div className="relative h-64 md:h-80 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl overflow-hidden mb-6">
                                {course.thumbnail ? (
                                    <Image
                                        src={course.thumbnail}
                                        alt={course.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <BookOpen className="h-24 w-24 text-primary/30" />
                                    </div>
                                )}
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Badge variant="outline">{course.category}</Badge>
                                <Badge className={`${levelColors[course.level]} border-0 text-white`}>
                                    {levelLabels[course.level]}
                                </Badge>
                                {course.price ? (
                                    <Badge variant="outline" className="text-primary">
                                        R$ {course.price.toFixed(2)}
                                    </Badge>
                                ) : (
                                    <Badge className="bg-emerald-500 border-0">Grátis</Badge>
                                )}
                            </div>

                            {/* Title & Description */}
                            <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
                            <p className="text-lg text-muted-foreground mb-6">{course.description}</p>

                            {/* Instructor */}
                            {course.instructor && (
                                <div className="flex items-center gap-3 mb-6">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={course.instructor.imageUrl} />
                                        <AvatarFallback>
                                            {course.instructor.firstName?.[0]}
                                            {course.instructor.lastName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">
                                            {course.instructor.firstName} {course.instructor.lastName}
                                        </p>
                                        <p className="text-sm text-muted-foreground">Instrutor</p>
                                    </div>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="flex flex-wrap gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <span>{formatDuration(course.duration * 60)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    <span>{totalLessons} aulas</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    <span>{course.enrollmentCount} alunos</span>
                                </div>
                                {freeLessons > 0 && (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        <span>{freeLessons} aulas gratuitas</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <Separator />

                        {/* Course Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <h2 className="text-2xl font-bold mb-4">Conteúdo do Curso</h2>

                            {course.modules?.length === 0 ? (
                                <Card className="bg-muted/50">
                                    <CardContent className="py-8 text-center">
                                        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                                        <p className="text-muted-foreground">
                                            O conteúdo do curso será disponibilizado em breve.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Accordion type="multiple" className="space-y-3">
                                    {course.modules?.map((module, index) => (
                                        <AccordionItem
                                            key={module._id}
                                            value={module._id}
                                            className="border rounded-xl px-4 bg-card"
                                        >
                                            <AccordionTrigger className="hover:no-underline py-4">
                                                <div className="flex items-center gap-3 text-left">
                                                    <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{module.title}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {module.lessons?.length || 0} aulas
                                                        </p>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pb-4">
                                                <div className="space-y-2 mt-2">
                                                    {module.lessons?.map((lesson, lessonIndex) => (
                                                        <div
                                                            key={lesson._id}
                                                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${lesson.isFree
                                                                    ? "bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 cursor-pointer"
                                                                    : "bg-muted/50"
                                                                }`}
                                                        >
                                                            {getLessonIcon(lesson.type, lesson.isFree)}
                                                            <div className="flex-1">
                                                                <p className={`font-medium text-sm ${!lesson.isFree && "text-muted-foreground"}`}>
                                                                    {lesson.title}
                                                                </p>
                                                                {lesson.description && (
                                                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                                                        {lesson.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {lesson.isFree && (
                                                                    <Badge variant="outline" className="text-emerald-600 border-emerald-500 text-xs">
                                                                        Grátis
                                                                    </Badge>
                                                                )}
                                                                <span className="text-xs text-muted-foreground">
                                                                    {formatDuration(lesson.duration)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            )}
                        </motion.div>
                    </div>

                    {/* Sidebar - CTA */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="sticky top-24"
                        >
                            <Card className="overflow-hidden border-2">
                                <div className="h-2 gradient-bg" />
                                <CardHeader className="text-center">
                                    <CardTitle className="text-2xl">
                                        {course.price ? (
                                            <span className="text-primary">R$ {course.price.toFixed(2)}</span>
                                        ) : (
                                            <span className="text-emerald-500">Gratuito</span>
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        Acesse todo o conteúdo do curso
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Link href={`/sign-up?redirect=/student/courses/${course.slug}`}>
                                        <Button size="lg" className="w-full gap-2 gradient-bg border-0 text-lg py-6">
                                            <GraduationCap className="h-5 w-5" />
                                            Matricule-se Gratuitamente
                                        </Button>
                                    </Link>

                                    <p className="text-center text-sm text-muted-foreground">
                                        Já tem uma conta?{" "}
                                        <Link href="/sign-in" className="text-primary hover:underline">
                                            Entrar
                                        </Link>
                                    </p>

                                    <Separator />

                                    {/* Course includes */}
                                    <div className="space-y-3">
                                        <p className="font-semibold text-sm">Este curso inclui:</p>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                <span>{totalLessons} aulas em vídeo</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                <span>Acesso vitalício</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                <span>Certificado de conclusão</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                <span>Material complementar</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                <span>Suporte do instrutor</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Organization */}
                            {course.organization && (
                                <Card className="mt-4">
                                    <CardContent className="py-4">
                                        <div className="flex items-center gap-3">
                                            {course.organization.logo ? (
                                                <Image
                                                    src={course.organization.logo}
                                                    alt={course.organization.name}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-lg"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <GraduationCap className="h-5 w-5 text-primary" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm text-muted-foreground">Oferecido por</p>
                                                <p className="font-medium">{course.organization.name}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t py-8 bg-muted/30 mt-12">
                <div className="container mx-auto px-4 text-center text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} EAD Platform. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
}
