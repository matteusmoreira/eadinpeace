"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useTheme } from "./theme-provider";
import { useOrganization } from "@clerk/nextjs";
import { Id } from "@convex/_generated/dataModel";

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
    if (!hex) return { h: 0, s: 0, l: 0 }; // Fallback

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
    const { organization } = useOrganization();

    // Buscar configurações globais
    const globalSettingsData = useQuery(api.platformSettings.getByKey, { key: "appearance" });

    // Buscar configurações da organização (se existir)
    // Note: We need a query that returns minimal info or checks by Clerk Org ID if we don't have the Convex ID yet.
    // However, usually we can get the convex organization by Clerk ID.
    // Let's assume we use `getByClerkOrgId` if we have `organization.id`.
    const orgSettingsData = useQuery(
        api.organizations.getByClerkOrgId,
        organization?.id ? { clerkOrgId: organization.id } : "skip"
    );

    const isLoading = globalSettingsData === undefined && (organization?.id ? orgSettingsData === undefined : false);

    // Merge settings: Global < Default < Org
    const mergedSettings: AppearanceSettings = {
        primaryColor: orgSettingsData?.primaryColor || globalSettingsData?.primaryColor || defaultSettings.primaryColor,
        secondaryColor: orgSettingsData?.secondaryColor || globalSettingsData?.secondaryColor || defaultSettings.secondaryColor,
        theme: orgSettingsData?.theme || globalSettingsData?.theme || defaultSettings.theme,
        font: orgSettingsData?.font || globalSettingsData?.font || defaultSettings.font,
        enableDarkMode: orgSettingsData?.enableDarkMode ?? globalSettingsData?.enableDarkMode ?? defaultSettings.enableDarkMode,
        enableAnimations: orgSettingsData?.enableAnimations ?? globalSettingsData?.enableAnimations ?? defaultSettings.enableAnimations,
        borderRadius: orgSettingsData?.borderRadius || globalSettingsData?.borderRadius || defaultSettings.borderRadius,
        logoUrl: orgSettingsData?.logo || globalSettingsData?.logoUrl || defaultSettings.logoUrl,
        faviconUrl: orgSettingsData?.favicon || globalSettingsData?.faviconUrl || defaultSettings.faviconUrl,
    };

    // Aplicar tema quando as configurações mudarem
    useEffect(() => {
        if (!isLoading && mergedSettings.theme) {
            const validTheme = mergedSettings.theme as "dark" | "light" | "system";
            if (["dark", "light", "system"].includes(validTheme)) {
                // Only override if explicitly set to something other than system, or handle system carefully?
                // UseTheme usually handles 'system'.
                setTheme(validTheme);
            }
        }
    }, [isLoading, mergedSettings.theme, setTheme]);

    // Aplicar cores dinâmicas
    useEffect(() => {
        if (isLoading) return;

        const root = document.documentElement;

        // Validar cores antes de aplicar
        if (!mergedSettings.primaryColor) return;
        const colorToUse = mergedSettings.primaryColor.startsWith('#') ? mergedSettings.primaryColor : `#${mergedSettings.primaryColor}`;
        const secondaryToUse = mergedSettings.secondaryColor ? (mergedSettings.secondaryColor.startsWith('#') ? mergedSettings.secondaryColor : `#${mergedSettings.secondaryColor}`) : colorToUse;

        // Light mode colors
        root.style.setProperty('--primary', colorToUse);
        root.style.setProperty('--primary-foreground', getForegroundColor(colorToUse));
        root.style.setProperty('--accent', secondaryToUse);
        root.style.setProperty('--accent-foreground', getForegroundColor(secondaryToUse));
        // Also update other variables mapped to primary usually
        root.style.setProperty('--ring', colorToUse);
        root.style.setProperty('--sidebar-primary', colorToUse);
        root.style.setProperty('--sidebar-primary-foreground', getForegroundColor(colorToUse));
        root.style.setProperty('--sidebar-ring', colorToUse);

        // Chart colors
        root.style.setProperty('--chart-1', colorToUse);
        root.style.setProperty('--chart-2', secondaryToUse);

        // Gradient
        const gradientPrimary = `linear-gradient(135deg, ${colorToUse} 0%, ${secondaryToUse} 50%, ${adjustLightness(secondaryToUse, 10)} 100%)`;
        root.style.setProperty('--gradient-primary', gradientPrimary);

        // Aplicar border radius
        const radiusValue = parseFloat(mergedSettings.borderRadius || "0.5");
        root.style.setProperty('--radius', `${radiusValue}rem`);

        // Aplicar fonte
        const fontMap: Record<string, string> = {
            'inter': '"Inter", system-ui, sans-serif',
            'roboto': '"Roboto", system-ui, sans-serif',
            'poppins': '"Poppins", system-ui, sans-serif',
            'open-sans': '"Open Sans", system-ui, sans-serif',
            'lato': '"Lato", system-ui, sans-serif',
        };

        if (fontMap[mergedSettings.font]) {
            root.style.setProperty('--font-sans', fontMap[mergedSettings.font]);
            document.body.style.fontFamily = fontMap[mergedSettings.font];
        }

        // Aplicar animações
        if (!mergedSettings.enableAnimations) {
            root.style.setProperty('--animation-duration', '0s');
            root.classList.add('no-animations');
        } else {
            root.style.removeProperty('--animation-duration');
            root.classList.remove('no-animations');
        }

        // Aplicar favicon
        if (mergedSettings.faviconUrl) {
            const existingFavicon = document.querySelector("link[rel='icon']");
            if (existingFavicon) {
                existingFavicon.setAttribute('href', mergedSettings.faviconUrl);
            } else {
                const link = document.createElement('link');
                link.rel = 'icon';
                link.href = mergedSettings.faviconUrl;
                document.head.appendChild(link);
            }
        }
    }, [isLoading, mergedSettings]);

    return (
        <AppearanceContext.Provider value={{ settings: mergedSettings, isLoading }}>
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
