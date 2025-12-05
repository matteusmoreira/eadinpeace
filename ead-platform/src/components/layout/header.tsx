"use client";

import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserButton, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications";
import { GlobalSearch } from "@/components/global-search";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import Link from "next/link";

interface HeaderProps {
    onMenuClick?: () => void;
    showMenuButton?: boolean;
}

export function Header({ onMenuClick, showMenuButton = false }: HeaderProps) {
    const { user } = useUser();

    // Get Convex user to access userId for notifications
    const convexUser = useQuery(api.users.getByClerkId, {
        clerkId: user?.id || ""
    });

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

                {/* Global Search */}
                <div className="hidden md:block">
                    <GlobalSearch />
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
                {/* Search button mobile */}
                <Link href="/student/search">
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Search className="h-5 w-5" />
                    </Button>
                </Link>

                {/* Theme toggle */}
                <ThemeToggle />

                {/* Notifications - Real time from Convex */}
                {convexUser && (
                    <NotificationBell userId={convexUser._id} />
                )}

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
