import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes automatizados
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './tests',
    /* Tempo máximo para cada teste */
    timeout: 60 * 1000,
    expect: {
        timeout: 10000
    },
    /* Rodar testes em paralelo */
    fullyParallel: false,
    /* Falhar o build se houver testes com .only */
    forbidOnly: !!process.env.CI,
    /* Retry em CI */
    retries: process.env.CI ? 2 : 0,
    /* Workers em paralelo */
    workers: 1,
    /* Reporter */
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['list']
    ],
    /* Configuração global */
    use: {
        /* URL base */
        baseURL: 'http://localhost:3000',
        /* Capturar screenshot em falhas */
        screenshot: 'only-on-failure',
        /* Capturar trace em falhas */
        trace: 'on-first-retry',
        /* Capturar vídeo */
        video: 'on-first-retry',
    },
    /* Configurar projetos */
    projects: [
        // Setup de autenticação - roda primeiro
        {
            name: 'setup',
            testMatch: /.*\.setup\.ts/,
        },
        // Testes autenticados - usam o estado salvo do setup
        {
            name: 'authenticated',
            use: {
                ...devices['Desktop Chrome'],
                storageState: '.auth/user.json',
            },
            dependencies: ['setup'],
            testIgnore: /.*\.setup\.ts/,
        },
    ],
    /* Servidor de desenvolvimento */
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
});
