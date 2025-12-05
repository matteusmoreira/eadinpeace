"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useRef } from "react";

export function useCurrentUser() {
    const { user: clerkUser, isLoaded } = useUser();
    const syncUser = useMutation(api.users.syncFromClerk);
    const hasSynced = useRef(false);

    const convexUser = useQuery(
        api.users.getByClerkId,
        clerkUser ? { clerkId: clerkUser.id } : "skip"
    );

    // Sync Clerk user data to Convex on login (only basic info, preserving role)
    useEffect(() => {
        // Only sync once per session and only if user exists in Convex
        if (isLoaded && clerkUser && convexUser && !hasSynced.current) {
            hasSynced.current = true;
            syncUser({
                clerkId: clerkUser.id,
                email: clerkUser.emailAddresses[0]?.emailAddress || "",
                firstName: clerkUser.firstName || "",
                lastName: clerkUser.lastName || "",
                imageUrl: clerkUser.imageUrl,
            });
        }
    }, [isLoaded, clerkUser, convexUser, syncUser]);

    return {
        user: convexUser,
        clerkUser,
        isLoading: !isLoaded || convexUser === undefined,
    };
}

export function useUserStats() {
    const { user } = useCurrentUser();

    const stats = useQuery(
        api.users.getStats,
        user ? { userId: user._id } : "skip"
    );

    return stats;
}
