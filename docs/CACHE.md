# Sistema de Cache em Memória

O sistema de cache em memória foi implementado para melhorar a performance e fluidez da aplicação EAD.

## Componentes

### 1. `src/lib/cache.ts`
Utilitário base de cache com TTL configurável.

```typescript
import { memoryCache, CACHE_TTL, CACHE_KEYS } from "@/lib/cache";

// Obter do cache
const data = memoryCache.get<MyType>("my-key");

// Salvar no cache (5 min padrão)
memoryCache.set("my-key", data, CACHE_TTL.MEDIUM);

// Invalidar
memoryCache.invalidate("my-key");
memoryCache.invalidatePattern("categories:"); // por prefixo
```

### 2. `src/hooks/use-cached-query.ts`
Hook para queries com cache stale-while-revalidate.

```typescript
import { useCachedQuery, useCacheInvalidation } from "@/hooks/use-cached-query";

// Retorna dados do cache instantaneamente enquanto atualiza
const data = useCachedQuery(
  api.courses.getAll,
  { organizationId },
  { ttlMs: CACHE_TTL.LONG }
);

// Invalidar após mutation
const invalidate = useCacheInvalidation();
invalidate.pattern("courses:");
```

### 3. `src/components/providers/static-data-provider.tsx`
Provider que pré-carrega dados estáticos frequentes.

```typescript
// Hook para usar dados já cacheados
import { useStaticData, useInvalidateStaticData } from "@/components/providers/static-data-provider";

const { categories, achievements, organizationSettings, isLoading } = useStaticData();

// Invalidar após mutation
const invalidateStatic = useInvalidateStaticData();
invalidateStatic.categories(); // ou .achievements() ou .all()
```

## TTLs Disponíveis

| Constante | Duração | Uso recomendado |
|-----------|---------|-----------------|
| `SHORT` | 30s | Dados que mudam frequentemente |
| `MEDIUM` | 5min | Dados que mudam ocasionalmente (padrão) |
| `LONG` | 30min | Dados que raramente mudam |
| `SESSION` | ∞ | Duração da sessão do usuário |

## Dicas de Performance

1. **Use `useStaticData()` para categorias/achievements** - já estão cacheados globalmente
2. **Invalide após mutations** - sempre chame `invalidateStatic.xxx()` após alterar dados
3. **O Convex já é reativo** - o cache complementa, não substitui
