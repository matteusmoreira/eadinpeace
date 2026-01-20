"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import MistBackground from "./mist-background";

/**
 * Wrapper component that renders MistBackground only in dark mode.
 * Handles both explicit dark theme and system preference.
 */
export function DarkModeMist() {
    const { theme } = useTheme();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (theme === "dark") {
            setIsDark(true);
        } else if (theme === "light") {
            setIsDark(false);
        } else {
            // theme === "system"
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            setIsDark(mediaQuery.matches);

            const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
            mediaQuery.addEventListener("change", handler);
            return () => mediaQuery.removeEventListener("change", handler);
        }
    }, [theme]);

    if (!isDark) return null;

    return <MistBackground />;
}
