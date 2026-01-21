import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Setup de autenticação para PROFESSOR
 */

const authFile = path.join(__dirname, '../.auth/professor.json');

setup('autenticar como professor', async ({ page }) => {
    fs.mkdirSync(path.dirname(authFile), { recursive: true });

    const email = process.env.E2E_PROFESSOR_EMAIL;
    const password = process.env.E2E_PROFESSOR_PASSWORD;

    if (!email || !password) {
        console.log('⚠️ Credenciais de PROFESSOR não configuradas em .env.local');
        console.log('   Configure E2E_PROFESSOR_EMAIL e E2E_PROFESSOR_PASSWORD');
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await page.context().storageState({ path: authFile });
        return;
    }

    console.log('👨‍🏫 Fazendo login como PROFESSOR:', email);

    await page.goto('/sign-in');
    await page.waitForSelector('input[name="identifier"], input[type="email"]', { timeout: 30000 });

    // Preencher email
    const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();
    await emailInput.fill(email);

    // Continuar
    const continueButton = page.locator('button[type="submit"]').first();
    await continueButton.click();

    // Preencher senha
    await page.waitForSelector('input[type="password"]', { timeout: 30000 });
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(password);

    // Login
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    // Aguardar redirecionamento
    await page.waitForURL(/\/(professor|dashboard)/, { timeout: 60000 });

    console.log('✅ Login de PROFESSOR realizado com sucesso!');
    console.log('📍 URL:', page.url());

    // Salvar estado
    await page.context().storageState({ path: authFile });
    console.log('💾 Estado salvo em:', authFile);
});
