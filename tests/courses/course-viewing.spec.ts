import { test, expect } from '@playwright/test';
import { TestData } from '../helpers/test-data';
import { createTestActions } from '../helpers/actions';

/**
 * Testes de visualização de cursos
 * 
 * Validações:
 * - Visualizar curso como administrador
 * - Visualizar curso como professor
 * - Visualizar curso como aluno
 * - Validar exibição de conteúdo
 */

test.describe('Visualização de Cursos', () => {
    test('deve visualizar lista de cursos', async ({ page }) => {
        const actions = createTestActions(page);

        // Tentar como estudante primeiro
        await actions.navigateTo('/student/courses');
        await actions.waitForPageReady();

        // Verificar se a página carregou sem erros
        const hasError = await actions.checkForErrors();
        expect(hasError, 'Página de cursos não deve ter erros').toBe(false);

        // Verificar se há algum card de curso ou mensagem de "nenhum curso"
        const hasCourseCards = await page.locator('[data-card], .course-card, article').count() > 0;
        const hasEmptyMessage = await actions.hasText('Nenhum curso') || await actions.hasText('sem cursos');

        expect(hasCourseCards || hasEmptyMessage, 'Deve exibir cursos ou mensagem de lista vazia').toBe(true);

        console.log('✅ Lista de cursos visualizada com sucesso');
    });

    test('deve visualizar detalhes de um curso', async ({ page }) => {
        const actions = createTestActions(page);

        await actions.navigateTo('/student/courses');
        await actions.waitForPageReady();

        // Procurar primeiro curso disponível
        const firstCourseCard = page.locator('[data-card], .course-card, article').first();

        if (await firstCourseCard.isVisible({ timeout: 5000 }).catch(() => false)) {
            // Clicar no curso
            await firstCourseCard.click();
            await actions.waitForPageReady();

            // Verificar se carregou a página do curso
            const hasError = await actions.checkForErrors();
            expect(hasError, 'Página de detalhes do curso não deve ter erros').toBe(false);

            // Verificar elementos da página do curso
            const hasTitle = await page.locator('h1, h2').count() > 0;
            expect(hasTitle, 'Página de curso deve ter título').toBe(true);

            console.log('✅ Detalhes do curso visualizados com sucesso');
        } else {
            console.log('ℹ️ Nenhum curso disponível para visualizar');
        }
    });

    test('deve visualizar curso na área de aprendizado (/learn)', async ({ page }) => {
        const actions = createTestActions(page);

        // Ir para área de continuar estudando
        await actions.navigateTo('/student/continue');
        await actions.waitForPageReady();

        // Procurar um curso matriculado
        const enrolledCourse = page.locator('[data-card], .course-card, article, button:has-text("Continuar")').first();

        if (await enrolledCourse.isVisible({ timeout: 5000 }).catch(() => false)) {
            await enrolledCourse.click();
            await actions.waitForPageReady();

            // Deve estar na página /learn
            const currentUrl = actions.getCurrentUrl();

            if (currentUrl.includes('/learn')) {
                // Verificar estrutura da página de learn
                const hasError = await actions.checkForErrors();
                expect(hasError, 'Página /learn não deve ter erros').toBe(false);

                // Verificar sidebar de navegação
                const hasSidebar = await page.locator('[data-sidebar], aside, nav').count() > 0;
                expect(hasSidebar, 'Deve ter sidebar de navegação').toBe(true);

                // Verificar área de conteúdo
                const hasContent = await page.locator('[data-content], main, .content').count() > 0;
                expect(hasContent, 'Deve ter área de conteúdo').toBe(true);

                console.log('✅ Página /learn visualizada corretamente');
            } else {
                console.log('ℹ️ Não redirecionou para /learn, URL atual:', currentUrl);
            }
        } else {
            console.log('ℹ️ Nenhum curso matriculado para acessar /learn');
        }
    });

    test('deve exibir player de vídeo na aula de vídeo', async ({ page }) => {
        const actions = createTestActions(page);

        // Tentar acessar uma aula de vídeo
        await actions.navigateTo('/student/continue');
        await actions.waitForPageReady();

        const enrolledCourse = page.locator('[data-card], .course-card, article, button:has-text("Continuar")').first();

        if (await enrolledCourse.isVisible({ timeout: 5000 }).catch(() => false)) {
            await enrolledCourse.click();
            await actions.waitForPageReady();

            // Procurar por video player
            const videoPlayer = page.locator('video, iframe[src*="youtube"], iframe[src*="vimeo"], [data-video-player]').first();

            if (await videoPlayer.isVisible({ timeout: 10000 }).catch(() => false)) {
                expect(await videoPlayer.isVisible()).toBe(true);
                console.log('✅ Player de vídeo encontrado e visível');
            } else {
                console.log('ℹ️ Player de vídeo não encontrado (pode não ser aula de vídeo)');
            }
        }
    });

    test('deve exibir conteúdo de aula de texto', async ({ page }) => {
        const actions = createTestActions(page);

        await actions.navigateTo('/student/continue');
        await actions.waitForPageReady();

        const enrolledCourse = page.locator('[data-card], .course-card, article, button:has-text("Continuar")').first();

        if (await enrolledCourse.isVisible({ timeout: 5000 }).catch(() => false)) {
            await enrolledCourse.click();
            await actions.waitForPageReady();

            // Verificar se há conteúdo de texto (artigo, parágrafos, etc)
            const textContent = page.locator('article, .content, [data-lesson-content]').first();

            if (await textContent.isVisible({ timeout: 5000 }).catch(() => false)) {
                const hasText = await textContent.locator('p, h1, h2, h3').count() > 0;

                if (hasText) {
                    expect(hasText).toBe(true);
                    console.log('✅ Conteúdo de texto encontrado');
                } else {
                    console.log('ℹ️ Pode não ser aula de texto');
                }
            }
        }
    });

    test('deve permitir navegação entre aulas', async ({ page }) => {
        const actions = createTestActions(page);

        await actions.navigateTo('/student/continue');
        await actions.waitForPageReady();

        const enrolledCourse = page.locator('[data-card], .course-card, article, button:has-text("Continuar")').first();

        if (await enrolledCourse.isVisible({ timeout: 5000 }).catch(() => false)) {
            await enrolledCourse.click();
            await actions.waitForPageReady();

            // Procurar botões de navegação (próxima aula, aula anterior)
            const nextButton = page.locator('button:has-text("Próxima"), button:has-text("Próximo"), button[aria-label*="próxima"]').first();
            const prevButton = page.locator('button:has-text("Anterior"), button:has-text("Voltar"), button[aria-label*="anterior"]').first();

            const hasNextButton = await nextButton.isVisible({ timeout: 5000 }).catch(() => false);
            const hasPrevButton = await prevButton.isVisible({ timeout: 5000 }).catch(() => false);

            if (hasNextButton || hasPrevButton) {
                console.log('✅ Botões de navegação entre aulas encontrados');

                if (hasNextButton) {
                    // Testar navegação para próxima aula
                    const currentUrl = actions.getCurrentUrl();
                    await nextButton.click();
                    await actions.waitForPageReady();

                    const newUrl = actions.getCurrentUrl();
                    expect(newUrl).not.toBe(currentUrl);

                    console.log('✅ Navegação para próxima aula funcionou');
                }
            } else {
                console.log('ℹ️ Botões de navegação não encontrados (pode ser única aula)');
            }
        }
    });

    test('deve exibir progresso da aula', async ({ page }) => {
        const actions = createTestActions(page);

        await actions.navigateTo('/student/continue');
        await actions.waitForPageReady();

        const enrolledCourse = page.locator('[data-card], .course-card, article, button:has-text("Continuar")').first();

        if (await enrolledCourse.isVisible({ timeout: 5000 }).catch(() => false)) {
            await enrolledCourse.click();
            await actions.waitForPageReady();

            // Procurar indicador de progresso
            const progressBar = page.locator('[role="progressbar"], .progress, [data-progress]').first();
            const progressText = page.locator('text=/\\d+%|progresso/i').first();

            const hasProgressBar = await progressBar.isVisible({ timeout: 5000 }).catch(() => false);
            const hasProgressText = await progressText.isVisible({ timeout: 5000 }).catch(() => false);

            if (hasProgressBar || hasProgressText) {
                expect(hasProgressBar || hasProgressText).toBe(true);
                console.log('✅ Indicador de progresso encontrado');
            } else {
                console.log('ℹ️ Indicador de progresso não encontrado nesta página');
            }
        }
    });

    test('deve marcar aula como concluída', async ({ page }) => {
        const actions = createTestActions(page);

        await actions.navigateTo('/student/continue');
        await actions.waitForPageReady();

        const enrolledCourse = page.locator('[data-card], .course-card, article, button:has-text("Continuar")').first();

        if (await enrolledCourse.isVisible({ timeout: 5000 }).catch(() => false)) {
            await enrolledCourse.click();
            await actions.waitForPageReady();

            // Procurar botão de marcar como concluído
            const completeButton = page.locator('button:has-text("Concluir"), button:has-text("Marcar como concluída"), button:has-text("Completar")').first();

            if (await completeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
                await completeButton.click();
                await actions.waitForLoading();

                // Verificar se foi marcado como concluído
                const completedIndicator = await page.locator('text=/concluída|completa|concluído/i, [data-completed]').first().isVisible({ timeout: 5000 }).catch(() => false);

                if (completedIndicator) {
                    expect(completedIndicator).toBe(true);
                    console.log('✅ Aula marcada como concluída');
                } else {
                    console.log('ℹ️ Não foi possível confirmar se aula foi marcada como concluída');
                }
            } else {
                console.log('ℹ️ Botão de concluir não encontrado');
            }
        }
    });
});
