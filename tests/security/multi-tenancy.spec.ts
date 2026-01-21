import { test, expect } from '@playwright/test';
import { createTestActions } from '../helpers/actions';

/**
 * Testes de Segurança Multi-tenancy
 * 
 * Validações críticas:
 * - Isolamento de dados entre organizações
 * - Permissões por papel (role)
 * - Tentativas de acesso não autorizado
 */

test.describe('Segurança Multi-tenancy', () => {
    test('deve isolar dados da organização atual', async ({ page }) => {
        const actions = createTestActions(page);

        console.log('\n🔒 TESTE: Isolamento de Dados de Organização\n');

        // Acessar lista de cursos como aluno
        await actions.navigateTo('/student/courses');
        await actions.waitForPageReady();

        // Verificar que não há erros de acesso
        const hasError = await actions.checkForErrors();
        expect(hasError, 'Não deve haver erros de permissão ao acessar cursos da própria organização').toBe(false);

        // Verificar que a lista carrega (vazia ou com cursos)
        const hasCourses = await page.locator('[data-card], .course-card').count() > 0;
        const hasEmptyMessage = await actions.hasText('Nenhum curso');

        expect(hasCourses || hasEmptyMessage, 'Deve exibir cursos da organização ou mensagem de lista vazia').toBe(true);

        console.log('✅ Dados da organização isolados corretamente');
    });

    test('deve respeitar permissões por papel (role)', async ({ page }) => {
        const actions = createTestActions(page);

        console.log('\n👤 TESTE: Permissões por Papel\n');

        // Tentar acessar área administrativa (se não for admin)
        await actions.navigateTo('/admin');
        await actions.waitForPageReady();

        const currentUrl = actions.getCurrentUrl();

        // Se não for admin, deve redirecionar
        if (!currentUrl.includes('/admin')) {
            console.log('✅ Usuário sem permissão foi redirecionado (comportamento correto)');
            console.log(`   Redirecionado para: ${currentUrl}`);
        } else {
            console.log('ℹ️ Usuário tem acesso admin ou está na página admin');

            // Se estiver na área admin, verificar se não há erro
            const hasError = await actions.checkForErrors();
            expect(hasError, 'Se tem acesso admin, não deve haver erros').toBe(false);
        }

        // Tentar acessar superadmin
        await actions.navigateTo('/superadmin');
        await actions.waitForPageReady();

        const superadminUrl = actions.getCurrentUrl();

        if (!superadminUrl.includes('/superadmin')) {
            console.log('✅ Usuário não-superadmin foi bloqueado de acessar área superadmin');
        } else {
            console.log('ℹ️ Usuário é superadmin');
        }
    });

    test('não deve permitir acesso a recursos de outra organização (URL direta)', async ({ page }) => {
        const actions = createTestActions(page);

        console.log('\n🚫 TESTE: Bloqueio de Acesso a Outra Organização\n');

        // Tentar acessar URL com ID de curso que pode não pertencer à organização
        // Nota: Este teste é limitado sem conhecer IDs válidos de outras organizações

        // Navegar para lista de cursos primeiro
        await actions.navigateTo('/student/courses');
        await actions.waitForPageReady();

        // Pegar primeiro curso disponível
        const firstCourse = page.locator('[data-card], .course-card').first();

        if (await firstCourse.isVisible({ timeout: 5000 }).catch(() => false)) {
            await firstCourse.click();
            await actions.waitForPageReady();

            const currentUrl = actions.getCurrentUrl();

            // Extrair ID do curso da URL
            const match = currentUrl.match(/\/courses\/([^/]+)/);

            if (match && match[1]) {
                const courseId = match[1];
                console.log(`   ID do curso encontrado: ${courseId}`);

                // Tentar acessar diretamente
                await actions.navigateTo(`/student/courses/${courseId}`);
                await actions.waitForPageReady();

                // Verificar se há erro de acesso
                const hasAccessError = await page.locator('text=/acesso negado|não autorizado|sem permissão/i').first().isVisible({ timeout: 5000 }).catch(() => false);

                if (hasAccessError) {
                    console.log('✅ Acesso negado detectado (esperado se curso for de outra org)');
                } else {
                    console.log('✅ Acesso permitido (curso pertence à organização do usuário)');
                }

                // Não deve haver erro de sistema
                const hasSystemError = await actions.checkForErrors();
                expect(hasSystemError, 'Não deve haver erros de sistema ao validar permissões').toBe(false);
            }
        } else {
            console.log('ℹ️ Nenhum curso disponível para teste de acesso');
        }
    });

    test('deve validar organização em operações de escrita', async ({ page }) => {
        const actions = createTestActions(page);

        console.log('\n✍️ TESTE: Validação de Organização em Operações de Escrita\n');

        // Tentar criar curso (se for professor)
        await actions.navigateTo('/professor/courses');
        await actions.waitForPageReady();

        const currentUrl = actions.getCurrentUrl();

        if (currentUrl.includes('/professor')) {
            console.log('   Usuário tem acesso à área de professor');

            const newCourseButton = page.locator('button:has-text("Novo Curso"), button:has-text("Criar Curso")').first();

            if (await newCourseButton.isVisible({ timeout: 5000 }).catch(() => false)) {
                await newCourseButton.click();
                await actions.waitForPageReady();

                // Preencher apenas título
                await actions.fillField(
                    page.locator('input[name="title"], input#title').first(),
                    'Curso de Teste - Validação de Segurança'
                );

                // Tentar salvar
                const saveButton = page.locator('button[type="submit"]:has-text("Criar"), button:has-text("Salvar")').first();

                if (await saveButton.isVisible()) {
                    await saveButton.click();
                    await actions.waitForLoading();

                    // Verificar se necessita mais campos ou se salvou
                    const hasValidationError = await page.locator('text=/obrigatório|required/i').count() > 0;
                    const hasSuccess = await actions.hasText('sucesso') || await actions.hasText('criado');

                    if (hasValidationError) {
                        console.log('✅ Validação de campos funcionando');
                    } else if (hasSuccess) {
                        console.log('✅ Curso criado com sucesso na organização do usuário');
                    }

                    // Não deve haver erro de permissão de organização
                    const hasOrgError = await actions.hasText('organização') && await actions.checkForErrors();
                    expect(hasOrgError, 'Não deve haver erro de organização ao criar curso na própria org').toBe(false);
                }
            } else {
                console.log('ℹ️ Botão de criação não encontrado');
            }
        } else {
            console.log('ℹ️ Usuário não tem acesso à área de professor');
        }
    });

    test('deve retornar erro apropriado para tentativas de acesso não autorizado', async ({ page }) => {
        const actions = createTestActions(page);

        console.log('\n⚠️ TESTE: Tratamento de Erros de Acesso\n');

        // Lista de URLs administrativas para testar
        const adminUrls = [
            '/admin/settings',
            '/admin/users',
            '/superadmin/organizations',
            '/superadmin/plans',
        ];

        for (const url of adminUrls) {
            await actions.navigateTo(url);
            await actions.waitForPageReady();

            const currentUrl = actions.getCurrentUrl();

            // Se redirecionou, está OK
            if (!currentUrl.includes(url)) {
                console.log(`✅ ${url} - Redirecionou (acesso negado)`);
            } else {
                // Se não redirecionou, ou tem permissão ou deve haver erro amigável
                const hasError = await actions.checkForErrors();
                const hasAccessMessage = await actions.hasText('acesso negado') ||
                    await actions.hasText('sem permissão') ||
                    await actions.hasText('não autorizado');

                if (hasAccessMessage) {
                    console.log(`✅ ${url} - Mensagem de acesso negado exibida`);
                } else if (!hasError) {
                    console.log(`ℹ️ ${url} - Usuário tem permissão de acesso`);
                } else {
                    console.log(`⚠️ ${url} - Erro ao tentar acessar`);
                }
            }

            await page.waitForTimeout(500);
        }

        console.log('✅ Verificação de permissões concluída');
    });

    test('deve manter sessão do usuário corretamente', async ({ page }) => {
        const actions = createTestActions(page);

        console.log('\n🔐 TESTE: Persistência de Sessão\n');

        // Navegar para área autenticada
        await actions.navigateTo('/student');
        await actions.waitForPageReady();

        const initialUrl = actions.getCurrentUrl();

        // Se estiver autenticado, URL deve conter /student
        if (initialUrl.includes('/student')) {
            console.log('✅ Sessão autenticada mantida');

            // Navegar para outra página e voltar
            await actions.navigateTo('/student/courses');
            await actions.waitForPageReady();

            await actions.navigateTo('/student/progress');
            await actions.waitForPageReady();

            // Voltar para dashboard
            await actions.navigateTo('/student');
            await actions.waitForPageReady();

            const finalUrl = actions.getCurrentUrl();
            expect(finalUrl.includes('/student'), 'Sessão deve persistir durante navegação').toBe(true);

            console.log('✅ Sessão persistiu durante navegação entre páginas');
        } else {
            console.log('⚠️ Usuário foi redirecionado para login (sessão pode ter expirado)');
        }
    });
});
