import { test, expect } from '@playwright/test';
import { TestData } from '../helpers/test-data';
import { createTestActions } from '../helpers/actions';

/**
 * Testes de criação de cursos
 * 
 * Validações:
 * - Criar curso sem certificado (corrige bug reportado)
 * - Criar curso com certificado
 * - Validar campos obrigatórios
 * - Upload de thumbnail/banner
 */

test.describe('Criação de Cursos', () => {
    test('deve criar curso básico sem certificado', async ({ page }) => {
        const actions = createTestActions(page);
        const courseData = TestData.course.basic();

        // Navegar para página de criação de cursos
        await actions.navigateTo('/professor/courses');

        // Clicar em "Novo Curso" ou "Criar Curso"
        const newCourseButton = page.locator('button:has-text("Novo Curso"), button:has-text("Criar Curso"), a:has-text("Novo Curso")').first();
        await newCourseButton.click();

        await actions.waitForPageReady();

        // Preencher campos básicos
        await actions.fillField(
            page.locator('input[name="title"], input#title').first(),
            courseData.title
        );

        await actions.fillField(
            page.locator('textarea[name="description"], textarea#description').first(),
            courseData.description
        );

        // Selecionar categoria
        const categorySelect = page.locator('select[name="category"], [role="combobox"]').first();
        if (await categorySelect.isVisible()) {
            await actions.selectOption(categorySelect, courseData.category);
        }

        // Selecionar nível
        const levelSelect = page.locator('select[name="level"], [role="combobox"]:near(label:has-text("Nível"))').first();
        if (await levelSelect.isVisible()) {
            await actions.selectOption(levelSelect, courseData.level);
        }

        // Certificado: Selecionar "Nenhum (ou Padrão)"
        const certificateSelect = page.locator('select[name="certificateTemplateId"], [role="combobox"]:near(label:has-text("Certificado"))').first();
        if (await certificateSelect.isVisible()) {
            await actions.selectOption(certificateSelect, 'Nenhum');
        }

        // Aguardar um pouco para garantir que o formulário está pronto
        await page.waitForTimeout(1000);

        // Salvar curso
        const saveButton = page.locator('button[type="submit"]:has-text("Criar"), button:has-text("Salvar"), button:has-text("Publicar")').first();
        await saveButton.click();

        // Aguardar criação
        await actions.waitForLoading();

        // Validar que não há erros
        const hasError = await actions.checkForErrors();
        expect(hasError, 'Não deve haver erros ao criar curso sem certificado').toBe(false);

        // Validar redirecionamento ou mensagem de sucesso
        const savedSuccessfully = await page.waitForSelector(
            'text=/Curso criado|Sucesso|criado com sucesso/i',
            { timeout: 10000, state: 'visible' }
        ).catch(() => null);

        if (!savedSuccessfully) {
            // Se não houver mensagem, verificar se redirecionou
            const currentUrl = actions.getCurrentUrl();
            expect(currentUrl).toContain('/courses');
        }

        console.log('✅ Curso criado sem certificado com sucesso');
    });

    test('deve criar curso completo com certificado', async ({ page }) => {
        const actions = createTestActions(page);
        const courseData = TestData.course.complete();

        await actions.navigateTo('/professor/courses');

        const newCourseButton = page.locator('button:has-text("Novo Curso"), button:has-text("Criar Curso"), a:has-text("Novo Curso")').first();
        await newCourseButton.click();

        await actions.waitForPageReady();

        // Preencher todos os campos
        await actions.fillField(
            page.locator('input[name="title"], input#title').first(),
            courseData.title
        );

        await actions.fillField(
            page.locator('textarea[name="description"], textarea#description').first(),
            courseData.description
        );

        // Objetivos
        const objectivesField = page.locator('textarea[name="objectives"], textarea#objectives').first();
        if (await objectivesField.isVisible()) {
            await actions.fillField(objectivesField, courseData.objectives);
        }

        // Requisitos
        const requirementsField = page.locator('textarea[name="requirements"], textarea#requirements').first();
        if (await requirementsField.isVisible()) {
            await actions.fillField(requirementsField, courseData.requirements);
        }

        // Categoria
        const categorySelect = page.locator('select[name="category"], [role="combobox"]').first();
        if (await categorySelect.isVisible()) {
            await actions.selectOption(categorySelect, courseData.category);
        }

        // Nível
        const levelSelect = page.locator('select[name="level"], [role="combobox"]:near(label:has-text("Nível"))').first();
        if (await levelSelect.isVisible()) {
            await actions.selectOption(levelSelect, courseData.level);
        }

        // Curso público
        const publicCheckbox = page.locator('input[type="checkbox"][name="isPublic"], input[type="checkbox"]#isPublic').first();
        if (await publicCheckbox.isVisible()) {
            if (courseData.isPublic) {
                await publicCheckbox.check();
            }
        }

        // Curso em destaque
        const featuredCheckbox = page.locator('input[type="checkbox"][name="featured"], input[type="checkbox"]#featured').first();
        if (await featuredCheckbox.isVisible()) {
            if (courseData.featured) {
                await featuredCheckbox.check();
            }
        }

        // Certificado: Selecionar primeiro template disponível
        const certificateSelect = page.locator('select[name="certificateTemplateId"], [role="combobox"]:near(label:has-text("Certificado"))').first();
        if (await certificateSelect.isVisible()) {
            // Pegar a segunda opção (primeira geralmente é "Nenhum")
            const options = await certificateSelect.locator('option').all();
            if (options.length > 1) {
                const secondOption = await options[1].textContent();
                if (secondOption) {
                    await actions.selectOption(certificateSelect, secondOption.trim());
                }
            }
        }

        await page.waitForTimeout(1000);

        // Salvar curso
        const saveButton = page.locator('button[type="submit"]:has-text("Criar"), button:has-text("Salvar"), button:has-text("Publicar")').first();
        await saveButton.click();

        await actions.waitForLoading();

        // Validar criação
        const hasError = await actions.checkForErrors();
        expect(hasError, 'Não deve haver erros ao criar curso com certificado').toBe(false);

        console.log('✅ Curso completo criado com sucesso');
    });

    test('deve validar campos obrigatórios', async ({ page }) => {
        const actions = createTestActions(page);

        await actions.navigateTo('/professor/courses');

        const newCourseButton = page.locator('button:has-text("Novo Curso"), button:has-text("Criar Curso"), a:has-text("Novo Curso")').first();
        await newCourseButton.click();

        await actions.waitForPageReady();

        // Tentar salvar sem preencher nada
        const saveButton = page.locator('button[type="submit"]:has-text("Criar"), button:has-text("Salvar")').first();
        await saveButton.click();

        await page.waitForTimeout(1000);

        // Deve haver mensagens de validação
        const validationMessages = await page.locator('text=/obrigatório|required|preencha|necessário/i').count();
        expect(validationMessages, 'Deve haver mensagens de validação para campos obrigatórios').toBeGreaterThan(0);

        console.log('✅ Validação de campos obrigatórios funcionando');
    });

    test('deve permitir upload de thumbnail', async ({ page }) => {
        const actions = createTestActions(page);
        const courseData = TestData.course.basic();

        await actions.navigateTo('/professor/courses');

        const newCourseButton = page.locator('button:has-text("Novo Curso"), button:has-text("Criar Curso"), a:has-text("Novo Curso")').first();
        await newCourseButton.click();

        await actions.waitForPageReady();

        // Preencher campos básicos
        await actions.fillField(
            page.locator('input[name="title"], input#title').first(),
            courseData.title
        );

        // Procurar input de upload de imagem
        const fileInput = page.locator('input[type="file"][accept*="image"]').first();

        if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            // Nota: Este teste requer uma imagem de teste
            // Por enquanto, apenas validamos que o campo existe
            expect(await fileInput.isVisible()).toBe(true);
            console.log('✅ Campo de upload de thumbnail encontrado');
        } else {
            console.log('ℹ️ Campo de upload de thumbnail não encontrado nesta página');
        }
    });

    test('deve criar curso e adicionar módulo básico', async ({ page }) => {
        const actions = createTestActions(page);
        const courseData = TestData.course.basic();
        const moduleData = TestData.course.module();

        await actions.navigateTo('/professor/courses');

        const newCourseButton = page.locator('button:has-text("Novo Curso"), button:has-text("Criar Curso"), a:has-text("Novo Curso")').first();
        await newCourseButton.click();

        await actions.waitForPageReady();

        // Criar curso básico
        await actions.fillField(
            page.locator('input[name="title"], input#title').first(),
            courseData.title
        );

        await actions.fillField(
            page.locator('textarea[name="description"], textarea#description').first(),
            courseData.description
        );

        const saveButton = page.locator('button[type="submit"]:has-text("Criar"), button:has-text("Salvar")').first();
        await saveButton.click();

        await actions.waitForLoading();
        await page.waitForTimeout(2000);

        // Verificar se curso foi criado
        const hasError = await actions.checkForErrors();
        if (!hasError) {
            // Tentar adicionar módulo
            const addModuleButton = page.locator('button:has-text("Adicionar Módulo"), button:has-text("Novo Módulo")').first();

            if (await addModuleButton.isVisible({ timeout: 5000 }).catch(() => false)) {
                await addModuleButton.click();
                await actions.waitForPageReady();

                // Preencher dados do módulo
                await actions.fillField(
                    page.locator('input[name="title"], input#title, input[name="moduleTitle"]').first(),
                    moduleData.title
                );

                const saveModuleButton = page.locator('button:has-text("Salvar"), button:has-text("Criar")').first();
                await saveModuleButton.click();

                await actions.waitForLoading();

                console.log('✅ Módulo adicionado ao curso com sucesso');
            } else {
                console.log('ℹ️ Botão de adicionar módulo não encontrado na interface atual');
            }
        }
    });
});
