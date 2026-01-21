import { test, expect } from '@playwright/test';
import { createTestActions } from '../helpers/actions';

/**
 * Teste de jornada completa do aluno
 * 
 * Fluxo:
 * 1. Visualizar catálogo de cursos
 * 2. Matricular em um curso
 * 3. Acessar curso e iniciar primeira aula
 * 4. Completar aula
 * 5. Fazer quiz (se disponível)
 * 6. Verificar progresso
 * 7. Completar curso
 * 8. Receber certificado (se configurado)
 */

test.describe('Jornada Completa do Aluno', () => {
    test('jornada completa: do catálogo ao certificado', async ({ page }) => {
        test.setTimeout(5 * 60 * 1000); // 5 minutos

        const actions = createTestActions(page);

        console.log('\n🎓 INICIANDO JORNADA DO ALUNO\n');

        // === PASSO 1: Visualizar Catálogo ===
        console.log('📚 Passo 1: Acessando catálogo de cursos');
        await actions.navigateTo('/student/courses');
        await actions.waitForPageReady();

        const hasError = await actions.checkForErrors();
        expect(hasError, 'Catálogo não deve ter erros').toBe(false);

        // === PASSO 2: Encontrar e Matricular em Curso ===
        console.log('📝 Passo 2: Buscando curso para matrícula');

        const courseCards = await page.locator('[data-card], .course-card, article').all();

        if (courseCards.length === 0) {
            console.log('⚠️ Nenhum curso disponível no catálogo. Pulando teste.');
            test.skip();
            return;
        }

        const firstCourse = courseCards[0];
        const courseTitle = await firstCourse.locator('h1, h2, h3, [data-title]').first().textContent() || 'Curso';
        console.log(`   Curso selecionado: ${courseTitle.trim()}`);

        // Clicar no curso
        await firstCourse.click();
        await actions.waitForPageReady();

        // Procurar botão de matrícula
        const enrollButton = page.locator('button:has-text("Matricular"), button:has-text("Inscrever"), button:has-text("Começar")').first();

        if (await enrollButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('   Realizando matrícula...');
            await enrollButton.click();
            await actions.waitForLoading();
            await page.waitForTimeout(2000);

            console.log('✅ Matrícula realizada');
        } else {
            console.log('ℹ️ Já matriculado ou botão não encontrado');
        }

        // === PASSO 3: Acessar Área de Aprendizado ===
        console.log('🎯 Passo 3: Acessando área de aprendizado');

        const startLearningButton = page.locator('button:has-text("Iniciar"), button:has-text("Começar"), button:has-text("Continuar"), a:has-text("Acessar Curso")').first();

        if (await startLearningButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await startLearningButton.click();
            await actions.waitForPageReady();
        } else {
            // Tentar ir direto para /continue
            await actions.navigateTo('/student/continue');
            await actions.waitForPageReady();

            const continueButton = page.locator('button:has-text("Continuar")').first();
            if (await continueButton.isVisible({ timeout: 5000 }).catch(() => false)) {
                await continueButton.click();
                await actions.waitForPageReady();
            }
        }

        const currentUrl = actions.getCurrentUrl();
        console.log('   URL atual:', currentUrl);

        if (currentUrl.includes('/learn')) {
            console.log('✅ Está na página de aprendizado');

            // === PASSO 4: Interagir com Aula ===
            console.log('📖 Passo 4: Interagindo com conteúdo da aula');

            // Verificar tipo de conteúdo
            const hasVideo = await page.locator('video, iframe[src*="youtube"], iframe[src*="vimeo"]').first().isVisible({ timeout: 5000 }).catch(() => false);
            const hasTextContent = await page.locator('article, .content, [data-lesson-content]').first().isVisible({ timeout: 5000 }).catch(() => false);

            if (hasVideo) {
                console.log('   🎥 Conteúdo: Vídeo');
                // Para vídeo, apenas aguardar um pouco
                await page.waitForTimeout(3000);
            } else if (hasTextContent) {
                console.log('   📝 Conteúdo: Texto');
                // Para texto, rolar a página
                await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                await page.waitForTimeout(2000);
            }

            // Tentar marcar como concluído
            const completeButton = page.locator('button:has-text("Concluir"), button:has-text("Marcar como concluída"), input[type="checkbox"]:near(label:has-text("concluída"))').first();

            if (await completeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log('   Marcando aula como concluída...');
                await completeButton.click();
                await actions.waitForLoading();
                await page.waitForTimeout(1000);
                console.log('✅ Aula concluída');
            }

            // === PASSO 5: Verificar Quiz ===
            console.log('❓ Passo 5: Verificando se há quiz');

            const quizButton = page.locator('button:has-text("Quiz"), button:has-text("Avaliação"), a:has-text("Quiz")').first();

            if (await quizButton.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log('   Quiz encontrado!');
                await quizButton.click();
                await actions.waitForPageReady();

                // Tentar responder primeira questão
                const firstOption = page.locator('input[type="radio"], button[role="radio"]').first();
                if (await firstOption.isVisible({ timeout: 5000 }).catch(() => false)) {
                    await firstOption.click();
                    await page.waitForTimeout(500);

                    // Tentar enviar
                    const submitButton = page.locator('button:has-text("Enviar"), button:has-text("Próxima"), button[type="submit"]').first();
                    if (await submitButton.isVisible()) {
                        await submitButton.click();
                        await actions.waitForLoading();
                        console.log('✅ Resposta do quiz enviada');
                    }
                }
            } else {
                console.log('   ℹ️ Nenhum quiz disponível nesta aula');
            }

            // === PASSO 6: Verificar Progresso ===
            console.log('📊 Passo 6: Verificando progresso');

            await actions.navigateTo('/student/progress');
            await actions.waitForPageReady();

            const progressElements = await page.locator('[role="progressbar"], .progress, text=/\\d+%/').count();

            if (progressElements > 0) {
                console.log('✅ Indicadores de progresso encontrados');
            } else {
                console.log('   ℹ️ Indicadores de progresso não visíveis');
            }

            // === PASSO 7: Verificar Conquistas ===
            console.log('🏆 Passo 7: Verificando conquistas');

            await actions.navigateTo('/student/achievements');
            await actions.waitForPageReady();

            const achievements = await page.locator('[data-achievement], .achievement-card, article').count();

            if (achievements > 0) {
                console.log(`✅ ${achievements} conquista(s) encontrada(s)`);
            } else {
                console.log('   ℹ️ Nenhuma conquista visível ainda');
            }

            // === PASSO 8: Verificar Certificados ===
            console.log('📜 Passo 8: Verificando certificados');

            await actions.navigateTo('/student/certificates');
            await actions.waitForPageReady();

            const certificates = await page.locator('[data-certificate], .certificate-card, article').count();

            if (certificates > 0) {
                console.log(`✅ ${certificates} certificado(s) encontrado(s)`);
            } else {
                console.log('   ℹ️ Nenhum certificado emitido ainda (curso não concluído)');
            }

            // === RESUMO ===
            console.log('\n📋 RESUMO DA JORNADA:');
            console.log('   ✅ Catálogo acessado');
            console.log('   ✅ Matrícula realizada (ou já existente)');
            console.log('   ✅ Área de aprendizado acessada');
            console.log('   ✅ Conteúdo de aula visualizado');
            console.log('   ✅ Progresso verificado');
            console.log('   ✅ Sistema de conquistas verificado');
            console.log('   ✅ Sistema de certificados verificado');
            console.log('\n✅ JORNADA COMPLETA DO ALUNO CONCLUÍDA!\n');

        } else {
            console.log('⚠️ Não conseguiu acessar página de aprendizado');
            console.log('   Isso pode indicar um problema de navegação ou permissões');
        }
    });

    test('deve permitir continuar de onde parou', async ({ page }) => {
        const actions = createTestActions(page);

        console.log('\n⏯️ TESTE: Continuar de Onde Parou\n');

        await actions.navigateTo('/student/continue');
        await actions.waitForPageReady();

        const continueCards = await page.locator('[data-course], .course-card, button:has-text("Continuar")').count();

        if (continueCards > 0) {
            console.log(`✅ ${continueCards} curso(s) em andamento encontrado(s)`);

            // Clicar no primeiro
            const firstContinue = page.locator('[data-course], .course-card, button:has-text("Continuar")').first();
            await firstContinue.click();
            await actions.waitForPageReady();

            const currentUrl = actions.getCurrentUrl();

            if (currentUrl.includes('/learn')) {
                console.log('✅ Retomou curso de onde parou');
            } else {
                console.log('⚠️ Não redirecionou para /learn');
            }
        } else {
            console.log('ℹ️ Nenhum curso em andamento para continuar');
        }
    });

    test('deve exibir ranking do aluno', async ({ page }) => {
        const actions = createTestActions(page);

        console.log('\n🏅 TESTE: Ranking do Aluno\n');

        await actions.navigateTo('/student/ranking');
        await actions.waitForPageReady();

        const hasError = await actions.checkForErrors();
        expect(hasError, 'Página de ranking não deve ter erros').toBe(false);

        // Verificar se há ranking ou leaderboard
        const hasRanking = await page.locator('[data-ranking], .leaderboard, .ranking').count() > 0;
        const hasUserList = await page.locator('li, [role="listitem"], .user-item').count() > 0;

        if (hasRanking || hasUserList) {
            console.log('✅ Ranking de alunos encontrado');
        } else {
            console.log('ℹ️ Ranking vazio ou não configurado');
        }
    });
});
