"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@convex/_generated/dataModel";

interface FollowButtonProps {
    userId: Id<"users">;
    isFollowing: boolean;
    onToggle: () => Promise<void>;
    size?: "default" | "sm" | "lg";
    variant?: "default" | "outline";
    className?: string;
}

export function FollowButton({
    userId,
    isFollowing: initialIsFollowing,
    onToggle,
    size = "default",
    variant = "default",
    className,
}: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isLoading, setIsLoading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = async () => {
        if (isLoading) return;
        setIsLoading(true);

        // Optimistic update
        setIsFollowing(!isFollowing);

        try {
            await onToggle();
        } catch {
            setIsFollowing(isFollowing);
        } finally {
            setIsLoading(false);
        }
    };

    if (isFollowing) {
        return (
            <Button
                variant="outline"
                size={size}
                onClick={handleClick}
                disabled={isLoading}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                    "gap-2 transition-colors",
                    isHovered && "border-destructive text-destructive hover:bg-destructive/10",
                    className
                )}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : isHovered ? (
                    <>
                        <UserMinus className="h-4 w-4" />
                        Deixar de Seguir
                    </>
                ) : (
                    <>
                        <UserPlus className="h-4 w-4" />
                        Seguindo
                    </>
                )}
            </Button>
        );
    }

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            disabled={isLoading}
            className={cn("gap-2 gradient-bg border-0", className)}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <>
                    <UserPlus className="h-4 w-4" />
                    Seguir
                </>
            )}
        </Button>
    );
}
