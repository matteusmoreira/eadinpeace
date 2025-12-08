import { test as setup, expect } from '@playwright/test';
import path from 'path';

/**
 * Setup de autenticação - faz login e salva o estado para reutilizar nos testes
 */

const authFile = path.join(__dirname, '../.auth/user.json');

setup('autenticar no sistema', async ({ page }) => {
    // Navegar para a página de login
    await page.goto('/sign-in');

    // Aguardar o formulário de login do Clerk carregar
    await page.waitForLoadState('networkidle');

    // Preencher as credenciais
    // O Clerk pode ter diferentes seletores, vamos tentar identificar os campos

    // Aguardar o campo de email aparecer
    await page.waitForSelector('input[name="identifier"], input[type="email"], input[id*="email"], input[autocomplete="email"]', { timeout: 30000 });

    // Preencher o email
    const emailInput = page.locator('input[name="identifier"], input[type="email"], input[id*="email"], input[autocomplete="email"]').first();
    await emailInput.fill('matteusmoreira@gmail.com');

    // Clicar no botão de continuar/enviar
    const continueButton = page.locator('button[type="submit"], button:has-text("Continuar"), button:has-text("Continue"), button:has-text("Entrar"), button:has-text("Sign in")').first();
    await continueButton.click();

    // Aguardar o campo de senha aparecer
    await page.waitForSelector('input[type="password"], input[name="password"]', { timeout: 30000 });

    // Preencher a senha
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.fill('@Moreira2025');

    // Clicar no botão de login
    const loginButton = page.locator('button[type="submit"], button:has-text("Continuar"), button:has-text("Continue"), button:has-text("Entrar"), button:has-text("Sign in")').first();
    await loginButton.click();

    // Aguardar redirecionamento após login (deve ir para o dashboard)
    await page.waitForURL(/\/(student|professor|admin|superadmin|dashboard)/, { timeout: 60000 });

    console.log('✅ Login realizado com sucesso!');
    console.log('📍 URL atual:', page.url());

    // Salvar o estado de autenticação
    await page.context().storageState({ path: authFile });

    console.log('💾 Estado de autenticação salvo em:', authFile);
});
