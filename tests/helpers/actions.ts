/**
 * Helpers de ações comuns para testes
 */

import { Page, Locator, expect } from '@playwright/test';
import { TestConstants } from './test-data';

export class TestActions {
    constructor(private page: Page) { }

    /**
     * Aguarda loading desaparecer
     */
    async waitForLoading() {
        await this.page.waitForSelector(TestConstants.SELECTORS.LOADING, {
            state: 'hidden',
            timeout: TestConstants.TIMEOUT.MEDIUM,
        }).catch(() => {
            // Ignora se não houver loading
        });
    }

    /**
     * Aguarda por requisição de rede específica
     */
    async waitForNetworkIdle() {
        await this.page.waitForLoadState('networkidle', {
            timeout: TestConstants.TIMEOUT.LONG,
        });
    }

    /**
     * Clica em um botão e aguarda navegação
     */
    async clickAndWaitForNavigation(locator: Locator, options?: { timeout?: number }) {
        await Promise.all([
            this.page.waitForLoadState('networkidle'),
            locator.click(),
        ]);

        if (options?.timeout) {
            await this.page.waitForTimeout(options.timeout);
        }
    }

    /**
     * Preenche um campo de formulário
     */
    async fillField(locator: Locator, value: string) {
        await locator.click();
        await locator.fill(value);
        await this.page.waitForTimeout(TestConstants.WAIT.DEBOUNCE);
    }

    /**
     * Seleciona uma opção de um select
     */
    async selectOption(locator: Locator, value: string) {
        await locator.click();
        await this.page.waitForTimeout(TestConstants.WAIT.ANIMATION);

        // Tenta diferentes formas de selecionar
        try {
            await locator.selectOption(value);
        } catch {
            // Se não for select nativo, pode ser um custom select (como Radix UI)
            const option = this.page.locator(`[role="option"]:has-text("${value}")`).first();
            await option.click();
        }

        await this.page.waitForTimeout(TestConstants.WAIT.DEBOUNCE);
    }

    /**
     * Upload de arquivo
     */
    async uploadFile(inputLocator: Locator, filePath: string) {
        await inputLocator.setInputFiles(filePath);
        await this.page.waitForTimeout(TestConstants.WAIT.NETWORK);
    }

    /**
     * Aguarda toast/mensagem de sucesso
     */
    async waitForSuccessMessage(text?: string) {
        const selector = TestConstants.SELECTORS.SUCCESS;

        if (text) {
            await expect(this.page.locator(selector).filter({ hasText: text }).first())
                .toBeVisible({ timeout: TestConstants.TIMEOUT.MEDIUM });
        } else {
            await expect(this.page.locator(selector).first())
                .toBeVisible({ timeout: TestConstants.TIMEOUT.MEDIUM });
        }

        // Aguarda a mensagem desaparecer
        await this.page.waitForTimeout(TestConstants.WAIT.NETWORK);
    }

    /**
     * Aguarda toast/mensagem de erro
     */
    async waitForErrorMessage(text?: string) {
        const selector = TestConstants.SELECTORS.ERROR;

        if (text) {
            await expect(this.page.locator(selector).filter({ hasText: text }).first())
                .toBeVisible({ timeout: TestConstants.TIMEOUT.MEDIUM });
        } else {
            await expect(this.page.locator(selector).first())
                .toBeVisible({ timeout: TestConstants.TIMEOUT.MEDIUM });
        }
    }

    /**
     * Fecha modal/diálogo
     */
    async closeModal() {
        const closeButton = this.page.locator('[data-dialog-close], [aria-label*="Fechar"], button:has-text("Fechar")').first();

        if (await closeButton.isVisible()) {
            await closeButton.click();
            await this.page.waitForTimeout(TestConstants.WAIT.ANIMATION);
        }
    }

    /**
     * Navega para uma página e aguarda carregar
     */
    async navigateTo(path: string) {
        await this.page.goto(path, {
            waitUntil: 'domcontentloaded',
            timeout: TestConstants.TIMEOUT.LONG,
        });

        await this.waitForLoading();
        await this.page.waitForTimeout(TestConstants.WAIT.PAGE_LOAD);
    }

    /**
     * Clica em um botão dentro de um card/item específico
     */
    async clickButtonInCard(cardText: string, buttonText: string) {
        const card = this.page.locator(`[data-card], .card, article`).filter({ hasText: cardText }).first();
        const button = card.locator(`button:has-text("${buttonText}")`).first();

        await button.click();
        await this.page.waitForTimeout(TestConstants.WAIT.ANIMATION);
    }

    /**
     * Aguarda elemento estar visível
     */
    async waitForElement(selector: string, options?: { timeout?: number; state?: 'visible' | 'hidden' }) {
        await this.page.waitForSelector(selector, {
            state: options?.state || 'visible',
            timeout: options?.timeout || TestConstants.TIMEOUT.MEDIUM,
        });
    }

    /**
     * Rola até um elemento
     */
    async scrollToElement(locator: Locator) {
        await locator.scrollIntoViewIfNeeded();
        await this.page.waitForTimeout(TestConstants.WAIT.ANIMATION);
    }

    /**
     * Aguarda página estar pronta (sem loading e com network idle)
     */
    async waitForPageReady() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.waitForLoading();
        await this.page.waitForTimeout(TestConstants.WAIT.PAGE_LOAD);
    }

    /**
     * Verifica se há erros na página
     */
    async checkForErrors(): Promise<boolean> {
        const errorElements = await this.page.locator(TestConstants.SELECTORS.ERROR).count();
        const nextErrorContainer = await this.page.locator('[data-nextjs-dialog], #__next-error-container').count();

        return errorElements > 0 || nextErrorContainer > 0;
    }

    /**
     * Tira screenshot com nome descritivo
     */
    async takeScreenshot(name: string) {
        await this.page.screenshot({
            path: `test-results/screenshots/${name}-${Date.now()}.png`,
            fullPage: true,
        });
    }

    /**
     * Preenche formulário completo
     */
    async fillForm(fields: Record<string, string | boolean>) {
        for (const [fieldName, value] of Object.entries(fields)) {
            if (typeof value === 'boolean') {
                // Checkbox
                const checkbox = this.page.locator(`input[type="checkbox"][name="${fieldName}"], input[type="checkbox"]#${fieldName}`).first();

                if (value) {
                    await checkbox.check();
                } else {
                    await checkbox.uncheck();
                }
            } else {
                // Campo de texto
                const input = this.page.locator(`input[name="${fieldName}"], input#${fieldName}, textarea[name="${fieldName}"], textarea#${fieldName}`).first();
                await this.fillField(input, value);
            }
        }
    }

    /**
     * Confirma diálogo de confirmação
     */
    async confirmDialog(confirmText: string = 'Confirmar') {
        const confirmButton = this.page.locator(`button:has-text("${confirmText}")`).first();
        await confirmButton.click();
        await this.page.waitForTimeout(TestConstants.WAIT.ANIMATION);
    }

    /**
     * Cancela diálogo de confirmação
     */
    async cancelDialog(cancelText: string = 'Cancelar') {
        const cancelButton = this.page.locator(`button:has-text("${cancelText}")`).first();
        await cancelButton.click();
        await this.page.waitForTimeout(TestConstants.WAIT.ANIMATION);
    }

    /**
     * Aguarda por redirecionamento
     */
    async waitForRedirect(urlPattern: string | RegExp, timeout?: number) {
        await this.page.waitForURL(urlPattern, {
            timeout: timeout || TestConstants.TIMEOUT.LONG,
        });
    }

    /**
     * Procura por texto na página
     */
    async hasText(text: string): Promise<boolean> {
        const locator = this.page.locator(`text=${text}`).first();
        return await locator.isVisible().catch(() => false);
    }

    /**
     * Clica em tab/aba
     */
    async clickTab(tabName: string) {
        const tab = this.page.locator(`[role="tab"]:has-text("${tabName}"), button:has-text("${tabName}")`).first();
        await tab.click();
        await this.page.waitForTimeout(TestConstants.WAIT.ANIMATION);
    }

    /**
     * Aguarda e retorna URL atual
     */
    getCurrentUrl(): string {
        return this.page.url();
    }

    /**
     * Verifica se está em uma URL específica
     */
    async isAtUrl(urlPattern: string | RegExp): Promise<boolean> {
        const currentUrl = this.getCurrentUrl();

        if (typeof urlPattern === 'string') {
            return currentUrl.includes(urlPattern);
        } else {
            return urlPattern.test(currentUrl);
        }
    }
}

/**
 * Helper para criar instância de TestActions
 */
export function createTestActions(page: Page): TestActions {
    return new TestActions(page);
}
