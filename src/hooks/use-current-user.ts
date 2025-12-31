"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useRef, useMemo } from "react";
import { memoryCache, CACHE_TTL, CACHE_KEYS } from "@/lib/cache";
import { useOrganizationState } from "@/components/providers/organization-provider";
import { Id } from "@convex/_generated/dataModel";

export function useCurrentUser() {
    const { user: clerkUser, isLoaded } = useUser();
    const syncUser = useMutation(api.users.syncFromClerk);
    const hasSynced = useRef(false);

    // Tenta obter do cache primeiro para resposta instantânea
    const cachedUser = useMemo(() => {
        if (!clerkUser?.id) return null;
        return memoryCache.get<any>(CACHE_KEYS.currentUser(clerkUser.id));
    }, [clerkUser?.id]);

    const convexUser = useQuery(
        api.users.getByClerkId,
        clerkUser ? { clerkId: clerkUser.id } : "skip"
    );

    // Atualiza cache quando dados chegam
    useEffect(() => {
        if (convexUser && clerkUser?.id) {
            memoryCache.set(
                CACHE_KEYS.currentUser(clerkUser.id),
                convexUser,
                CACHE_TTL.SESSION
            );
        }
    }, [convexUser, clerkUser?.id]);

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

    // Retorna dados do cache enquanto carrega para UX mais fluída
    const user = convexUser ?? cachedUser;

    const organizationContext = useOrganizationState();
    const selectedOrgId = organizationContext?.selectedOrgId;

    // A organização efetiva é a selecionada (se for superadmin) ou a do próprio usuário
    const organizationId = (user?.role === "superadmin" && selectedOrgId)
        ? selectedOrgId
        : (user?.organizationId as Id<"organizations"> | undefined);

    // isLoading é true APENAS quando:
    // 1. Clerk ainda não carregou (isLoaded === false)
    // 2. Clerk carregou, existe clerkUser, mas Convex ainda não retornou (query pendente)
    // Se clerkUser não existir e isLoaded = true, usuário não está logado - não é loading
    // Se convexUser === null, query retornou mas usuário não encontrado - não é loading
    const isQueryPending = clerkUser && convexUser === undefined && cachedUser === null;
    const isLoading = !isLoaded || isQueryPending;

    return {
        user,
        clerkUser,
        isLoading,
        organizationId,
    };
}

export function useUserStats() {
    const { user } = useCurrentUser();

    // Tenta cache primeiro
    const cachedStats = useMemo(() => {
        if (!user?._id) return null;
        return memoryCache.get<any>(CACHE_KEYS.userStats(user._id));
    }, [user?._id]);

    const stats = useQuery(
        api.users.getStats,
        user ? { userId: user._id } : "skip"
    );

    // Atualiza cache
    useEffect(() => {
        if (stats && user?._id) {
            memoryCache.set(
                CACHE_KEYS.userStats(user._id),
                stats,
                CACHE_TTL.MEDIUM
            );
        }
    }, [stats, user?._id]);

    return stats ?? cachedStats;
}
