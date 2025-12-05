# 🎓 Plataforma EAD Top 2027 - Documentação

## Stack Tecnológica

| Tecnologia | Uso |
|------------|-----|
| Next.js 14 | Framework React com App Router |
| TypeScript | Tipagem estática |
| Tailwind CSS | Estilização |
| Clerk | Autenticação e multi-tenancy |
| Convex | Banco de dados reativo |
| Framer Motion | Animações |
| Shadcn/UI | Componentes |

## Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/           # Páginas de autenticação
│   ├── (dashboard)/      # Área logada
│   ├── certificate/      # Página pública de certificado
│   ├── globals.css       # Estilos globais
│   └── layout.tsx        # Layout raiz
├── components/
│   ├── layout/           # Header, Sidebar
│   ├── providers/        # ThemeProvider, ConvexProvider
│   └── ui/               # Componentes base
└── lib/                  # Utilitários

convex/
├── schema.ts             # Schema do banco (16 tabelas)
├── users.ts              # CRUD de usuários
├── organizations.ts      # CRUD de organizações
├── courses.ts            # CRUD de cursos
├── enrollments.ts        # Matrículas e progresso
├── certificates.ts       # Certificados
├── quizzes.ts            # Quiz e questões
├── gamification.ts       # Achievements e ranking
└── notifications.ts      # Notificações
```

## Módulos Implementados

### ✅ Módulo 1: Fundação
- [x] Setup Next.js 14 + TypeScript
- [x] Tailwind CSS + Dark Mode
- [x] Design System com paleta Indigo/Violet
- [x] Componentes Shadcn/UI
- [x] Layout responsivo (Header, Sidebar)
- [x] Páginas de autenticação (Clerk)
- [x] Dashboards por role

### ✅ Módulo 2: Autenticação
- [x] Integração Clerk
- [x] Configuração pt-BR
- [x] Multi-tenancy com Organizations
- [x] Roles e permissões (superadmin, admin, professor, student)
- [x] Middleware de proteção

### ✅ Módulo 3: Banco de Dados Convex
- [x] Setup Convex (local)
- [x] Schema completo (16 tabelas)
- [x] Funções CRUD (users, organizations, courses, enrollments)
- [x] Hook de sincronização Clerk ↔ Convex
- [x] Queries e mutations completas

### ✅ Módulo 4: Dashboard do Aluno
- [x] Dashboard com stats reais do Convex
- [x] Catálogo de cursos (courses.getPublishedByOrganization)
- [x] Player de vídeo YouTube com progresso
- [x] Sidebar de navegação por módulos/aulas
- [x] Marcar aula como concluída (enrollments.updateLessonProgress)
- [x] Sistema de streak (enrollments.updateStreak)
- [x] Página de certificados (certificates.getByUser)
- [x] Página de ranking/leaderboard (gamification.getLeaderboard)
- [x] Página de notificações (notifications.getByUser)

### ✅ Módulo 5: Dashboard do Professor
- [x] Dashboard com stats reais do Convex
- [x] Listagem de cursos do professor (courses.getByInstructor)
- [x] Criação de novo curso (courses.create)
- [x] Editor de curso (módulos e aulas)
- [x] Adicionar módulos (courses.createModule)
- [x] Adicionar aulas (courses.createLesson)
- [x] Toggle publicar/rascunho
- [x] Página de alunos com progresso (enrollments.getAll)

### ✅ Módulo 6: Dashboard do Admin
- [x] Dashboard com stats reais do Convex
- [x] Lista de usuários da organização (users.getAll filtrado)
- [x] Lista de cursos da organização (courses.getByOrganization)
- [x] CRUD de usuários
- [x] CRUD de cursos

### ✅ Módulo 7: Dashboard Superadmin
- [x] Dashboard com stats globais (organizations.getGlobalStats, users.getGlobalStats)
- [x] Lista de organizações (organizations.getAll)
- [x] Criar/Editar/Excluir organizações
- [x] Lista de usuários global
- [x] Criar/Excluir usuários

### ✅ Módulo 8: Sistema de Certificados
- [x] Geração automática ao completar curso
- [x] Página de certificados do aluno
- [x] Verificação pública de certificado (/certificate/[code])
- [x] Query por código (certificates.getByCode)

### ✅ Módulo 9: Sistema de Quiz/Avaliações
- [x] Schema de quizzes, questions, attempts
- [x] API completa (quizzes.ts)
- [x] Criar quiz com questões
- [x] Submeter tentativa com correção automática
- [x] Histórico de tentativas
- [x] Nota de aprovação configurável

### ✅ Módulo 10: Gamificação
- [x] Schema de achievements e userAchievements
- [x] API completa (gamification.ts)
- [x] Achievements padrão (primeiro curso, streak, etc)
- [x] Sistema de pontos
- [x] Leaderboard por organização
- [x] Ranking do usuário
- [x] Verificação automática de conquistas

### ✅ Módulo 11: Notificações
- [x] Schema de notifications
- [x] API completa (notifications.ts)
- [x] Notificações de conquistas
- [x] Marcar como lida
- [x] Envio em massa (admin)

### ✅ Módulo 12: Configurações
- [x] Página de configurações do usuário
- [x] Edição de perfil
- [x] Preferências de notificação
- [x] Seletor de tema (claro/escuro/sistema)
- [x] Informações de segurança

## Próximos Passos (Em Progresso)

### ✅ Módulo 13: Comunicação
- [x] Comentários nas aulas (backend + componente)
- [x] Respostas e threads
- [x] Curtidas e moderação
- [ ] Chat em tempo real (futuro)
- [ ] Fórum de discussão (futuro)

### ✅ Módulo 14: Relatórios
- [x] Relatórios de progresso por curso
- [x] Relatório da organização (admin)
- [x] Relatório global (superadmin)
- [x] Exportação de dados (CSV)
- [x] Gráficos interativos

### 🔄 Módulo 15: Pagamentos
- [x] Schema de planos e assinaturas
- [x] CRUD de planos (superadmin)
- [x] Histórico de transações
- [x] Dashboard financeiro
- [ ] Integração com gateway de pagamento (Stripe)

## Comandos

```bash
# Desenvolvimento
npm run dev

# Convex local
npx convex dev

# Build
npm run build

# Lint
npm run lint
```

## Variáveis de Ambiente

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
```

## Status da Integração Convex

| Página | Status | Queries/Mutations |
|--------|--------|-------------------|
| Student Dashboard | ✅ Real | users.getStats, enrollments.getByUser |
| Student Courses | ✅ Real | courses.getPublishedByOrganization |
| Student Player | ✅ Real | courses.getWithContent, enrollments.updateLessonProgress |
| Student Certificates | ✅ Real | certificates.getByUser |
| Student Leaderboard | ✅ Real | gamification.getLeaderboard, getUserRank |
| Professor Dashboard | ✅ Real | courses.getByInstructor |
| Professor Courses | ✅ Real | courses CRUD |
| Professor Students | ✅ Real | enrollments.getAll |
| Admin Dashboard | ✅ Real | users.getAll, courses.getByOrganization |
| Admin Users | ✅ Real | users CRUD |
| Admin Courses | ✅ Real | courses CRUD |
| Superadmin | ✅ Real | organizations CRUD, users CRUD |
| Settings | ✅ Real | users.getByClerkId |
| Notifications | ✅ Real | notifications CRUD |
| Certificate Verify | ✅ Real | certificates.getByCode |
