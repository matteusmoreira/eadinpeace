# 🎭 Guia: Testes com Múltiplos Perfis de Usuário

## 📋 Visão Geral

O sistema foi configurado para testar com **3 tipos de usuários**:
- 🎓 **Aluno (Student)**
- 👨‍🏫 **Professor**
- 👤 **Administrador (Admin)**

Cada tipo de usuário tem suas próprias credenciais e permissões de acesso.

## ⚙️ Configuração

### Passo 1: Configure as Credenciais

Edite o arquivo `.env.local` e preencha com **credenciais reais** de teste:

```env
# ALUNO (Student)
E2E_STUDENT_EMAIL=aluno@seudominio.com
E2E_STUDENT_PASSWORD=SenhaDoAluno123!

# PROFESSOR
E2E_PROFESSOR_EMAIL=professor@seudominio.com
E2E_PROFESSOR_PASSWORD=SenhaDoProfessor123!

# ADMINISTRADOR
E2E_ADMIN_EMAIL=admin@seudominio.com
E2E_ADMIN_PASSWORD=SenhaDoAdmin123!
```

> [!IMPORTANT]
> **Use credenciais de usuários reais cadastrados no sistema!**
> Cada usuário deve ter o papel (role) correto no Clerk/banco de dados.

### Passo 2: Primeira Execução - Fazer Login

Na primeira vez que executar os testes:

```bash
# Inicie o servidor
npm run dev

# Em outro terminal, execute os testes
npm test
```

Você precisará fazer login **manualmente** para cada tipo de usuário:

1. **Janela 1**: Login como aluno
2. **Janela 2**: Login como professor  
3. **Janela 3**: Login como administrador

Após o login de cada um, o Playwright salvará o estado de autenticação:
- `.auth/student.json`
- `.auth/professor.json`
- `.auth/admin.json`

## 🧪 Executando os Testes

### Todos os Testes (Todos os Perfis)

```bash
npm test
```

Isso executará:
- Setup de autenticação para os 3 perfis
- Todos os testes organizados por perfil

### Apenas Testes de um Perfil Específico

```bash
# Apenas testes de ALUNO
npm test -- --project=student

# Apenas testes de PROFESSOR
npm test -- --project=professor

# Apenas testes de ADMIN
npm test -- --project=admin
```

### Testes Específicos

```bash
# Teste específico como aluno
npm test tests/student/

# Teste de criação de curso (como professor)
npm test tests/courses/course-creation.spec.ts

# Testes de segurança (como admin)
npm test tests/security/
```

## 📂 Organização dos Testes por Perfil

### 🎓 Testes de ALUNO (`student`)

Executados com credenciais de aluno:
- `tests/student/**/*.spec.ts` - Funcionalidades específicas do aluno
- `tests/courses/course-viewing.spec.ts` - Visualização de cursos
- `tests/integration/full-student-journey.spec.ts` - Jornada completa

**O que testa:**
- Matrícula em cursos
- Visualização de conteúdo
- Progresso e conclusão
- Certificados
- Conquistas e ranking

### 👨‍🏫 Testes de PROFESSOR (`professor`)

Executados com credenciais de professor:
- `tests/courses/course-creation.spec.ts` - Criação de cursos
- `tests/courses/course-editing.spec.ts` - Edição de cursos
- `tests/quizzes/**/*.spec.ts` - Criação e gestão de quizzes

**O que testa:**
- Criar e editar cursos
- Adicionar módulos e aulas
- Criar quizzes e questões
- Gerenciar alunos

### 👤 Testes de ADMIN (`admin`)

Executados com credenciais de administrador:
- `tests/admin/**/*.spec.ts` - Gestão administrativa
- `tests/security/**/*.spec.ts` - Segurança e permissões

**O que testa:**
- Gestão de usuários
- Gestão de categorias
- Configurações da organização
- Segurança multi-tenancy
- Permissões de acesso

### 📄 Testes GERAIS (`general`)

Executados com qualquer usuário (usa aluno por padrão):
- `tests/pages.spec.ts` - Navegação entre páginas

## 🔄 Fluxo de Execução

Quando você executa `npm test`, o Playwright:

1. **Setup** (paralelo):
   - `setup-student` → Login como aluno → Salva em `.auth/student.json`
   - `setup-professor` → Login como professor → Salva em `.auth/professor.json`
   - `setup-admin` → Login como admin → Salva em `.auth/admin.json`

2. **Testes** (após setup):
   - Projeto `student` usa `.auth/student.json`
   - Projeto `professor` usa `.auth/professor.json`
   - Projeto `admin` usa `.auth/admin.json`

## 💡 Dicas

### Login Manual vs Automático

- **Primeira execução**: Login manual em janelas do navegador
- **Execuções seguintes**: Automático usando estados salvos
- **Se expirar**: Delete os arquivos `.auth/*.json` e refaça o login

### Resetar Autenticação

```bash
# Deletar todos os estados salvos
rm -rf .auth/*.json

# No Windows
del /q .auth\*.json
```

### Debug de Permissões

Se um teste falhar por permissão:

1. Verifique se o usuário tem o **role correto** no sistema
2. Confirme que as **credenciais** em `.env.local` estão corretas
3. Verifique se o teste está no **projeto correto** no `playwright.config.ts`

### Executar Setup Manualmente

```bash
# Re-fazer login como aluno
npm test -- --project=setup-student

# Re-fazer login como professor
npm test -- --project=setup-professor

# Re-fazer login como admin
npm test -- --project=setup-admin
```

## 📊 Exemplo de Saída

```
Running 58 tests using 1 worker

 ✓  [setup-student] › autenticar como aluno (2.1s)
 ✓  [setup-professor] › autenticar como professor (1.8s)
 ✓  [setup-admin] › autenticar como administrador (1.9s)

 ✓  [student] › course-viewing.spec.ts:10 › deve visualizar lista de cursos (1.2s)
 ✓  [professor] › course-creation.spec.ts:16 › deve criar curso básico (2.5s)
 ✓  [admin] › multi-tenancy.spec.ts:8 › deve isolar dados da organização (1.1s)

 ✓  55 passed (3.2m)
```

## ⚠️ Troubleshooting

### Erro: "Credenciais não configuradas"

**Solução**: Configure as variáveis em `.env.local`

### Erro: "Redirecionado para login"

**Soluções**:
1. Delete `.auth/*.json` e refaça o login
2. Verifique se as credenciais estão corretas
3. Verifique se o usuário existe no sistema

### Erro: "Permissão negada"

**Soluções**:
1. Verifique se o usuário tem o **papel correto** (student/professor/admin)
2. Confirme que o teste está sendo executado com o **projeto correto**

### Teste em projeto errado

Se um teste de professor está rodando como aluno, verifique:
- O `testMatch` em `playwright.config.ts`
- O caminho do arquivo de teste

## 📚 Recursos

- [Configuração Completa](file:///c:/Users/matte/Desktop/EAD%20Top%202027%20para%20inpeace/playwright.config.ts)
- [Documentação de Testes](file:///c:/Users/matte/Desktop/EAD%20Top%202027%20para%20inpeace/docs/TESTING.md)
- [Setup Aluno](file:///c:/Users/matte/Desktop/EAD%20Top%202027%20para%20inpeace/tests/auth-student.setup.ts)
- [Setup Professor](file:///c:/Users/matte/Desktop/EAD%20Top%202027%20para%20inpeace/tests/auth-professor.setup.ts)
- [Setup Admin](file:///c:/Users/matte/Desktop/EAD%20Top%202027%20para%20inpeace/tests/auth-admin.setup.ts)
