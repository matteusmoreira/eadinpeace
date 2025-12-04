"use client";

import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserButton, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HeaderProps {
    onMenuClick?: () => void;
    showMenuButton?: boolean;
}

export function Header({ onMenuClick, showMenuButton = false }: HeaderProps) {
    const { user } = useUser();

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "sticky top-0 z-30 h-16 border-b border-border",
                "bg-background/80 backdrop-blur-md",
                "flex items-center justify-between px-4 md:px-6"
            )}
        >
            {/* Left side */}
            <div className="flex items-center gap-4">
                {showMenuButton && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={onMenuClick}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                )}

                {/* Search */}
                <div className="hidden md:flex items-center relative">
                    <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar cursos, módulos..."
                        className="w-[300px] pl-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
                {/* Search button mobile */}
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Search className="h-5 w-5" />
                </Button>

                {/* Theme toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            <Badge
                                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                                variant="destructive"
                            >
                                3
                            </Badge>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel className="flex items-center justify-between">
                            <span>Notificações</span>
                            <Badge variant="secondary">3 novas</Badge>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                                <span className="font-medium text-sm">Novo curso disponível</span>
                            </div>
                            <span className="text-xs text-muted-foreground pl-4">
                                O curso &quot;Next.js Avançado&quot; foi adicionado
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                                <span className="font-medium text-sm">Certificado pronto</span>
                            </div>
                            <span className="text-xs text-muted-foreground pl-4">
                                Seu certificado do curso React está disponível
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="font-medium text-sm">Parabéns!</span>
                            </div>
                            <span className="text-xs text-muted-foreground pl-4">
                                Você completou 50% do seu progresso mensal
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="justify-center text-primary cursor-pointer">
                            Ver todas as notificações
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* User */}
                <div className="ml-2">
                    <UserButton
                        afterSignOutUrl="/sign-in"
                        appearance={{
                            elements: {
                                avatarBox: "h-9 w-9",
                            },
                        }}
                    />
                </div>
            </div>
        </motion.header>
    );
}
