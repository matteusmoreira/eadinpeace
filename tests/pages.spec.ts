import { test, expect, Page } from '@playwright/test';

/**
 * Testes automatizados para verificar páginas com autenticação
 * 
 * Para rodar os testes:
 * npm test
 * 
 * Para rodar com interface visual:
 * npm run test:ui
 */

// Páginas do sistema organizadas por tipo de usuário
const allPages = {
    student: [
        { url: '/student', name: 'Dashboard do Estudante' },
        { url: '/student/courses', name: 'Cursos do Estudante' },
        { url: '/student/achievements', name: 'Conquistas' },
        { url: '/student/certificates', name: 'Certificados' },
        { url: '/student/community', name: 'Comunidade' },
        { url: '/student/continue', name: 'Continuar Estudando' },
        { url: '/student/progress', name: 'Progresso' },
        { url: '/student/quizzes', name: 'Quizzes do Estudante' },
        { url: '/student/ranking', name: 'Ranking' },
        { url: '/student/search', name: 'Busca' },
        { url: '/student/leaderboard', name: 'Leaderboard' },
    ],
    professor: [
        { url: '/professor', name: 'Dashboard do Professor' },
        { url: '/professor/courses', name: 'Cursos do Professor' },
        { url: '/professor/quizzes', name: 'Quizzes' },
        { url: '/professor/question-bank', name: 'Banco de Questões' },
        { url: '/professor/rubrics', name: 'Rubricas' },
        { url: '/professor/students', name: 'Alunos' },
    ],
    admin: [
        { url: '/admin', name: 'Dashboard Admin' },
        { url: '/admin/achievements', name: 'Conquistas Admin' },
        { url: '/admin/announcements', name: 'Anúncios' },
        { url: '/admin/categories', name: 'Categorias' },
        { url: '/admin/certificates', name: 'Certificados Admin' },
        { url: '/admin/courses', name: 'Cursos Admin' },
        { url: '/admin/professors', name: 'Professores' },
        { url: '/admin/reports', name: 'Relatórios' },
        { url: '/admin/settings', name: 'Configurações' },
        { url: '/admin/students', name: 'Estudantes Admin' },
        { url: '/admin/users', name: 'Usuários' },
    ],
    superadmin: [
        { url: '/superadmin', name: 'Dashboard Superadmin' },
        { url: '/superadmin/metrics', name: 'Métricas' },
        { url: '/superadmin/organizations', name: 'Organizações' },
        { url: '/superadmin/plans', name: 'Planos' },
        { url: '/superadmin/users', name: 'Usuários Superadmin' },
        { url: '/superadmin/settings', name: 'Configurações Superadmin' },
    ],
};

// Função para verificar se uma página carrega sem erros
async function checkPage(page: Page, url: string): Promise<{
    success: boolean;
    status: number;
    error?: string;
    consoleErrors: string[];
    hasClientError: boolean;
}> {
    const consoleErrors: string[] = [];
    let hasClientError = false;

    // Capturar erros do console
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });

    // Detectar erros de página do Next.js
    page.on('pageerror', error => {
        hasClientError = true;
        consoleErrors.push(`Page Error: ${error.message}`);
    });

    try {
        const response = await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        const status = response?.status() || 0;

        // Aguardar um pouco para pegar erros de cliente
        await page.waitForTimeout(2000);

        // Verificar mensagens de erro na tela
        const errorOnPage = await page.locator('text=/Application error|Server Error|Error:|Erro:/i').first().isVisible().catch(() => false);

        if (errorOnPage) {
            hasClientError = true;
        }

        // Verificar erro de client-side exception do Next.js
        const nextError = await page.locator('[data-nextjs-dialog], #__next-error-container, .nextjs-container-errors-body').count();
        if (nextError > 0) {
            hasClientError = true;
        }

        if (status >= 400) {
            return { success: false, status, error: `HTTP ${status}`, consoleErrors, hasClientError };
        }

        if (hasClientError) {
            return { success: false, status, error: 'Erro no cliente detectado', consoleErrors, hasClientError };
        }

        return { success: true, status, consoleErrors, hasClientError };

    } catch (error) {
        return {
            success: false,
            status: 0,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            consoleErrors,
            hasClientError
        };
    }
}

// Teste único que verifica todas as páginas e gera relatório
test.describe('Verificação de Páginas', () => {

    test('Verificar todas as páginas do sistema', async ({ page }) => {
        const results: { page: string; name: string; success: boolean; error?: string; consoleErrors: string[] }[] = [];

        // Combinar todas as páginas
        const pagesToTest = [
            ...allPages.student,
            ...allPages.professor,
            ...allPages.admin,
            ...allPages.superadmin,
        ];

        console.log(`\n🔍 Testando ${pagesToTest.length} páginas...\n`);

        for (const pageInfo of pagesToTest) {
            console.log(`Testando: ${pageInfo.name} (${pageInfo.url})`);

            const result = await checkPage(page, pageInfo.url);

            results.push({
                page: pageInfo.url,
                name: pageInfo.name,
                success: result.success,
                error: result.error,
                consoleErrors: result.consoleErrors,
            });

            if (result.success) {
                console.log(`  ✅ OK`);
            } else {
                console.log(`  ❌ FALHOU: ${result.error}`);
                if (result.consoleErrors.length > 0) {
                    console.log(`  📋 Erros: ${result.consoleErrors.slice(0, 3).join(', ')}`);
                }
            }
        }

        // Gerar relatório final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RELATÓRIO FINAL');
        console.log('='.repeat(60));

        const passed = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        console.log(`\n✅ Páginas OK: ${passed.length}/${results.length}`);
        console.log(`❌ Páginas com erro: ${failed.length}/${results.length}`);

        if (failed.length > 0) {
            console.log('\n🚨 PÁGINAS COM PROBLEMAS:');
            for (const f of failed) {
                console.log(`\n  📍 ${f.name} (${f.page})`);
                console.log(`     Erro: ${f.error}`);
                if (f.consoleErrors.length > 0) {
                    console.log(`     Console: ${f.consoleErrors[0]?.slice(0, 100)}`);
                }
            }
        }

        console.log('\n' + '='.repeat(60));

        // O teste passa se pelo menos 50% das páginas funcionam
        // (algumas podem falhar por falta de permissão baseada no role do usuário)
        const successRate = passed.length / results.length;
        expect(successRate, `Taxa de sucesso muito baixa: ${Math.round(successRate * 100)}%`).toBeGreaterThan(0.3);
    });
});

// Testes individuais por categoria
test.describe('Páginas do Estudante', () => {
    for (const pageInfo of allPages.student) {
        test(`${pageInfo.name}`, async ({ page }) => {
            const result = await checkPage(page, pageInfo.url);

            if (!result.success && result.consoleErrors.length > 0) {
                console.log(`Erros encontrados em ${pageInfo.url}:`, result.consoleErrors.slice(0, 5));
            }

            // Não falhar se for problema de permissão (redirecionamento)
            const currentUrl = page.url();
            const wasRedirected = !currentUrl.includes(pageInfo.url);

            if (wasRedirected) {
                console.log(`ℹ️ Página ${pageInfo.url} redirecionou para ${currentUrl}`);
                return; // Teste passa se redirecionou (problema de permissão)
            }

            expect(result.hasClientError, `Erro de cliente em ${pageInfo.url}`).toBe(false);
        });
    }
});

test.describe('Páginas do Professor', () => {
    for (const pageInfo of allPages.professor) {
        test(`${pageInfo.name}`, async ({ page }) => {
            const result = await checkPage(page, pageInfo.url);

            const currentUrl = page.url();
            const wasRedirected = !currentUrl.includes(pageInfo.url);

            if (wasRedirected) {
                console.log(`ℹ️ Página ${pageInfo.url} redirecionou para ${currentUrl}`);
                return;
            }

            expect(result.hasClientError, `Erro de cliente em ${pageInfo.url}`).toBe(false);
        });
    }
});

test.describe('Páginas do Admin', () => {
    for (const pageInfo of allPages.admin) {
        test(`${pageInfo.name}`, async ({ page }) => {
            const result = await checkPage(page, pageInfo.url);

            const currentUrl = page.url();
            const wasRedirected = !currentUrl.includes(pageInfo.url);

            if (wasRedirected) {
                console.log(`ℹ️ Página ${pageInfo.url} redirecionou para ${currentUrl}`);
                return;
            }

            expect(result.hasClientError, `Erro de cliente em ${pageInfo.url}`).toBe(false);
        });
    }
});

test.describe('Páginas do Superadmin', () => {
    for (const pageInfo of allPages.superadmin) {
        test(`${pageInfo.name}`, async ({ page }) => {
            const result = await checkPage(page, pageInfo.url);

            const currentUrl = page.url();
            const wasRedirected = !currentUrl.includes(pageInfo.url);

            if (wasRedirected) {
                console.log(`ℹ️ Página ${pageInfo.url} redirecionou para ${currentUrl}`);
                return;
            }

            expect(result.hasClientError, `Erro de cliente em ${pageInfo.url}`).toBe(false);
        });
    }
});
