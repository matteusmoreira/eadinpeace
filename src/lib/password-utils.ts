/**
 * Utilitários para validação e geração de senhas
 */

export interface PasswordStrength {
    level: "weak" | "medium" | "strong";
    score: number; // 0-100
    suggestions: string[];
}

/**
 * Valida se a senha atende aos requisitos mínimos
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push("A senha deve ter no mínimo 8 caracteres");
    }

    if (password.length > 128) {
        errors.push("A senha deve ter no máximo 128 caracteres");
    }

    // Opcional: adicionar mais validações
    // if (!/[A-Z]/.test(password)) {
    //     errors.push("A senha deve conter pelo menos uma letra maiúscula");
    // }
    // if (!/[a-z]/.test(password)) {
    //     errors.push("A senha deve conter pelo menos uma letra minúscula");
    // }
    // if (!/[0-9]/.test(password)) {
    //     errors.push("A senha deve conter pelo menos um número");
    // }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Calcula a força da senha
 */
export function getPasswordStrength(password: string): PasswordStrength {
    let score = 0;
    const suggestions: string[] = [];

    // Comprimento
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 15;
    if (password.length >= 16) score += 15;

    // Complexidade
    if (/[a-z]/.test(password)) score += 10;
    else suggestions.push("Adicione letras minúsculas");

    if (/[A-Z]/.test(password)) score += 10;
    else suggestions.push("Adicione letras maiúsculas");

    if (/[0-9]/.test(password)) score += 10;
    else suggestions.push("Adicione números");

    if (/[^A-Za-z0-9]/.test(password)) score += 20;
    else suggestions.push("Adicione caracteres especiais (!@#$%&*)");

    // Nível
    let level: "weak" | "medium" | "strong";
    if (score >= 70) {
        level = "strong";
    } else if (score >= 40) {
        level = "medium";
    } else {
        level = "weak";
    }

    return {
        level,
        score,
        suggestions,
    };
}

/**
 * Gera uma senha aleatória segura
 */
export function generateRandomPassword(length: number = 16): string {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const special = "!@#$%&*";
    const all = lowercase + uppercase + numbers + special;

    let password = "";

    // Garantir pelo menos 1 de cada tipo
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Preencher o resto aleatoriamente
    for (let i = password.length; i < length; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }

    // Embaralhar a senha
    return password
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");
}
