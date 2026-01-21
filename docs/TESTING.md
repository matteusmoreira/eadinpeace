# Guia de Testes Automatizados - EAD Platform

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Configuração](#configuração)
- [Executando os Testes](#executando-os-testes)
- [Estrutura dos Testes](#estrutura-dos-testes)
- [Criando Novos Testes](#criando-novos-testes)
- [Boas Práticas](#boas-práticas)
- [Troubleshooting](#troubleshooting)

## 📖 Visão Geral

Este projeto utiliza [Playwright](https://playwright.dev/) para testes end-to-end automatizados. Os testes cobrem:

- ✅ Navegação entre páginas
- ✅ Funcionalidades CRUD (cursos, usuários, categorias)
- ✅ Fluxos de usuário (matrícula, progresso, certificados)
- ✅ Segurança e isolamento multi-tenancy
- ✅ Jornadas completas (aluno e professor)

## 🔧 Pré-requisitos

- Node.js 18+ instalado
- NPM ou Yarn
- Sistema rodando localmente (`npm run dev`)
- Credenciais de teste válidas

## ⚙️ Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie ou edite o arquivo `.env.local` na raiz do projeto:

```env
# Credenciais para testes E2E
E2E_EMAIL=seu-email-de-teste@example.com
E2E_PASSWORD=sua-senha-de-teste
```

> **⚠️ IMPORTANTE**: Use credenciais de teste, nunca credenciais de produção!

### 3. Instalar Browsers do Playwright

```bash
npx playwright install chromium
```

## 🚀 Executando os Testes

### Todos os Testes

```bash
npm test
```

### Modo Interativo (UI)

```bash
npm run test:ui
```

Este modo abre uma interface gráfica onde você pode:
- Ver testes em tempo real
- Debugar testes passo a passo
- Ver screenshots e traces

### Testes Específicos

```bash
# Apenas testes de cursos
npm test tests/courses/

# Apenas teste específico
npm test tests/courses/course-creation.spec.ts

# Com modo debug
npm run test:debug
```

### Gerar Relatório HTML

```bash
npm run test:report
```

O relatório será aberto automaticamente no navegador.

## 📂 Estrutura dos Testes

```
tests/
├── helpers/                    # Utilitários reutilizáveis
│   ├── test-data.ts           # Geração de dados de teste
│   └── actions.ts             # Ações comuns (navegação, forms, etc)
│
├── courses/                    # Testes de cursos
│   ├── course-creation.spec.ts
│   ├── course-editing.spec.ts
│   └── course-viewing.spec.ts
│
├── student/                    # Testes de funcionalidades do aluno
│   ├── enrollment.spec.ts
│   └── progress.spec.ts
│
├── quizzes/                    # Testes de quizzes
│   ├── quiz-creation.spec.ts
│   └── quiz-taking.spec.ts
│
├── admin/                      # Testes de administração
│   ├── user-management.spec.ts
│   └── category-management.spec.ts
│
├── security/                   # Testes de segurança
│   └── multi-tenancy.spec.ts
│
├── integration/                # Testes de jornadas completas
│   ├── full-student-journey.spec.ts
│   └── full-professor-journey.spec.ts
│
├── auth.setup.ts              # Setup de autenticação
└── pages.spec.ts              # Testes de navegação
```

## ✍️ Criando Novos Testes

### Template Básico

```typescript
import { test, expect } from '@playwright/test';
import { TestData } from '../helpers/test-data';
import { createTestActions } from '../helpers/actions';

test.describe('Minha Funcionalidade', () => {
    test('deve fazer algo específico', async ({ page }) => {
        const actions = createTestActions(page);
        
        // 1. Navegar para a página
        await actions.navigateTo('/caminho/da/pagina');
        await actions.waitForPageReady();
        
        // 2. Interagir com elementos
        const button = page.locator('button:has-text("Clique Aqui")');
        await button.click();
        
        // 3. Validar resultado
        await actions.waitForSuccessMessage();
        
        // 4. Assert
        const hasError = await actions.checkForErrors();
        expect(hasError).toBe(false);
    });
});
```

### Usando Helpers de Dados

```typescript
// Gerar dados de curso
const courseData = TestData.course.basic();

// Gerar dados de usuário
const userData = TestData.user.student();

// Gerar questão de quiz
const question = TestData.question.multipleChoice();
```

### Usando Helpers de Ações

```typescript
const actions = createTestActions(page);

// Preencher formulário
await actions.fillForm({
    title: 'Título do Curso',
    description: 'Descrição',
    isPublic: true,
});

// Upload de arquivo
await actions.uploadFile(inputLocator, '/path/to/file.jpg');

// Aguardar mensagem de sucesso
await actions.waitForSuccessMessage('Salvo com sucesso');

// Tirar screenshot
await actions.takeScreenshot('nome-descritivo');
```

## 📚 Boas Práticas

### 1. Nomenclatura de Testes

```typescript
// ✅ BOM: Descritivo e claro
test('deve criar curso sem certificado', async ({ page }) => { ... });

// ❌ RUIM: Vago
test('teste 1', async ({ page }) => { ... });
```

### 2. Use Seletores Semânticos

```typescript
// ✅ BOM: Seletores por texto ou role
page.locator('button:has-text("Salvar")');
page.locator('[role="button"][aria-label="Fechar"]');

// ❌ RUIM: Classes CSS podem mudar
page.locator('.btn-primary-large-blue');
```

### 3. Aguarde Elementos Corretamente

```typescript
// ✅ BOM: Aguardar explicitamente
await actions.waitForPageReady();
await button.waitFor({ state: 'visible' });

// ❌ RUIM: Timeouts fixos desnecessários
await page.waitForTimeout(5000);
```

### 4. Isole Testes

Cada teste deve ser independente e não depender do estado de outros testes:

```typescript
// ✅ BOM: Cada teste cria seus próprios dados
test('teste A', async ({ page }) => {
    const data = TestData.course.basic();
    // ... criar e testar
});

test('teste B', async ({ page }) => {
    const data = TestData.course.basic();
    // ... criar e testar
});
```

### 5. Use Logs para Debug

```typescript
test('meu teste', async ({ page }) => {
    console.log('📍 Passo 1: Navegando...');
    await actions.navigateTo('/courses');
    
    console.log('📍 Passo 2: Criando curso...');
    // ...
    
    console.log('✅ Teste concluído!');
});
```

## 🐛 Troubleshooting

### Problema: Teste falha com timeout

**Solução**:
```typescript
// Aumentar timeout do teste
test('teste longo', async ({ page }) => {
    test.setTimeout(60000); // 60 segundos
    // ...
});
```

### Problema: Elemento não encontrado

**Soluções**:

1. **Verificar se o elemento existe**:
```typescript
const isVisible = await button.isVisible({ timeout: 5000 }).catch(() => false);
if (isVisible) {
    await button.click();
}
```

2. **Aguardar carregamento**:
```typescript
await actions.waitForPageReady();
await page.waitForLoadState('networkidle');
```

3. **Debug com screenshot**:
```typescript
await actions.takeScreenshot('debug-antes-do-erro');
```

### Problema: Autenticação não funciona

**Verificações**:

1. Conferir credenciais em `.env.local`
2. Verificar se o servidor está rodando
3. Verificar arquivo de autenticação:

```bash
# Ver estado salvo
cat .auth/user.json
```

### Problema: Testes passam localmente mas falham em CI

**Soluções**:

1. Adicionar retry em CI (já configurado em `playwright.config.ts`):
```typescript
retries: process.env.CI ? 2 : 0
```

2. Aumentar timeouts em ambientes lentos

3. Aguardar network idle:
```typescript
await page.waitForLoadState('networkidle');
```

### Problema: Muitos falsos positivos

**Soluções**:

1. Fazer testes mais resilientes:
```typescript
// Em vez de assert direto, verificar condições
const success = await page.locator('text=Sucesso').isVisible().catch(() => false);
const redirected = page.url().includes('/success');

expect(success || redirected).toBe(true);
```

2. Usar `soft assertions` para não parar o teste:
```typescript
await expect.soft(element).toBeVisible();
// Teste continua mesmo se falhar
```

## 📊 Métricas de Sucesso

- **Taxa de sucesso esperada**: > 90% em funcionalidades críticas
- **Taxa de sucesso mínima**: > 70% em testes de navegação
- **Tempo de execução**: < 5 minutos para suite completa

## 🔗 Recursos Adicionais

- [Documentação Playwright](https://playwright.dev/docs/intro)
- [Seletores](https://playwright.dev/docs/selectors)
- [Assertions](https://playwright.dev/docs/test-assertions)
- [Best Practices](https://playwright.dev/docs/best-practices)

## 📞 Suporte

Se encontrar problemas:

1. Verifique a seção [Troubleshooting](#troubleshooting)
2. Execute com modo debug: `npm run test:debug`
3. Gere relatório com traces: `npm run test:report`
4. Documente o erro e compartilhe com a equipe
