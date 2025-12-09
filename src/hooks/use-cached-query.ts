"use client";

import { useQuery } from "convex/react";
import { FunctionReference, FunctionReturnType } from "convex/server";
import { useRef, useEffect, useMemo } from "react";
import { memoryCache, CACHE_TTL } from "@/lib/cache";

interface UseCachedQueryOptions {
    /** Chave única para o cache. Se não fornecida, será gerada automaticamente */
    cacheKey?: string;
    /** Tempo de vida do cache em ms (padrão: 5 minutos) */
    ttlMs?: number;
    /** Se false, a query não será executada */
    enabled?: boolean;
    /** Se true, sempre retorna do cache primeiro (stale-while-revalidate) */
    staleWhileRevalidate?: boolean;
}

/**
 * Hook que combina useQuery do Convex com cache em memória.
 * 
 * Fornece dados instantâneos do cache enquanto revalida no servidor,
 * resultando em uma UX mais fluída e responsiva.
 * 
 * @example
 * const categories = useCachedQuery(
 *   api.categories.getAll,
 *   { organizationId },
 *   { cacheKey: `categories:${organizationId}`, ttlMs: CACHE_TTL.LONG }
 * );
 */
export function useCachedQuery<Query extends FunctionReference<"query">>(
    query: Query,
    args: Query["_args"] | "skip",
    options: UseCachedQueryOptions = {}
): FunctionReturnType<Query> | undefined {
    const {
        cacheKey,
        ttlMs = CACHE_TTL.MEDIUM,
        enabled = true,
        staleWhileRevalidate = true
    } = options;

    // Gera chave de cache baseada no nome da query e args
    const generatedKey = useMemo(() => {
        if (cacheKey) return cacheKey;
        if (args === "skip") return null;

        const queryName = (query as any)._name || "unknown";
        return `query:${queryName}:${JSON.stringify(args)}`;
    }, [cacheKey, query, args]);

    // Referência para o último valor válido
    const lastValidData = useRef<FunctionReturnType<Query> | undefined>(undefined);

    // Tenta obter do cache primeiro
    const cachedData = useMemo(() => {
        if (!generatedKey || !enabled) return undefined;
        return memoryCache.get<FunctionReturnType<Query>>(generatedKey);
    }, [generatedKey, enabled]);

    // Query do Convex - usa any para contornar tipagem complexa do Convex
    const queryResult = useQuery(
        query,
        (enabled && args !== "skip" ? args : "skip") as any
    ) as FunctionReturnType<Query> | undefined;

    // Atualiza o cache quando recebe novos dados
    useEffect(() => {
        if (queryResult !== undefined && generatedKey) {
            memoryCache.set(generatedKey, queryResult, ttlMs);
            lastValidData.current = queryResult;
        }
    }, [queryResult, generatedKey, ttlMs]);

    // Se não está habilitado, retorna undefined
    if (!enabled) {
        return undefined;
    }

    // Stale-while-revalidate: retorna dados do cache enquanto atualiza
    if (staleWhileRevalidate) {
        // Prioridade: dados frescos > cache > último valor válido
        if (queryResult !== undefined) {
            return queryResult;
        }
        if (cachedData !== null) {
            return cachedData;
        }
        return lastValidData.current;
    }

    // Sem stale-while-revalidate: retorna apenas dados frescos ou cache válido
    return queryResult ?? cachedData ?? undefined;
}

/**
 * Hook auxiliar para invalidar cache após mutations
 * 
 * @example
 * const invalidate = useCacheInvalidation();
 * 
 * const handleUpdate = async () => {
 *   await updateCategory({ ... });
 *   invalidate.pattern("categories:");
 * };
 */
export function useCacheInvalidation() {
    return {
        /** Invalida uma chave específica */
        key: (key: string) => memoryCache.invalidate(key),
        /** Invalida todas as chaves que começam com o padrão */
        pattern: (pattern: string) => memoryCache.invalidatePattern(pattern),
        /** Limpa todo o cache */
        all: () => memoryCache.clear()
    };
}
