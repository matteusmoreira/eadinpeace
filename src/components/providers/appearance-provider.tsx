"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useTheme } from "./theme-provider";

type AppearanceSettings = {
    primaryColor: string;
    secondaryColor: string;
    theme: string;
    font: string;
    enableDarkMode: boolean;
    enableAnimations: boolean;
    borderRadius: string;
    logoUrl: string;
    faviconUrl: string;
};

type AppearanceContextType = {
    settings: AppearanceSettings | null;
    isLoading: boolean;
};

const defaultSettings: AppearanceSettings = {
    primaryColor: "#8B5CF6",
    secondaryColor: "#A78BFA",
    theme: "system",
    font: "inter",
    enableDarkMode: true,
    enableAnimations: true,
    borderRadius: "0.5",
    logoUrl: "",
    faviconUrl: "",
};

const AppearanceContext = createContext<AppearanceContextType>({
    settings: null,
    isLoading: true,
});

// Função para converter hex para HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
    // Remove o # se existir
    hex = hex.replace(/^#/, '');

    // Parse hex
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
    };
}

// Função para ajustar luminosidade
function adjustLightness(hex: string, amount: number): string {
    const hsl = hexToHSL(hex);
    const newL = Math.max(0, Math.min(100, hsl.l + amount));
    return `hsl(${hsl.h}, ${hsl.s}%, ${newL}%)`;
}

// Função para criar cor de foreground baseada na cor de fundo
function getForegroundColor(hex: string): string {
    const hsl = hexToHSL(hex);
    return hsl.l > 50 ? "#0F0D1A" : "#FFFFFF";
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
    const { setTheme } = useTheme();

    // Buscar configurações de aparência do Convex
    const appearanceData = useQuery(api.platformSettings.getByKey, { key: "appearance" });

    const isLoading = appearanceData === undefined;

    const settings: AppearanceSettings = appearanceData ? {
        primaryColor: appearanceData.primaryColor || defaultSettings.primaryColor,
        secondaryColor: appearanceData.secondaryColor || defaultSettings.secondaryColor,
        theme: appearanceData.theme || defaultSettings.theme,
        font: appearanceData.font || defaultSettings.font,
        enableDarkMode: appearanceData.enableDarkMode ?? defaultSettings.enableDarkMode,
        enableAnimations: appearanceData.enableAnimations ?? defaultSettings.enableAnimations,
        borderRadius: appearanceData.borderRadius || defaultSettings.borderRadius,
        logoUrl: appearanceData.logoUrl || defaultSettings.logoUrl,
        faviconUrl: appearanceData.faviconUrl || defaultSettings.faviconUrl,
    } : defaultSettings;

    // Aplicar tema quando as configurações mudarem
    useEffect(() => {
        if (!isLoading && settings.theme) {
            const validTheme = settings.theme as "dark" | "light" | "system";
            if (["dark", "light", "system"].includes(validTheme)) {
                setTheme(validTheme);
            }
        }
    }, [isLoading, settings.theme, setTheme]);

    // Aplicar cores dinâmicas
    useEffect(() => {
        if (isLoading) return;

        const root = document.documentElement;

        // Aplicar cor primária
        const primaryHSL = hexToHSL(settings.primaryColor);
        const secondaryHSL = hexToHSL(settings.secondaryColor);

        // Light mode colors
        root.style.setProperty('--primary', settings.primaryColor);
        root.style.setProperty('--primary-foreground', getForegroundColor(settings.primaryColor));
        root.style.setProperty('--accent', settings.secondaryColor);
        root.style.setProperty('--accent-foreground', getForegroundColor(settings.secondaryColor));
        root.style.setProperty('--ring', settings.primaryColor);
        root.style.setProperty('--sidebar-primary', settings.primaryColor);
        root.style.setProperty('--sidebar-primary-foreground', getForegroundColor(settings.primaryColor));
        root.style.setProperty('--sidebar-ring', settings.primaryColor);

        // Chart colors
        root.style.setProperty('--chart-1', settings.primaryColor);
        root.style.setProperty('--chart-2', settings.secondaryColor);

        // Gradient
        const gradientPrimary = `linear-gradient(135deg, ${settings.primaryColor} 0%, ${settings.secondaryColor} 50%, ${adjustLightness(settings.secondaryColor, 10)} 100%)`;
        root.style.setProperty('--gradient-primary', gradientPrimary);

        // Aplicar border radius
        const radiusValue = parseFloat(settings.borderRadius);
        root.style.setProperty('--radius', `${radiusValue}rem`);

        // Aplicar fonte
        const fontMap: Record<string, string> = {
            'inter': '"Inter", system-ui, sans-serif',
            'roboto': '"Roboto", system-ui, sans-serif',
            'poppins': '"Poppins", system-ui, sans-serif',
            'open-sans': '"Open Sans", system-ui, sans-serif',
            'lato': '"Lato", system-ui, sans-serif',
        };

        if (fontMap[settings.font]) {
            root.style.setProperty('--font-sans', fontMap[settings.font]);
            document.body.style.fontFamily = fontMap[settings.font];
        }

        // Aplicar animações
        if (!settings.enableAnimations) {
            root.style.setProperty('--animation-duration', '0s');
            root.classList.add('no-animations');
        } else {
            root.style.removeProperty('--animation-duration');
            root.classList.remove('no-animations');
        }

        // Aplicar favicon
        if (settings.faviconUrl) {
            const existingFavicon = document.querySelector("link[rel='icon']");
            if (existingFavicon) {
                existingFavicon.setAttribute('href', settings.faviconUrl);
            } else {
                const link = document.createElement('link');
                link.rel = 'icon';
                link.href = settings.faviconUrl;
                document.head.appendChild(link);
            }
        }
    }, [isLoading, settings]);

    return (
        <AppearanceContext.Provider value={{ settings, isLoading }}>
            {children}
        </AppearanceContext.Provider>
    );
}

export function useAppearance() {
    const context = useContext(AppearanceContext);
    if (!context) {
        throw new Error("useAppearance must be used within AppearanceProvider");
    }
    return context;
}
