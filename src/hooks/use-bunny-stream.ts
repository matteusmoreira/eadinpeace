"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { BunnyStreamService, BunnyConfig } from "@/lib/bunny";
import { useMemo } from "react";

/**
 * Hook para obter uma instância do BunnyStreamService configurada
 * dinamicamente com as credenciais da organização.
 */
export function useBunnyStream(organizationId: Id<"organizations"> | undefined | null) {
    // Buscar configurações da organização
    const credentials = useQuery(
        api.organizationSettings.getBunnyCredentials,
        organizationId ? { organizationId } : "skip"
    );

    // Criar instância do serviço com as credenciais
    const bunnyService = useMemo(() => {
        if (!credentials) {
            // Retorna instância padrão (usa variáveis de ambiente)
            return new BunnyStreamService();
        }

        // Se tem credenciais do banco, usa elas
        if (credentials.apiKey && credentials.libraryId) {
            return new BunnyStreamService({
                apiKey: credentials.apiKey,
                libraryId: credentials.libraryId,
                cdnHostname: credentials.cdnHostname || undefined,
            });
        }

        // Fallback para variáveis de ambiente
        return new BunnyStreamService();
    }, [credentials]);

    // Status da configuração
    const isConfigured = useMemo(() => {
        if (credentials) {
            return !!(credentials.apiKey && credentials.libraryId && credentials.enabled);
        }
        // Verifica se tem configuração via variáveis de ambiente
        return bunnyService.isConfigured();
    }, [credentials, bunnyService]);

    const isEnabled = credentials?.enabled ?? true;
    const isLoading = credentials === undefined;

    return {
        bunnyService,
        isConfigured,
        isEnabled,
        isLoading,
        credentials: credentials ? {
            hasApiKey: !!credentials.apiKey,
            libraryId: credentials.libraryId,
            cdnHostname: credentials.cdnHostname,
        } : null,
    };
}

/**
 * Hook para verificar se o Bunny Stream está disponível para a organização.
 * Versão simplificada sem expor o serviço.
 */
export function useBunnyConfig(organizationId: Id<"organizations"> | undefined | null) {
    const config = useQuery(
        api.organizationSettings.getBunnyConfig,
        organizationId ? { organizationId } : "skip"
    );

    return {
        isLoading: config === undefined,
        isConfigured: config?.isConfigured ?? false,
        isEnabled: config?.bunnyEnabled ?? false,
        libraryId: config?.bunnyLibraryId ?? null,
        cdnHostname: config?.bunnyCdnHostname ?? null,
    };
}
