"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Clock,
    Users,
    BookOpen,
    GraduationCap,
    Play,
    Star,
    ArrowRight,
    Search,
    Grid3X3,
    List
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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

export default function PublicCoursesPage() {
    const courses = useQuery(api.courses.getPublicCourses);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const filteredCourses = courses?.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}min`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}min`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold">EAD</span>
                    </Link>
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

            {/* Hero Section */}
            <section className="py-16 px-4">
                <div className="container mx-auto text-center max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Badge className="mb-4 gradient-bg border-0">Catálogo de Cursos</Badge>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Explore Nossos <span className="text-primary">Cursos Gratuitos</span>
                        </h1>
                        <p className="text-lg text-muted-foreground mb-8">
                            Aprenda novas habilidades com cursos de alta qualidade.
                            Comece gratuitamente e transforme sua carreira.
                        </p>

                        {/* Search */}
                        <div className="relative max-w-xl mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Buscar cursos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 h-14 text-lg rounded-2xl border-2 focus:border-primary"
                            />
                        </div>

                        {/* View Toggle */}
                        <div className="flex justify-center mt-4">
                            <ToggleGroup
                                type="single"
                                value={viewMode}
                                onValueChange={(value) => value && setViewMode(value as "grid" | "list")}
                            >
                                <ToggleGroupItem value="grid" aria-label="Visualização em grade" className="gap-2">
                                    <Grid3X3 className="h-4 w-4" />
                                    Grade
                                </ToggleGroupItem>
                                <ToggleGroupItem value="list" aria-label="Visualização em lista" className="gap-2">
                                    <List className="h-4 w-4" />
                                    Lista
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Courses Grid */}
            <section className="py-8 px-4 pb-20">
                <div className="container mx-auto">
                    {!courses ? (
                        // Loading skeleton
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <Card key={i} className="overflow-hidden">
                                    <Skeleton className="h-48 w-full" />
                                    <CardHeader>
                                        <Skeleton className="h-6 w-3/4" />
                                        <Skeleton className="h-4 w-full" />
                                    </CardHeader>
                                    <CardFooter>
                                        <Skeleton className="h-10 w-full" />
                                    </CardFooter>
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
                                    : "Não há cursos públicos disponíveis no momento"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-muted-foreground mb-6">
                                {filteredCourses?.length} {filteredCourses?.length === 1 ? "curso encontrado" : "cursos encontrados"}
                            </p>
                            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                                {filteredCourses?.map((course, index) => (
                                    <motion.div
                                        key={course._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        <Link href={`/courses/${course.slug}`}>
                                            {viewMode === "grid" ? (
                                                <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 h-full flex flex-col">
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
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center">
                                                                <Play className="h-8 w-8 text-primary fill-primary ml-1" />
                                                            </div>
                                                        </div>
                                                        <Badge className={`absolute top-3 left-3 ${levelColors[course.level]} border-0 text-white`}>
                                                            {levelLabels[course.level]}
                                                        </Badge>
                                                    </div>
                                                    <CardHeader className="flex-1">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <Badge variant="outline" className="text-xs">{course.category}</Badge>
                                                            {course.price ? (
                                                                <span className="text-lg font-bold text-primary">R$ {course.price.toFixed(2)}</span>
                                                            ) : (
                                                                <Badge className="bg-emerald-500 border-0">Grátis</Badge>
                                                            )}
                                                        </div>
                                                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">{course.title}</CardTitle>
                                                        <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="pt-0">
                                                        {course.instructor && (
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={course.instructor.imageUrl} />
                                                                    <AvatarFallback className="text-xs">
                                                                        {course.instructor.firstName?.[0]}{course.instructor.lastName?.[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-sm text-muted-foreground">
                                                                    {course.instructor.firstName} {course.instructor.lastName}
                                                                </span>
                                                            </div>
                                                        )}
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
                                                        <Button className="w-full gap-2 group-hover:gradient-bg group-hover:border-0 transition-all">
                                                            Ver Curso
                                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            ) : (
                                                <Card className="group hover:shadow-lg transition-all duration-300 border hover:border-primary/50">
                                                    <div className="flex flex-col md:flex-row">
                                                        <div className="relative w-full md:w-48 h-40 md:h-auto bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden flex-shrink-0">
                                                            {course.thumbnail ? (
                                                                <Image
                                                                    src={course.thumbnail}
                                                                    alt={course.title}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <BookOpen className="h-10 w-10 text-primary/30" />
                                                                </div>
                                                            )}
                                                            <Badge className={`absolute top-2 left-2 ${levelColors[course.level]} border-0 text-white text-xs`}>
                                                                {levelLabels[course.level]}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex-1 p-4 flex flex-col justify-between">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Badge variant="outline" className="text-xs">{course.category}</Badge>
                                                                    {course.price ? (
                                                                        <span className="text-sm font-bold text-primary">R$ {course.price.toFixed(2)}</span>
                                                                    ) : (
                                                                        <Badge className="bg-emerald-500 border-0 text-xs">Grátis</Badge>
                                                                    )}
                                                                </div>
                                                                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors mb-1">{course.title}</h3>
                                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                    <div className="flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        <span>{formatDuration(course.duration)}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <BookOpen className="h-3 w-3" />
                                                                        <span>{course.lessonCount} aulas</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <Users className="h-3 w-3" />
                                                                        <span>{course.enrollmentCount}</span>
                                                                    </div>
                                                                </div>
                                                                <Button size="sm" className="gap-1 group-hover:gradient-bg group-hover:border-0">
                                                                    Ver
                                                                    <ArrowRight className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            )}
                                        </Link>
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
                    <p>&copy; {new Date().getFullYear()} EAD Platform. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
}
