"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
    Clock,
    Users,
    BookOpen,
    GraduationCap,
    Play,
    ArrowRight,
    Search,
    Lock,
    Globe,
    ShoppingCart,
    AlertCircle
} from "lucide-react";
import { useState } from "react";

const levelLabels: Record<string, string> = {
    beginner: "Iniciante",
    intermediate: "Intermediário",
    advanced: "Avançado",
};

const levelColors: Record<string, string> = {
    beginner: "bg-emerald-500",
    intermediate: "bg-amber-500",
    advanced: "bg-rose-500",
};

export default function OrganizationPublicPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const [searchTerm, setSearchTerm] = useState("");

    const organization = useQuery(api.organizations.getPublicBySlug, { slug });
    const courses = useQuery(api.courses.getPublicCoursesByOrganization, { organizationSlug: slug });

    const filteredCourses = courses?.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const publicCourses = filteredCourses?.filter(c => c.isPublic);
    const privateCourses = filteredCourses?.filter(c => !c.isPublic);

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}min`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}min`;
    };

    const handleCourseClick = (course: any) => {
        if (course.isPublic) {
            // Curso público - vai para a página de visualização
            router.push(`/courses/${course.slug}`);
        } else {
            // Curso privado - vai para checkout/login
            router.push(`/sign-up?redirect=/checkout/${course.slug}`);
        }
    };

    // Loading
    if (organization === undefined) {
        return (
            <div className="min-h-screen bg-background">
                <header className="border-b py-6">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-16 w-16 rounded-xl" />
                            <div>
                                <Skeleton className="h-8 w-48 mb-2" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    </div>
                </header>
                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i} className="overflow-hidden">
                                <Skeleton className="h-48 w-full" />
                                <CardHeader>
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Not found
    if (organization === null) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Organização não encontrada</h1>
                    <p className="text-muted-foreground mb-6">
                        Esta organização não existe ou não está disponível.
                    </p>
                    <Link href="/courses">
                        <Button>Ver todos os cursos</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const primaryColor = organization.primaryColor || "#6366F1";

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            {/* Header */}
            <header
                className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50"
                style={{ borderColor: `${primaryColor}20` }}
            >
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {organization.logo ? (
                            <Image
                                src={organization.logo}
                                alt={organization.name}
                                width={48}
                                height={48}
                                className="rounded-xl"
                            />
                        ) : (
                            <div
                                className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {organization.name.charAt(0)}
                            </div>
                        )}
                        <span className="text-xl font-bold">{organization.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/sign-in">
                            <Button variant="ghost">Entrar</Button>
                        </Link>
                        <Link href="/sign-up">
                            <Button
                                style={{ backgroundColor: primaryColor }}
                                className="border-0 text-white hover:opacity-90"
                            >
                                Cadastrar
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section
                className="py-16 px-4"
                style={{
                    background: `linear-gradient(135deg, ${primaryColor}10 0%, transparent 50%)`
                }}
            >
                <div className="container mx-auto text-center max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {organization.logo && (
                            <Image
                                src={organization.logo}
                                alt={organization.name}
                                width={100}
                                height={100}
                                className="mx-auto rounded-2xl mb-6 shadow-lg"
                            />
                        )}
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Cursos da <span style={{ color: primaryColor }}>{organization.name}</span>
                        </h1>
                        <p className="text-lg text-muted-foreground mb-8">
                            Explore nossos cursos e desenvolva novas habilidades
                        </p>

                        {/* Search */}
                        <div className="relative max-w-xl mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Buscar cursos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 h-14 text-lg rounded-2xl border-2"
                                style={{
                                    borderColor: searchTerm ? primaryColor : undefined,
                                }}
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Courses Grid */}
            <section className="py-8 px-4 pb-20">
                <div className="container mx-auto">
                    {!courses ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <Card key={i} className="overflow-hidden">
                                    <Skeleton className="h-48 w-full" />
                                    <CardHeader>
                                        <Skeleton className="h-6 w-3/4" />
                                        <Skeleton className="h-4 w-full" />
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    ) : filteredCourses?.length === 0 ? (
                        <div className="text-center py-20">
                            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Nenhum curso encontrado</h3>
                            <p className="text-muted-foreground">
                                {searchTerm
                                    ? "Tente buscar por outros termos"
                                    : "Não há cursos disponíveis no momento"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-muted-foreground">
                                    {filteredCourses?.length} {filteredCourses?.length === 1 ? "curso" : "cursos"}
                                </p>
                                <div className="flex gap-2">
                                    {publicCourses && publicCourses.length > 0 && (
                                        <Badge variant="outline" className="gap-1">
                                            <Globe className="h-3 w-3" />
                                            {publicCourses.length} gratuito{publicCourses.length !== 1 && "s"}
                                        </Badge>
                                    )}
                                    {privateCourses && privateCourses.length > 0 && (
                                        <Badge variant="outline" className="gap-1">
                                            <Lock className="h-3 w-3" />
                                            {privateCourses.length} premium
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredCourses?.map((course, index) => (
                                    <motion.div
                                        key={course._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                    >
                                        <Card
                                            className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 h-full flex flex-col cursor-pointer"
                                            onClick={() => handleCourseClick(course)}
                                        >
                                            {/* Thumbnail */}
                                            <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                                                {course.thumbnail ? (
                                                    <Image
                                                        src={course.thumbnail}
                                                        alt={course.title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <BookOpen className="h-16 w-16 text-primary/30" />
                                                    </div>
                                                )}
                                                {/* Play/Lock overlay */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center">
                                                        {course.isPublic ? (
                                                            <Play className="h-8 w-8 text-primary fill-primary ml-1" />
                                                        ) : (
                                                            <ShoppingCart className="h-7 w-7" style={{ color: primaryColor }} />
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Level badge */}
                                                <Badge
                                                    className={`absolute top-3 left-3 ${course.level ? levelColors[course.level] : "bg-gray-500"} border-0 text-white`}
                                                >
                                                    {course.level ? levelLabels[course.level] : "Nível não definido"}
                                                </Badge>
                                                {/* Public/Private indicator */}
                                                <div className="absolute top-3 right-3">
                                                    {course.isPublic ? (
                                                        <Badge className="bg-emerald-500 border-0 text-white gap-1">
                                                            <Globe className="h-3 w-3" />
                                                            Grátis
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="gap-1">
                                                            <Lock className="h-3 w-3" />
                                                            Premium
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <CardHeader className="flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {course.category}
                                                    </Badge>
                                                    {course.price ? (
                                                        <span
                                                            className="text-lg font-bold"
                                                            style={{ color: primaryColor }}
                                                        >
                                                            R$ {course.price.toFixed(2)}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                                                    {course.title}
                                                </CardTitle>
                                                <CardDescription className="line-clamp-2">
                                                    {course.description}
                                                </CardDescription>
                                            </CardHeader>

                                            <CardContent className="pt-0">
                                                {/* Instructor */}
                                                {course.instructor && (
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={course.instructor.imageUrl} />
                                                            <AvatarFallback className="text-xs">
                                                                {course.instructor.firstName?.[0]}
                                                                {course.instructor.lastName?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm text-muted-foreground">
                                                            {course.instructor.firstName} {course.instructor.lastName}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Stats */}
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4" />
                                                        <span>{formatDuration(course.duration)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <BookOpen className="h-4 w-4" />
                                                        <span>{course.lessonCount} aulas</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Users className="h-4 w-4" />
                                                        <span>{course.enrollmentCount}</span>
                                                    </div>
                                                </div>
                                            </CardContent>

                                            <CardFooter className="pt-0">
                                                <Button
                                                    className="w-full gap-2 transition-all"
                                                    style={course.isPublic ? {} : { backgroundColor: primaryColor }}
                                                    variant={course.isPublic ? "default" : "default"}
                                                >
                                                    {course.isPublic ? (
                                                        <>
                                                            Ver Curso
                                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ShoppingCart className="h-4 w-4" />
                                                            Adquirir Curso
                                                        </>
                                                    )}
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-8 bg-muted/30">
                <div className="container mx-auto px-4 text-center text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} {organization.name}. Todos os direitos reservados.</p>
                    <Link href="/courses" className="text-sm hover:underline mt-2 inline-block">
                        Ver catálogo geral de cursos
                    </Link>
                </div>
            </footer>
        </div>
    );
}
