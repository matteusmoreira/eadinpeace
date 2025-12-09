"use client";

import React, { createContext, useContext, useMemo, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/use-current-user";
import { memoryCache, CACHE_TTL, CACHE_KEYS } from "@/lib/cache";

// Tipos para os dados estáticos
interface Category {
    _id: Id<"courseCategories">;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    order: number;
    isActive: boolean;
}

interface Achievement {
    _id: Id<"achievements">;
    name: string;
    description: string;
    icon: string;
    type: "course_complete" | "streak" | "time_spent" | "first_lesson" | "top_student";
    requirement: number;
    points: number;
}

interface OrganizationSettings {
    _id: Id<"organizationSettings">;
    bunnyEnabled?: boolean;
    bunnyLibraryId?: string;
    bunnyCdnHostname?: string;
}

interface StaticDataContextValue {
    categories: Category[];
    achievements: Achievement[];
    organizationSettings: OrganizationSettings | null;
    isLoading: boolean;
    organizationId: Id<"organizations"> | null;
}

const StaticDataContext = createContext<StaticDataContextValue | null>(null);

interface StaticDataProviderProps {
    children: ReactNode;
}

/**
 * Provider que pré-carrega e cacheia dados estáticos frequentemente usados.
 * 
 * Dados incluídos:
 * - Categorias de cursos
 * - Conquistas/Achievements
 * - Configurações da organização
 * 
 * @example
 * // No layout principal
 * <StaticDataProvider>
 *   {children}
 * </StaticDataProvider>
 * 
 * // Em qualquer componente filho
 * const { categories, isLoading } = useStaticData();
 */
export function StaticDataProvider({ children }: StaticDataProviderProps) {
    const { user, isLoading: userLoading } = useCurrentUser();
    const organizationId = user?.organizationId as Id<"organizations"> | undefined;

    // Busca categorias
    const categoriesQuery = useQuery(
        api.categories.getByOrganization,
        organizationId ? { organizationId } : "skip"
    );

    // Busca achievements (global, não por organização)
    const achievementsQuery = useQuery(
        api.gamification.getAll,
        {}
    );

    // Busca configurações da organização
    const settingsQuery = useQuery(
        api.organizationSettings.getSettings,
        organizationId ? { organizationId } : "skip"
    );

    // Atualiza cache quando dados chegam
    const categories = useMemo(() => {
        if (categoriesQuery && organizationId) {
            const key = CACHE_KEYS.categories(organizationId);
            memoryCache.set(key, categoriesQuery, CACHE_TTL.LONG);
        }

        // Tenta cache se query ainda carregando
        if (categoriesQuery === undefined && organizationId) {
            const cached = memoryCache.get<Category[]>(CACHE_KEYS.categories(organizationId));
            if (cached) return cached;
        }

        return (categoriesQuery as Category[]) || [];
    }, [categoriesQuery, organizationId]);

    const achievements = useMemo(() => {
        if (achievementsQuery && organizationId) {
            const key = CACHE_KEYS.achievements(organizationId);
            memoryCache.set(key, achievementsQuery, CACHE_TTL.LONG);
        }

        if (achievementsQuery === undefined && organizationId) {
            const cached = memoryCache.get<Achievement[]>(CACHE_KEYS.achievements(organizationId));
            if (cached) return cached;
        }

        return (achievementsQuery as Achievement[]) || [];
    }, [achievementsQuery, organizationId]);

    const organizationSettings = useMemo(() => {
        if (settingsQuery && organizationId) {
            const key = CACHE_KEYS.organizationSettings(organizationId);
            memoryCache.set(key, settingsQuery, CACHE_TTL.LONG);
        }

        if (settingsQuery === undefined && organizationId) {
            const cached = memoryCache.get<OrganizationSettings>(CACHE_KEYS.organizationSettings(organizationId));
            if (cached) return cached;
        }

        return (settingsQuery as OrganizationSettings) || null;
    }, [settingsQuery, organizationId]);

    const isLoading = userLoading ||
        (organizationId !== undefined && (
            categoriesQuery === undefined ||
            achievementsQuery === undefined ||
            settingsQuery === undefined
        ));

    const value: StaticDataContextValue = {
        categories,
        achievements,
        organizationSettings,
        isLoading,
        organizationId: organizationId || null
    };

    return (
        <StaticDataContext.Provider value={value}>
            {children}
        </StaticDataContext.Provider>
    );
}

/**
 * Hook para acessar dados estáticos cacheados.
 * 
 * @example
 * const { categories, achievements, isLoading } = useStaticData();
 * 
 * if (isLoading) return <Spinner />;
 * 
 * return categories.map(cat => <CategoryCard key={cat._id} {...cat} />);
 */
export function useStaticData(): StaticDataContextValue {
    const context = useContext(StaticDataContext);

    if (!context) {
        // Se não está dentro do provider, retorna valores vazios
        // Isso permite uso flexível em componentes que podem estar fora do provider
        return {
            categories: [],
            achievements: [],
            organizationSettings: null,
            isLoading: true,
            organizationId: null
        };
    }

    return context;
}

/**
 * Hook para invalidar cache de dados estáticos após mutations.
 * 
 * @example
 * const invalidateStatic = useInvalidateStaticData();
 * 
 * const handleCreateCategory = async () => {
 *   await createCategory({ ... });
 *   invalidateStatic.categories();
 * };
 */
export function useInvalidateStaticData() {
    const { organizationId } = useStaticData();

    return {
        categories: () => {
            if (organizationId) {
                memoryCache.invalidate(CACHE_KEYS.categories(organizationId));
            }
        },
        achievements: () => {
            if (organizationId) {
                memoryCache.invalidate(CACHE_KEYS.achievements(organizationId));
            }
        },
        organizationSettings: () => {
            if (organizationId) {
                memoryCache.invalidate(CACHE_KEYS.organizationSettings(organizationId));
            }
        },
        all: () => {
            if (organizationId) {
                memoryCache.invalidate(CACHE_KEYS.categories(organizationId));
                memoryCache.invalidate(CACHE_KEYS.achievements(organizationId));
                memoryCache.invalidate(CACHE_KEYS.organizationSettings(organizationId));
            }
        }
    };
}
