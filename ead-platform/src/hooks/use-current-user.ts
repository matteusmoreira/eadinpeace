"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export function useCurrentUser() {
    const { user: clerkUser, isLoaded } = useUser();
    const upsertUser = useMutation(api.users.upsertFromClerk);

    const convexUser = useQuery(
        api.users.getByClerkId,
        clerkUser ? { clerkId: clerkUser.id } : "skip"
    );

    // Sync Clerk user to Convex on login
    useEffect(() => {
        if (isLoaded && clerkUser) {
            upsertUser({
                clerkId: clerkUser.id,
                email: clerkUser.emailAddresses[0]?.emailAddress || "",
                firstName: clerkUser.firstName || "",
                lastName: clerkUser.lastName || "",
                imageUrl: clerkUser.imageUrl,
            });
        }
    }, [isLoaded, clerkUser, upsertUser]);

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
