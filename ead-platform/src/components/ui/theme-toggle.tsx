"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative overflow-hidden hover:bg-secondary/80 transition-colors"
                >
                    <AnimatePresence mode="wait" initial={false}>
                        {theme === "light" && (
                            <motion.div
                                key="sun"
                                initial={{ y: -20, opacity: 0, rotate: -90 }}
                                animate={{ y: 0, opacity: 1, rotate: 0 }}
                                exit={{ y: 20, opacity: 0, rotate: 90 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Sun className="h-[1.2rem] w-[1.2rem] text-amber-500" />
                            </motion.div>
                        )}
                        {theme === "dark" && (
                            <motion.div
                                key="moon"
                                initial={{ y: -20, opacity: 0, rotate: -90 }}
                                animate={{ y: 0, opacity: 1, rotate: 0 }}
                                exit={{ y: 20, opacity: 0, rotate: 90 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Moon className="h-[1.2rem] w-[1.2rem] text-indigo-400" />
                            </motion.div>
                        )}
                        {theme === "system" && (
                            <motion.div
                                key="system"
                                initial={{ y: -20, opacity: 0, rotate: -90 }}
                                animate={{ y: 0, opacity: 1, rotate: 0 }}
                                exit={{ y: 20, opacity: 0, rotate: 90 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Monitor className="h-[1.2rem] w-[1.2rem] text-muted-foreground" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <span className="sr-only">Alternar tema</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
                <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <Sun className="h-4 w-4 text-amber-500" />
                    <span>Claro</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <Moon className="h-4 w-4 text-indigo-400" />
                    <span>Escuro</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span>Sistema</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
