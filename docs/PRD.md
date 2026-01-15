# PRD — EAD Pro (Plataforma EAD Multi-tenant)

**Versão:** 1.0  
**Data:** 2026-01-15  
**Produto:** EAD Pro  

## 1) Visão e Contexto

O EAD Pro é uma plataforma de ensino a distância em modelo SaaS, desenhada para atender múltiplas organizações (multi-tenancy) com isolamento de dados, personalização white-label e módulos de engajamento (gamificação e social).

### Problema

- Plataformas EAD existentes tendem a ser caras, pouco flexíveis e com baixa personalização.
- Instituições precisam de gestão simples (cursos, usuários, turmas, relatórios).
- Alunos abandonam cursos por falta de motivação/feedback rápido e pouca interação.

### Proposta de Valor

- SaaS multi-tenant com operação independente por organização.
- White-label com identidade visual configurável por organização.
- Engajamento nativo: gamificação, comunidade/social, notificações e quizzes.

## 2) Objetivos do Produto

- Permitir que organizações publiquem cursos e gerenciem alunos/professores com autonomia.
- Aumentar engajamento e conclusão de cursos com trilhas, progresso, avaliações e gamificação.
- Suportar crescimento (usuários, cursos, tráfego) mantendo performance, segurança e isolamento.

## 3) Escopo

### Dentro do Escopo (MVP/GA)

- Multi-tenancy: organizações, isolamento, slug e identidade visual.
- Autenticação, autorização por papéis e perfis (superadmin, admin, professor, student).
- Cursos: catálogo, páginas, criação/edição, módulos e aulas (vídeo/texto/pdf/atividade/prova).
- Conteúdo: player com acompanhamento de progresso e “continuar de onde parou”.
- Matrículas, progresso e conclusões.
- Quizzes, banco de questões, correção e notas.
- Certificados (templates, geração e verificação pública por código).
- Gamificação (pontos, conquistas, streaks, ranking).
- Social/comunidade e fórum.
- Notificações e relatórios.

### Fora do Escopo (por ora)

- App mobile nativo.
- Integrações LTI (Moodle/Canvas).
- IA para correção e recomendação.
- Marketplace público de cursos entre organizações.
- Internacionalização completa (EN/ES).

## 4) Personas e Necessidades

### Aluno (Student)

- Encontrar cursos rapidamente (busca/filtros) e acessar conteúdo de forma fluida.
- Acompanhar progresso e entender o que falta para concluir.
- Fazer quizzes e visualizar desempenho.
- Receber reconhecimento (pontos/conquistas/certificado) e interagir (social/comunidade).

### Professor (Professor)

- Criar e manter cursos (módulos/aulas) com reutilização de questões e rubricas.
- Aplicar avaliações, acompanhar alunos e corrigir quando necessário.
- Acessar relatórios por turma/curso e identificar alunos em risco.

### Administrador da Organização (Admin)

- Gerir usuários, cursos, categorias, certificados e configurações da organização.
- Garantir padronização e compliance do conteúdo publicado.
- Acompanhar métricas de uso e desempenho por organização.

### Superadministrador da Plataforma (Superadmin)

- Criar/gerir organizações, planos, limites e faturamento.
- Monitorar métricas globais e saúde da plataforma.
- Atuar em suporte/operacional (auditoria e intervenções).

## 5) Jornadas Principais

### J1 — Onboarding de Organização (Admin/Superadmin)

1. Criar organização (nome/slug/plano/limites)  
2. Definir identidade visual (logo, cores, fonte, tema)  
3. Criar usuários (admin/professor/aluno)  
4. Publicar cursos e liberar matrículas  

### J2 — Criação de Curso (Professor/Admin)

1. Criar curso (título, descrição, categoria, nível, duração, visibilidade)  
2. Criar módulos e aulas (ordem e publicação)  
3. Configurar comentários e gotejamento de conteúdo (curso/módulo/aula)  
4. Associar quizzes, rubricas e template de certificado  
5. Publicar curso e acompanhar engajamento  

### J3 — Consumo e Conclusão (Aluno)

1. Navegar catálogo/busca e matricular-se  
2. Assistir aulas e completar conteúdos  
3. Fazer quizzes e acompanhar notas/progresso  
4. Desbloquear conquistas e subir no ranking  
5. Concluir curso e emitir certificado com verificação pública  

### J4 — Comunidade e Retenção (Aluno/Professor)

1. Criar posts/comentários e seguir pessoas  
2. Participar de tópicos do fórum  
3. Receber notificações e retornar ao produto  

## 6) Requisitos Funcionais (Épicos)

### RF1 — Autenticação, Autorização e Multi-tenancy (Must)

- Login/cadastro e sessão via provedor de autenticação.
- Papéis: superadmin, admin, professor, student.
- Operações sensíveis exigem autenticação e autorização por papel.
- Isolamento por organização: usuário só acessa dados da própria organização; superadmin pode acessar todas.

### RF2 — Gestão de Organizações (Must)

- CRUD de organizações (superadmin).
- Configurações white-label por organização: logo, favicon, cores, fonte, bordas, tema e preferências.
- Limites por plano (usuários/cursos) e status ativo/inativo.

### RF3 — Gestão de Usuários e Papéis (Must)

- CRUD de usuários por organização (admin).
- Ativação/desativação, associação à organização e papel.
- Páginas de perfil (inclui slug público quando aplicável).

### RF4 — Cursos, Catálogo e Descoberta (Must)

- Catálogo por organização com busca e filtros (categoria, nível, destaque, público/privado).
- Página pública de curso quando marcado como público.
- Categorias por organização (ordem, ativo/inativo, cor/ícone).

### RF5 — Estrutura de Conteúdo (Must)

- Curso → módulos → aulas com ordenação e publicação.
- Tipos de aula: vídeo, texto, pdf/arquivo, atividade, prova.
- Aulas com anexos/arquivos, duração e regras “free preview”.

### RF6 — Player e Progresso (Must)

- Player com acompanhamento de progresso (por tempo assistido e conclusão).
- Retomar aula de onde parou e navegação sequencial.
- Página “continuar” e visão de progresso por curso.

### RF7 — Matrículas e Turmas (Should/Must)

- Matrícula do aluno em cursos (controle por organização).
- Turmas (classes) e relatórios por turma.
- Presença (attendance) para turmas quando aplicável.

### RF8 — Avaliações, Quizzes e Notas (Must)

- Quizzes por curso e/ou por aula com configuração (score mínimo, tempo, tentativas, aleatorização).
- Banco de questões reutilizáveis.
- Correção automática e fluxo de correção/avaliação quando necessário.
- Rubricas de correção e cálculo de nota final.

### RF9 — Certificados (Must)

- Templates configuráveis de certificado por organização/curso.
- Geração automática ao concluir curso (quando habilitado).
- Página pública de verificação por código e opção de PDF/URL.

### RF10 — Gamificação e Ranking (Should)

- Pontos, conquistas por regras e streak diário.
- Leaderboard por organização.
- Telas do aluno para conquistas e ranking.

### RF11 — Social e Comunidade (Should)

- Posts, curtidas, comentários, seguidores.
- Fórum por organização (tópicos e participação).
- Perfil público e navegação entre membros (quando habilitado).

### RF12 — Notificações (Should)

- Notificações em tempo real e histórico.
- Eventos de produto: matrícula, nova aula, conquista, certificado, respostas no fórum, etc.

### RF13 — Relatórios e Exportação (Should)

- Relatórios de progresso, engajamento, resultados de quizzes e desempenho por turma/curso.
- Exportação (CSV/Excel) quando aplicável.

### RF14 — Pagamentos e Planos (Could → Must em fase posterior)

- Planos por organização (starter/professional/enterprise), limites e cobrança recorrente.
- Gateway (Stripe/Mercado Pago) e relatórios financeiros.

## 7) Requisitos Não Funcionais

### Segurança e Privacidade (Must)

- Autenticação e autorização no backend para queries/mutations sensíveis.
- Validação consistente de organização em todas as operações multi-tenant.
- Auditoria básica: registro de ações administrativas críticas (quando aplicável).
- LGPD: minimização de dados, consentimento para comunicações e tratamento de exclusão quando necessário.

### Performance e Escalabilidade (Should)

- Listagens com paginação e limites.
- Redução de consultas N+1 em telas de alto tráfego.
- Metas indicativas: 95p TTFB < 800ms em páginas principais sob carga nominal.

### Confiabilidade (Should)

- Disponibilidade alvo: 99,5% mensal.
- Recuperação de falhas: degradação graciosa e mensagens claras ao usuário.

### Acessibilidade e UX (Should)

- Navegação por teclado e componentes com atributos ARIA adequados.
- Design responsivo e consistência visual por organização.

### Observabilidade (Should)

- Monitoramento de erros e métricas de performance (ex.: Sentry/Vercel Analytics).
- Métricas de uso por organização e por papel.

## 8) Métricas de Sucesso (KPIs)

- Ativação: % de organizações que publicam 1º curso em até 7 dias.
- Engajamento: DAU/WAU, aulas iniciadas por usuário/semana, taxa de retorno D7/D30.
- Conclusão: % de alunos que concluem curso, tempo médio até conclusão.
- Avaliação: taxa de tentativa de quizzes e taxa de aprovação.
- Retenção: streak médio e % com streak ≥ 3 dias.
- Monetização (quando pagamentos): MRR, churn mensal, ARPA por organização.
- Qualidade: taxa de erros (frontend/backend), incidentes por mês, NPS/satisfação.

## 9) Eventos de Analytics (mínimo)

- organization_created, organization_updated
- user_created, role_changed, user_deactivated
- course_created, course_published, lesson_published
- enrollment_created, lesson_started, lesson_completed
- quiz_started, quiz_submitted, quiz_passed, quiz_failed
- certificate_issued, certificate_verified
- achievement_unlocked, streak_updated
- post_created, comment_created, forum_topic_created

## 10) Dependências

- Autenticação/organizações: Clerk.
- Backend/DB tempo real: Convex.
- Hospedagem: Vercel.
- Vídeo/streaming: YouTube, Bunny, upload.
- Pagamentos (futuro): Stripe e/ou Mercado Pago.

## 11) Riscos e Mitigações

- Risco: vazamento de dados entre organizações.  
  Mitigação: validação obrigatória de organização e autorização em todas as operações; testes automatizados.

- Risco: lentidão em telas com muita relação de dados.  
  Mitigação: paginação, limites, evitar N+1 e medir 95p por rota.

- Risco: baixa adoção por professores (complexidade de autoria).  
  Mitigação: fluxos guiados, padrões reutilizáveis (banco de questões/templates), UX consistente.

## 12) Critérios de Aceite (alto nível)

- Um aluno não acessa dados fora da sua organização.
- Um admin gerencia usuários/cursos apenas da própria organização.
- Um professor cria curso, publica, matricula alunos e acompanha progresso/avaliações.
- Um aluno consome conteúdo, faz quizzes, conclui e emite certificado verificável.
- Social, gamificação e notificações funcionam por organização e respeitam permissões.

