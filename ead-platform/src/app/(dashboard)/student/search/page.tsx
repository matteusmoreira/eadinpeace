"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Search,
    BookOpen,
    PlayCircle,
    MessageSquare,
    Loader2,
    CheckCircle2,
    Users,
    Clock,
    Filter,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

export default function SearchPage() {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") || "";

    const [query, setQuery] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [levelFilter, setLevelFilter] = useState("");

    const convexUser = useQuery(api.users.getByClerkId, {
        clerkId: user?.id || ""
    });

    const searchResults = useQuery(
        api.search.globalSearch,
        convexUser?.organizationId && query.length >= 2
            ? { organizationId: convexUser.organizationId, query }
            : "skip"
    );

    const categories = useQuery(
        api.search.getCategories,
        convexUser?.organizationId
            ? { organizationId: convexUser.organizationId }
            : "skip"
    );

    // Update query when URL changes
    useEffect(() => {
        const q = searchParams.get("q");
        if (q) setQuery(q);
    }, [searchParams]);

    if (!convexUser) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const filteredCourses = searchResults?.courses?.filter((course: any) => {
        if (categoryFilter && course.category !== categoryFilter) return false;
        if (levelFilter && course.level !== levelFilter) return false;
        return true;
    }) || [];

    return (
        <div className="space-y-6">
            {/* Search Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Search className="h-6 w-6" />
                        Busca
                    </h1>
                    <p className="text-muted-foreground">
                        {query && searchResults ? (
                            <>
                                {searchResults.totalResults} resultados para &quot;{query}&quot;
                            </>
                        ) : (
                            "Pesquise cursos, aulas e tópicos do fórum"
                        )}
                    </p>
                </div>
            </div>

            {/* Search Input */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Digite sua busca..."
                        className="pl-10"
                    />
                </div>
            </div>

            {/* No Query */}
            {query.length < 2 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Search className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Comece a buscar</h3>
                        <p className="text-muted-foreground text-center">
                            Digite pelo menos 2 caracteres para pesquisar
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Loading */}
            {query.length >= 2 && searchResults === undefined && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {/* Results */}
            {query.length >= 2 && searchResults && (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <TabsList>
                            <TabsTrigger value="all">
                                Todos ({searchResults.totalResults})
                            </TabsTrigger>
                            <TabsTrigger value="courses">
                                Cursos ({searchResults.courses.length})
                            </TabsTrigger>
                            <TabsTrigger value="lessons">
                                Aulas ({searchResults.lessons.length})
                            </TabsTrigger>
                            <TabsTrigger value="topics">
                                Fórum ({searchResults.topics.length})
                            </TabsTrigger>
                        </TabsList>

                        {activeTab === "courses" && (
                            <div className="flex gap-2">
                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Todas</SelectItem>
                                        {categories?.map((cat: any) => (
                                            <SelectItem key={cat.name} value={cat.name}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={levelFilter} onValueChange={setLevelFilter}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Nível" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Todos</SelectItem>
                                        <SelectItem value="beginner">Iniciante</SelectItem>
                                        <SelectItem value="intermediate">Intermediário</SelectItem>
                                        <SelectItem value="advanced">Avançado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* All Results */}
                    <TabsContent value="all" className="space-y-6">
                        {searchResults.totalResults === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <h3 className="text-lg font-medium mb-2">Nenhum resultado encontrado</h3>
                                    <p className="text-muted-foreground text-center">
                                        Tente buscar com outras palavras-chave
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                {searchResults.courses.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-primary" />
                                            Cursos
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {searchResults.courses.slice(0, 4).map((course: any) => (
                                                <CourseCard key={course._id} course={course} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {searchResults.lessons.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <PlayCircle className="h-5 w-5 text-emerald-500" />
                                            Aulas
                                        </h3>
                                        <div className="space-y-3">
                                            {searchResults.lessons.slice(0, 5).map((lesson: any) => (
                                                <LessonCard key={lesson._id} lesson={lesson} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {searchResults.topics.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <MessageSquare className="h-5 w-5 text-purple-500" />
                                            Fórum
                                        </h3>
                                        <div className="space-y-3">
                                            {searchResults.topics.slice(0, 5).map((topic: any) => (
                                                <TopicCard key={topic._id} topic={topic} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </TabsContent>

                    {/* Courses Tab */}
                    <TabsContent value="courses">
                        {filteredCourses.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    <p>Nenhum curso encontrado</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredCourses.map((course: any) => (
                                    <CourseCard key={course._id} course={course} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Lessons Tab */}
                    <TabsContent value="lessons">
                        {searchResults.lessons.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    <PlayCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    <p>Nenhuma aula encontrada</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {searchResults.lessons.map((lesson: any) => (
                                    <LessonCard key={lesson._id} lesson={lesson} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Topics Tab */}
                    <TabsContent value="topics">
                        {searchResults.topics.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    <p>Nenhum tópico encontrado</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {searchResults.topics.map((topic: any) => (
                                    <TopicCard key={topic._id} topic={topic} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}

function CourseCard({ course }: { course: any }) {
    return (
        <Link href={course.url}>
            <motion.div
                whileHover={{ y: -4 }}
                className="h-full"
            >
                <Card className="h-full hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                        {course.thumbnail ? (
                            <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <BookOpen className="h-12 w-12 text-primary/50" />
                            </div>
                        )}
                    </div>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                                {course.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                                {course.level === "beginner" ? "Iniciante" :
                                    course.level === "intermediate" ? "Intermediário" : "Avançado"}
                            </Badge>
                        </div>
                        <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                            {course.description}
                        </CardDescription>
                    </CardHeader>
                </Card>
            </motion.div>
        </Link>
    );
}

function LessonCard({ lesson }: { lesson: any }) {
    return (
        <Link href={lesson.url}>
            <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <PlayCircle className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{lesson.title}</h4>
                            <p className="text-sm text-muted-foreground truncate">
                                {lesson.courseName}
                            </p>
                        </div>
                        {lesson.duration && (
                            <Badge variant="outline" className="text-xs gap-1">
                                <Clock className="h-3 w-3" />
                                {lesson.duration} min
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

function TopicCard({ topic }: { topic: any }) {
    return (
        <Link href={topic.url}>
            <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <MessageSquare className="h-6 w-6 text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                {topic.isSolved && (
                                    <Badge className="text-xs bg-emerald-500 gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Resolvido
                                    </Badge>
                                )}
                            </div>
                            <h4 className="font-medium truncate">{topic.title}</h4>
                            <p className="text-sm text-muted-foreground truncate">
                                por {topic.author} • {topic.replyCount} respostas
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
