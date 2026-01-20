import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AppearanceProvider } from "@/components/providers/appearance-provider";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { OrganizationProvider } from "@/components/providers/organization-provider";
import { DarkModeMist } from "@/components/ui/dark-mode-mist";
import { ptBR } from "@clerk/localizations";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EAD Pro - Plataforma de Ensino",
  description: "Plataforma EAD moderna para sua organização",
  keywords: ["EAD", "educação", "cursos online", "aprendizado"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={ptBR}>
      <html lang="pt-BR" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <ConvexClientProvider>
            <ThemeProvider defaultTheme="system" storageKey="ead-theme">
              <DarkModeMist />
              <AppearanceProvider>
                <OrganizationProvider>
                  {children}
                  <Toaster richColors position="top-right" />
                </OrganizationProvider>
              </AppearanceProvider>
            </ThemeProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
