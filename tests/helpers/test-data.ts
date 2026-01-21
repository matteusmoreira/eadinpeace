/**
 * Helpers para geração de dados de teste
 */

import { faker } from '@faker-js/faker/locale/pt_BR';

// Configurar seed para dados consistentes em testes
faker.seed(123);

export const TestData = {
    /**
     * Gera dados de curso para testes
     */
    course: {
        basic: () => ({
            title: `Curso de Teste - ${faker.lorem.words(3)}`,
            description: faker.lorem.paragraph(),
            category: 'Tecnologia',
            level: 'Iniciante' as const,
            duration: '10 horas',
            isPublic: true,
        }),

        complete: () => ({
            title: `Curso Completo - ${faker.lorem.words(3)}`,
            description: faker.lorem.paragraphs(2),
            objectives: faker.lorem.paragraph(),
            requirements: faker.lorem.paragraph(),
            category: 'Tecnologia',
            level: 'Intermediário' as const,
            duration: '20 horas',
            isPublic: true,
            featured: true,
            price: 99.90,
        }),

        module: () => ({
            title: `Módulo - ${faker.lorem.words(2)}`,
            description: faker.lorem.sentence(),
            order: 1,
            published: true,
        }),

        lesson: {
            video: () => ({
                title: `Aula em Vídeo - ${faker.lorem.words(2)}`,
                description: faker.lorem.sentence(),
                type: 'video' as const,
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 600, // 10 minutos em segundos
                order: 1,
                published: true,
                freePreview: false,
            }),

            text: () => ({
                title: `Aula de Texto - ${faker.lorem.words(2)}`,
                description: faker.lorem.sentence(),
                type: 'text' as const,
                content: faker.lorem.paragraphs(5),
                order: 2,
                published: true,
                freePreview: false,
            }),

            pdf: () => ({
                title: `Aula PDF - ${faker.lorem.words(2)}`,
                description: faker.lorem.sentence(),
                type: 'pdf' as const,
                order: 3,
                published: true,
                freePreview: false,
            }),
        },
    },

    /**
     * Gera dados de usuário para testes
     */
    user: {
        student: () => ({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            role: 'student' as const,
        }),

        professor: () => ({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            role: 'professor' as const,
            bio: faker.lorem.paragraph(),
        }),

        admin: () => ({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            role: 'admin' as const,
        }),
    },

    /**
     * Gera dados de questões para quiz
     */
    question: {
        multipleChoice: () => ({
            question: faker.lorem.sentence() + '?',
            type: 'multiple_choice' as const,
            options: [
                { text: faker.lorem.words(3), isCorrect: true },
                { text: faker.lorem.words(3), isCorrect: false },
                { text: faker.lorem.words(3), isCorrect: false },
                { text: faker.lorem.words(3), isCorrect: false },
            ],
            points: 10,
            explanation: faker.lorem.sentence(),
        }),

        trueFalse: () => ({
            question: faker.lorem.sentence() + '?',
            type: 'true_false' as const,
            correctAnswer: faker.datatype.boolean(),
            points: 5,
            explanation: faker.lorem.sentence(),
        }),
    },

    /**
     * Gera dados de quiz
     */
    quiz: {
        basic: () => ({
            title: `Quiz de Teste - ${faker.lorem.words(2)}`,
            description: faker.lorem.sentence(),
            passingScore: 70,
            maxAttempts: 3,
            timeLimit: 30, // minutos
            shuffleQuestions: true,
            showResults: true,
        }),
    },

    /**
     * Gera dados de categoria
     */
    category: {
        basic: () => ({
            name: `Categoria ${faker.lorem.word()}`,
            description: faker.lorem.sentence(),
            color: faker.color.rgb(),
            icon: 'book',
            active: true,
        }),
    },

    /**
     * Gera dados de certificado
     */
    certificate: {
        template: () => ({
            name: `Template de Certificado - ${faker.lorem.words(2)}`,
            title: 'CERTIFICADO DE CONCLUSÃO',
            subtitle: 'Certificamos que',
            description: 'concluiu com sucesso o curso',
            footer: 'Este certificado é válido e pode ser verificado online.',
            showDate: true,
            showDuration: true,
            showSignature: true,
        }),
    },

    /**
     * Gera dados de conquista
     */
    achievement: {
        basic: () => ({
            name: `Conquista - ${faker.lorem.words(2)}`,
            description: faker.lorem.sentence(),
            icon: 'trophy',
            points: 100,
            condition: 'complete_course' as const,
        }),
    },
};

/**
 * Utilitários para limpeza de dados de teste
 */
export const TestCleanup = {
    /**
     * Remove prefixos de teste de strings
     */
    removeTestPrefix: (str: string): string => {
        return str.replace(/^(Curso de Teste|Curso Completo|Módulo|Aula|Quiz de Teste|Categoria|Template de Certificado|Conquista) - /, '');
    },

    /**
     * Verifica se um item é de teste
     */
    isTestItem: (name: string): boolean => {
        return /^(Curso de Teste|Curso Completo|Módulo|Aula|Quiz de Teste|Categoria|Template de Certificado|Conquista) - /.test(name);
    },
};

/**
 * Constantes úteis para testes
 */
export const TestConstants = {
    TIMEOUT: {
        SHORT: 5000,
        MEDIUM: 10000,
        LONG: 30000,
        VERY_LONG: 60000,
    },

    WAIT: {
        ANIMATION: 300,
        DEBOUNCE: 500,
        NETWORK: 1000,
        PAGE_LOAD: 2000,
    },

    SELECTORS: {
        LOADING: '[data-loading], .loading, [aria-busy="true"]',
        ERROR: '[role="alert"], .error-message, [data-error]',
        SUCCESS: '[role="status"], .success-message, [data-success]',
        MODAL: '[role="dialog"], .modal, [data-modal]',
        TOAST: '[role="status"], .toast, [data-toast]',
    },
};
