---
description: Plano de Desenvolvimento - Correções e Novas Funcionalidades
---

# 📋 PLANO DE DESENVOLVIMENTO - EAD INPEACE

## 📌 RESUMO EXECUTIVO

Este documento contém o plano de desenvolvimento detalhado para correções e novas funcionalidades do sistema EAD InPeace.

---

# 🔧 1. CORREÇÃO: Menu Lateral (Sidebar) Responsivo

## Problema
O menu lateral está ultrapassando a tela na parte inferior em telas menores.

## Análise
- **Arquivo:** `src/components/layout/sidebar.tsx`
- **Causa:** O sidebar usa `h-screen` (altura de 100vh) mas não considera o overflow do conteúdo interno
- **Elementos problemáticos:** 
  - `ScrollArea` não ajustada corretamente
  - `User Profile` no final não está contido no scroll

## Solução Proposta

### Tarefa 1.1: Ajustar CSS do Sidebar
```
1. Modificar estrutura do sidebar para usar flexbox corretamente
2. Garantir que ScrollArea use flex-1 e overflow-hidden
3. Ajustar o container do User Profile para ficar fixo no fundo
4. Adicionar max-height e overflow corretos
```

### Código a Modificar:
```tsx
// Linha 236-239: Modificar classes do aside
className={cn(
    "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar",
    "flex flex-col shadow-lg overflow-hidden" // Adicionar overflow-hidden
)}

// Linha 301: Ajustar ScrollArea
<ScrollArea className="flex-1 py-4 overflow-y-auto"> // Garantir scroll interno

// Linha 373: Ajustar user profile container
<div className="p-3 shrink-0 border-t border-sidebar-border"> // Adicionar shrink-0 e border-t
```

### Estimativa: 30 minutos

---

# 🔧 2. CORREÇÃO: Edição de Usuário pelo Superadmin

## Problema
Ao clicar em "Editar" na lista de usuários (`/superadmin/users`), não há página de edição.

## Análise
- O link aponta para `/superadmin/users/${user._id}` (L316)
- **Diretório existe:** `src/app/(dashboard)/superadmin/users/`
- **Página de edição:** NÃO EXISTE (só existe `/new`)

## Solução Proposta

### Tarefa 2.1: Criar página de edição de usuário
```
Caminho: src/app/(dashboard)/superadmin/users/[id]/page.tsx
```

### Funcionalidades:
- Carregar dados do usuário pelo ID
- Form com campos: firstName, lastName, email (readonly), role, organizationId, isActive
- Usar mutation `users.update` (já existe em convex/users.ts L223-251)
- Validação e feedback visual
- Botão de voltar

### Estrutura do Componente:
```tsx
"use client";

// Imports necessários
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

export default function EditUserPage() {
    const params = useParams();
    const userId = params.id as Id<"users">;
    
    const user = useQuery(api.users.getById, { userId });
    const organizations = useQuery(api.organizations.getAll);
    const updateUser = useMutation(api.users.update);
    
    // State para form
    // handleSubmit
    // UI com Card, Form, Select (role, organization), Switch (isActive)
}
```

### Estimativa: 1 hora

---

# 🔧 3. CORREÇÃO: Página de Planos (`/superadmin/plans`)

## Problema
Não é possível criar, editar ou excluir planos. Os planos estão hardcoded no componente.

## Análise
- **Arquivo:** `src/app/(dashboard)/superadmin/plans/page.tsx`
- **Linha 46-118:** Planos definidos como array estático (mock data)
- **Tabela:** `subscriptionPlans` existe no schema (L282-293)
- **Mutations:** NÃO EXISTEM no convex para gerenciar planos

## Solução Proposta

### Tarefa 3.1: Criar mutations no Convex
```
Arquivo: convex/plans.ts (NOVO)

Funções necessárias:
- getAll: query - listar todos os planos
- getById: query - obter plano por ID
- create: mutation - criar novo plano
- update: mutation - atualizar plano
- remove: mutation - excluir plano
- initializeDefaults: mutation - inicializar planos padrão
```

### Tarefa 3.2: Refatorar página de planos
```
1. Remover dados hardcoded
2. Usar useQuery para buscar planos do banco
3. Adicionar Dialog para criar/editar plano
4. Adicionar AlertDialog para confirmar exclusão
5. Implementar formulário de plano com:
   - Nome
   - Descrição
   - Preço
   - Intervalo (mensal/anual)
   - maxUsers
   - maxCourses
   - Features (array de strings)
   - isActive
```

### Estimativa: 2 horas

---

# 🆕 4. DESENVOLVIMENTO: Novas Páginas Superadmin

## 4.1 `/superadmin/metrics`

### Funcionalidades:
- Gráficos de crescimento (usuários, cursos, organizações)
- Métricas de engajamento (tempo de estudo, conclusões)
- Taxa de conversão (free → paid)
- Usuários ativos diários/semanais/mensais

### Componentes Necessários:
```
- Card de métricas com sparklines
- Gráficos de linha (Recharts)
- Tabela de top performers
- Filtros de período
```

### Queries Convex Necessárias:
```
- reports.getGlobalMetrics (já existe parcialmente)
- reports.getGrowthStats (criar)
- reports.getEngagementStats (criar)
```

### Estimativa: 3 horas

---

## 4.2 `/superadmin/settings`

### Funcionalidades:
- Configurações gerais da plataforma
- Configurações de email (SMTP)
- Configurações de pagamento (Stripe keys)
- Limites globais
- Manutenção (backup, logs)

### Estrutura:
```tsx
Tabs:
1. Geral - Nome da plataforma, logo, domínio
2. Email - SMTP settings
3. Pagamentos - Stripe/Mercado Pago
4. Segurança - 2FA, políticas de senha
5. Avançado - Cache, logs, manutenção
```

### Armazenamento:
- Criar tabela `systemSettings` no schema
- Ou usar variáveis de ambiente

### Estimativa: 3 horas

---

## 4.3 `/superadmin/appearance`

### Funcionalidades:
- Tema global (cores, fontes)
- Logo e favicon
- CSS customizado
- Preview em tempo real

### Estrutura:
```tsx
- Color pickers para cores primárias/secundárias
- Upload de logo/favicon
- Editor de CSS customizado
- Preview do tema
```

### Estimativa: 2 horas

---

# 🆕 5. DESENVOLVIMENTO: Novas Páginas Admin

## 5.1 `/admin/professors`

### Funcionalidades:
- Listar professores da organização
- Criar/editar/excluir professor
- Ver cursos atribuídos
- Estatísticas do professor

### Queries Necessárias:
```
- users.getByOrganization + filtro role="professor"
- courses.getByInstructor (para stats)
```

### Estimativa: 2 horas

---

## 5.2 `/admin/students`

### Funcionalidades:
- Listar alunos da organização
- Criar/editar/excluir aluno
- Ver progresso de cursos
- Enviar notificações

### Queries:
```
- users.getByOrganization + filtro role="student"
- enrollments + lessonProgress para stats
```

### Estimativa: 2 horas

---

## 5.3 `/admin/categories`

### Status: Página existe mas precisa revisão

### Verificar:
- CRUD funcionando com Convex
- Sincronização com cursos

### Estimativa: 1 hora (revisão)

---

## 5.4 `/admin/certificates`

### Funcionalidades:
- Listar certificados emitidos
- Template de certificado (upload)
- Gerar certificado manualmente
- Verificar autenticidade

### Queries:
```
- certificates.getByOrganization (criar)
- certificates.generateManual (criar)
```

### Estimativa: 3 horas

---

# 🏆 6. DESENVOLVIMENTO: Página de Conquistas

## Localização
Múltiplas páginas dependendo do contexto:
- `/student/achievements` - Conquistas do aluno
- `/admin/achievements` - Gerenciar conquistas da org
- `/superadmin/achievements` - Gerenciar conquistas globais

## Funcionalidades Student:

### UI:
```
- Grid de conquistas (desbloqueadas + bloqueadas)
- Animações de unlock
- Progresso até próxima conquista
- Histórico de desbloqueio
```

### Backend (já existe):
- `gamification.getUserAchievements`
- `gamification.checkAndAward`

## Funcionalidades Admin:

### UI:
```
- Criar conquistas customizadas
- Definir regras (tipo, requirement, points)
- Associar imagem/ícone
- Ativar/desativar
```

### Backend (criar):
```convex
achievements.create
achievements.update
achievements.remove
```

### Estimativa: 4 horas

---

# 🎬 7. INTEGRAÇÃO: Bunny Stream

## Descrição
Integrar Bunny Stream para hospedagem e streaming de vídeos.

## Schema Atual
Já existe suporte no schema (lessons.videoProvider pode ser "bunny")

## Tarefas

### 7.1 Backend - Criar serviço Bunny
```
Arquivo: src/lib/bunny.ts

Funcionalidades:
- Upload de vídeo para Bunny
- Obter embed URL
- Listar vídeos da biblioteca
- Deletar vídeo
```

### 7.2 API Routes
```
Criar routes em app/api/bunny/:
- POST /api/bunny/upload - Iniciar upload
- GET /api/bunny/videos - Listar vídeos
- DELETE /api/bunny/videos/[id] - Deletar
```

### 7.3 Componente de Upload
```tsx
// src/components/bunny-video-upload.tsx

- Seleção de arquivo
- Progress bar de upload
- Preview do vídeo
- Opções de qualidade
```

### 7.4 Player de Vídeo
```tsx
// src/components/bunny-player.tsx

- Embed do Bunny player
- Tracking de progresso (integrar com lessonProgress)
- Controles customizados (opcional)
```

### 7.5 Variáveis de Ambiente
```env
BUNNY_API_KEY=
BUNNY_LIBRARY_ID=
BUNNY_CDN_URL=
```

### Estimativa: 6 horas

---

# 📊 8. REFATORAÇÃO: Dashboard com Dados Reais

## Problema
Dashboard usa dados mock (mockStats, mockCourses, mockAchievements)

## Análise
- **Arquivo:** `src/app/(dashboard)/dashboard/page.tsx`
- **Linhas:** 37-116 contêm dados mock

## Solução

### 8.1 Criar/usar queries existentes:
```
- users.getStats (já existe L307-338)
- enrollments.getByUser (já existe)
- certificates.getByUser (já existe)
- gamification.getUserAchievements (já existe)
```

### 8.2 Refatorar componente:
```tsx
export default function DashboardPage() {
    const { user } = useUser();
    const convexUser = useQuery(api.users.getByClerkId, 
        { clerkId: user?.id || "" }
    );
    
    // Stats reais
    const userStats = useQuery(api.users.getStats, 
        convexUser ? { userId: convexUser._id } : "skip"
    );
    
    // Cursos em progresso
    const enrollments = useQuery(api.enrollments.getByUser,
        convexUser ? { userId: convexUser._id } : "skip"
    );
    
    // Achievements
    const achievements = useQuery(api.gamification.getUserAchievements,
        convexUser ? { userId: convexUser._id } : "skip"
    );
    
    // Streak
    const streak = useQuery(api.reports.getUserStreak,
        convexUser ? { userId: convexUser._id } : "skip"
    );
    
    // Loading state while queries load
    if (!convexUser || !userStats) {
        return <DashboardSkeleton />;
    }
    
    // Render com dados reais
}
```

### 8.3 Criar query de hours studied:
```convex
// reports.ts
export const getUserStudyHours = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const progress = await ctx.db
            .query("lessonProgress")
            .withIndex("by_user", q => q.eq("userId", args.userId))
            .collect();
        
        const totalSeconds = progress.reduce((sum, p) => sum + p.watchedSeconds, 0);
        return Math.round(totalSeconds / 3600);
    }
});
```

### Estimativa: 2 horas

---

# 📅 CRONOGRAMA SUGERIDO

| Item | Prioridade | Tempo | Dia |
|------|-----------|-------|-----|
| 1. Sidebar Responsivo | Alta | 30min | 1 |
| 2. Edição de Usuário | Alta | 1h | 1 |
| 3. Página de Planos | Alta | 2h | 1 |
| 8. Dashboard Real | Alta | 2h | 1 |
| 5.3 Categories (revisão) | Média | 1h | 2 |
| 5.1 Professors | Média | 2h | 2 |
| 5.2 Students | Média | 2h | 2 |
| 4.1 Metrics | Média | 3h | 3 |
| 4.2 Settings | Média | 3h | 3 |
| 4.3 Appearance | Baixa | 2h | 4 |
| 5.4 Certificates | Média | 3h | 4 |
| 6. Achievements | Média | 4h | 5 |
| 7. Bunny Stream | Baixa | 6h | 6-7 |

**Total Estimado: ~31 horas**

---

# ✅ CHECKLIST DE IMPLEMENTAÇÃO

## Fase 1 - Correções Urgentes (Dia 1)
- [x] 1. Sidebar responsivo
- [x] 2. Página de edição de usuário
- [x] 3. CRUD de planos funcional
- [x] 8. Dashboard com dados reais

## Fase 2 - Páginas Admin (Dias 2-3)
- [x] 5.1 Professores
- [x] 5.2 Alunos
- [ ] 5.3 Categorias (revisão)

## Fase 3 - Páginas Superadmin (Dias 3-4)
- [x] 4.1 Métricas
- [x] 4.2 Configurações
- [x] 4.3 Aparência

## Fase 4 - Features Adicionais (Dias 4-7)
- [x] 5.4 Certificados
- [x] 6. Conquistas
- [x] 7. Bunny Stream

---

# 🚀 COMANDOS PARA INÍCIO

```bash
# Terminal 1 - Dev Server
npm run dev

# Terminal 2 - Convex Dev
npx convex dev

# Verificar tipos
npx tsc --noEmit
```
