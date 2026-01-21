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
        // ============================================
        // SETUP - Autenticação para cada tipo de usuário
        // ============================================
        {
            name: 'setup-student',
            testMatch: /.*auth-student\.setup\.ts/,
        },
        {
            name: 'setup-professor',
            testMatch: /.*auth-professor\.setup\.ts/,
        },
        {
            name: 'setup-admin',
            testMatch: /.*auth-admin\.setup\.ts/,
        },

        // ============================================
        // TESTES COMO ALUNO
        // ============================================
        {
            name: 'student',
            use: {
                ...devices['Desktop Chrome'],
                storageState: '.auth/student.json',
            },
            dependencies: ['setup-student'],
            testMatch: [
                '**/tests/student/**/*.spec.ts',
                '**/tests/courses/course-viewing.spec.ts',
                '**/tests/integration/full-student-journey.spec.ts',
            ],
        },

        // ============================================
        // TESTES COMO PROFESSOR
        // ============================================
        {
            name: 'professor',
            use: {
                ...devices['Desktop Chrome'],
                storageState: '.auth/professor.json',
            },
            dependencies: ['setup-professor'],
            testMatch: [
                '**/tests/courses/course-creation.spec.ts',
                '**/tests/courses/course-editing.spec.ts',
                '**/tests/quizzes/**/*.spec.ts',
            ],
        },

        // ============================================
        // TESTES COMO ADMIN
        // ============================================
        {
            name: 'admin',
            use: {
                ...devices['Desktop Chrome'],
                storageState: '.auth/admin.json',
            },
            dependencies: ['setup-admin'],
            testMatch: [
                '**/tests/admin/**/*.spec.ts',
                '**/tests/security/**/*.spec.ts',
            ],
        },

        // ============================================
        // TESTES GERAIS (usa primeiro usuário disponível)
        // ============================================
        {
            name: 'general',
            use: {
                ...devices['Desktop Chrome'],
                storageState: '.auth/student.json',
            },
            dependencies: ['setup-student'],
            testMatch: [
                '**/tests/pages.spec.ts',
            ],
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
