"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { redirect, usePathname } from "next/navigation";
import { Sidebar, type UserRole } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { StaticDataProvider } from "@/components/providers/static-data-provider";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isSignedIn, isLoaded } = useAuth();
    const { user: clerkUser } = useUser();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loadingTimeout, setLoadingTimeout] = useState(false);

    // Usa hook otimizado com cache
    const { user: convexUser, isLoading: userLoading } = useCurrentUser();

    // Default to student if not loaded yet
    const userRole: UserRole = (convexUser?.role as UserRole) || "student";

    // Timeout de segurança para evitar loading infinito (10 segundos)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (userLoading) {
                console.warn("[DashboardLayout] Timeout de carregamento do usuário - continuando com role padrão");
                setLoadingTimeout(true);
            }
        }, 10000);

        return () => clearTimeout(timer);
    }, [userLoading]);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            redirect("/sign-in");
        }
    }, [isLoaded, isSignedIn]);

    // Redirect to setup if user doesn't exist in Convex
    useEffect(() => {
        // Wait for queries to load
        if (!isLoaded || !clerkUser) return;
        if (userLoading && !loadingTimeout) return; // Still loading

        // If user exists in Clerk but not in Convex, redirect to setup
        if (convexUser === null && pathname !== "/setup") {
            redirect("/setup");
        }
    }, [isLoaded, clerkUser, convexUser, userLoading, pathname, loadingTimeout]);

    // Mostra loading enquanto Clerk ou Convex ainda estão carregando (com timeout)
    if (!isLoaded || (userLoading && !loadingTimeout)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-xl gradient-bg flex items-center justify-center animate-pulse">
                        <svg
                            className="h-7 w-7 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 14l9-5-9-5-9 5 9 5z"
                            />
                        </svg>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                        <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                    </div>
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <StaticDataProvider>
            <div className="min-h-screen bg-background">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block">
                    <Sidebar role={userRole} />
                </div>

                {/* Mobile Sidebar */}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetContent side="left" className="p-0 w-[280px]">
                        <Sidebar role={userRole} isMobile={true} />
                    </SheetContent>
                </Sheet>

                {/* Main Content */}
                <div className={cn(
                    "transition-all duration-300",
                    "lg:ml-[280px]",
                    sidebarCollapsed && "lg:ml-[80px]"
                )}>
                    <Header
                        showMenuButton
                        onMenuClick={() => setMobileOpen(true)}
                    />

                    <motion.main
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-4 md:p-6 lg:p-8"
                    >
                        {children}
                    </motion.main>
                </div>
            </div>
        </StaticDataProvider>
    );
}
