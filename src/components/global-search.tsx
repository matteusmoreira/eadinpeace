"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    BookOpen,
    PlayCircle,
    MessageSquare,
    Loader2,
    X,
    ArrowRight,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
    const { user } = useUser();
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const convexUser = useQuery(api.users.getByClerkId, {
        clerkId: user?.id || ""
    });

    const searchResults = useQuery(
        api.search.quickSearch,
        convexUser?.organizationId && query.length >= 2
            ? { organizationId: convexUser.organizationId, query }
            : "skip"
    );

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Open dropdown when query changes and has results
    useEffect(() => {
        if (query.length >= 2 && searchResults && searchResults.length > 0) {
            setIsOpen(true);
        }
    }, [query, searchResults]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.length >= 2 && convexUser?.organizationId) {
            router.push(`/student/search?q=${encodeURIComponent(query)}`);
            setIsOpen(false);
            setQuery("");
        }
    };

    const handleResultClick = (url: string) => {
        router.push(url);
        setIsOpen(false);
        setQuery("");
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "course":
                return <BookOpen className="h-4 w-4 text-primary" />;
            case "lesson":
                return <PlayCircle className="h-4 w-4 text-emerald-500" />;
            case "topic":
                return <MessageSquare className="h-4 w-4 text-purple-500" />;
            default:
                return <Search className="h-4 w-4" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "course":
                return "Curso";
            case "lesson":
                return "Aula";
            case "topic":
                return "Fórum";
            default:
                return type;
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <form onSubmit={handleSearch}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => {
                            setIsFocused(true);
                            if (query.length >= 2 && searchResults?.length) {
                                setIsOpen(true);
                            }
                        }}
                        onBlur={() => setIsFocused(false)}
                        placeholder="Buscar cursos, aulas..."
                        className={cn(
                            "w-[250px] md:w-[300px] pl-9 pr-8",
                            "bg-muted/50 border-0",
                            "focus-visible:ring-1 focus-visible:ring-primary",
                            "transition-all duration-200",
                            isFocused && "w-[300px] md:w-[400px]"
                        )}
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery("");
                                setIsOpen(false);
                                inputRef.current?.focus();
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </form>

            <AnimatePresence>
                {isOpen && query.length >= 2 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg overflow-hidden z-50"
                    >
                        {searchResults === undefined ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Nenhum resultado encontrado</p>
                                <p className="text-sm">Tente buscar com outras palavras</p>
                            </div>
                        ) : (
                            <div className="max-h-[400px] overflow-y-auto">
                                {searchResults.map((result: any, index: number) => (
                                    <motion.div
                                        key={result._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handleResultClick(result.url)}
                                        className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors"
                                    >
                                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                            {getIcon(result.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{result.title}</p>
                                            {result.subtitle && (
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {result.subtitle}
                                                </p>
                                            )}
                                        </div>
                                        <Badge variant="secondary" className="text-xs">
                                            {getTypeLabel(result.type)}
                                        </Badge>
                                    </motion.div>
                                ))}

                                <Link href={`/student/search?q=${encodeURIComponent(query)}`}>
                                    <div className="flex items-center justify-center gap-2 p-3 border-t text-primary hover:bg-muted transition-colors">
                                        <span className="text-sm font-medium">Ver todos os resultados</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
