/**
 * Sistema de Cache em Memória para Performance
 * 
 * Este módulo implementa um cache em memória com TTL (Time-to-Live)
 * para dados estáticos, complementando o cache automático do Convex.
 */

interface CacheItem<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

// TTLs padrão (em milissegundos)
export const CACHE_TTL = {
    /** 30 segundos - para dados que mudam frequentemente */
    SHORT: 30 * 1000,
    /** 5 minutos - para dados que mudam ocasionalmente */
    MEDIUM: 5 * 60 * 1000,
    /** 30 minutos - para dados que raramente mudam */
    LONG: 30 * 60 * 1000,
    /** Infinito - duração da sessão */
    SESSION: Infinity
} as const;

// Cache storage
const cache = new Map<string, CacheItem<unknown>>();

// Limite máximo de itens no cache (evita vazamento de memória)
const MAX_CACHE_SIZE = 100;

/**
 * Limpa itens expirados do cache
 */
function cleanExpiredItems(): void {
    const now = Date.now();
    for (const [key, item] of cache.entries()) {
        if (item.ttl !== Infinity && now - item.timestamp > item.ttl) {
            cache.delete(key);
        }
    }
}

/**
 * Garante que o cache não exceda o limite máximo
 */
function enforceMaxSize(): void {
    if (cache.size >= MAX_CACHE_SIZE) {
        // Remove os itens mais antigos primeiro
        const entries = Array.from(cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

        const itemsToRemove = entries.slice(0, Math.floor(MAX_CACHE_SIZE * 0.2));
        itemsToRemove.forEach(([key]) => cache.delete(key));
    }
}

export const memoryCache = {
    /**
     * Obtém um item do cache
     * @param key - Chave do item
     * @returns Dados cacheados ou null se expirado/inexistente
     */
    get<T>(key: string): T | null {
        const item = cache.get(key) as CacheItem<T> | undefined;

        if (!item) {
            return null;
        }

        // Verifica se expirou
        if (item.ttl !== Infinity && Date.now() - item.timestamp > item.ttl) {
            cache.delete(key);
            return null;
        }

        return item.data;
    },

    /**
     * Armazena um item no cache
     * @param key - Chave do item
     * @param data - Dados a serem cacheados
     * @param ttlMs - Tempo de vida em milissegundos (padrão: CACHE_TTL.MEDIUM)
     */
    set<T>(key: string, data: T, ttlMs: number = CACHE_TTL.MEDIUM): void {
        // Limpa itens expirados periodicamente
        if (Math.random() < 0.1) {
            cleanExpiredItems();
        }

        enforceMaxSize();

        cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlMs
        });
    },

    /**
     * Invalida (remove) um item específico do cache
     * @param key - Chave do item a ser removido
     */
    invalidate(key: string): void {
        cache.delete(key);
    },

    /**
     * Invalida todos os itens que começam com o padrão especificado
     * @param pattern - Prefixo das chaves a serem removidas
     * @example memoryCache.invalidatePattern("categories:") // Remove todos os caches de categorias
     */
    invalidatePattern(pattern: string): void {
        for (const key of cache.keys()) {
            if (key.startsWith(pattern)) {
                cache.delete(key);
            }
        }
    },

    /**
     * Limpa todo o cache
     */
    clear(): void {
        cache.clear();
    },

    /**
     * Retorna estatísticas do cache (útil para debug)
     */
    getStats(): { size: number; keys: string[] } {
        return {
            size: cache.size,
            keys: Array.from(cache.keys())
        };
    },

    /**
     * Verifica se uma chave existe e está válida no cache
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }
};

// Cache keys helpers - para manter consistência nas chaves
export const CACHE_KEYS = {
    categories: (orgId: string) => `categories:${orgId}`,
    achievements: (orgId: string) => `achievements:${orgId}`,
    organizationSettings: (orgId: string) => `org-settings:${orgId}`,
    currentUser: (clerkId: string) => `current-user:${clerkId}`,
    userStats: (userId: string) => `user-stats:${userId}`,
} as const;
