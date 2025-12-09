'use client';

import { useEffect } from 'react';

interface ContentProtectionOptions {
    /** Bloquear clique direito (contextmenu) */
    disableRightClick?: boolean;
    /** Bloquear atalhos de teclado (F12, Ctrl+U, Ctrl+S, etc) */
    disableKeyboardShortcuts?: boolean;
    /** Desabilitar seleção de texto */
    disableTextSelection?: boolean;
    /** Bloquear arrastar elementos */
    disableDrag?: boolean;
    /** Mostrar mensagem quando usuário tenta usar ações bloqueadas */
    showWarning?: boolean;
    /** Mensagem de aviso personalizada */
    warningMessage?: string;
}

const defaultOptions: ContentProtectionOptions = {
    disableRightClick: true,
    disableKeyboardShortcuts: true,
    disableTextSelection: true,
    disableDrag: true,
    showWarning: false,
    warningMessage: 'Esta ação está desabilitada para proteger o conteúdo.',
};

/**
 * Hook para proteger conteúdo contra cópia, inspeção e download
 * 
 * IMPORTANTE: Esta proteção é apenas "visual/UX". Usuários técnicos ainda
 * podem contornar essas proteções. Não existe proteção 100% para conteúdo web.
 * 
 * @param options - Opções de configuração
 * @param enabled - Se a proteção está habilitada (padrão: true)
 */
export function useContentProtection(
    options: ContentProtectionOptions = {},
    enabled: boolean = true
) {
    const config = { ...defaultOptions, ...options };

    useEffect(() => {
        if (!enabled) return;

        const showWarningMessage = () => {
            if (config.showWarning && config.warningMessage) {
                // Você pode substituir por toast/notification do seu sistema
                console.warn(config.warningMessage);
            }
        };

        // Bloquear clique direito
        const handleContextMenu = (e: MouseEvent) => {
            if (config.disableRightClick) {
                e.preventDefault();
                showWarningMessage();
                return false;
            }
        };

        // Bloquear atalhos de teclado
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!config.disableKeyboardShortcuts) return;

            // F12 - DevTools
            if (e.key === 'F12') {
                e.preventDefault();
                showWarningMessage();
                return false;
            }

            // Ctrl+Shift+I ou Cmd+Shift+I - DevTools
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
                e.preventDefault();
                showWarningMessage();
                return false;
            }

            // Ctrl+Shift+J ou Cmd+Shift+J - Console
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'j') {
                e.preventDefault();
                showWarningMessage();
                return false;
            }

            // Ctrl+U ou Cmd+U - Ver código fonte
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
                e.preventDefault();
                showWarningMessage();
                return false;
            }

            // Ctrl+S ou Cmd+S - Salvar página
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                showWarningMessage();
                return false;
            }

            // Ctrl+P ou Cmd+P - Imprimir
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                showWarningMessage();
                return false;
            }

            // Ctrl+C ou Cmd+C - Copiar (opcional, pode interferir com UX)
            // Descomentado porque pode ser muito restritivo
            // if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
            //     e.preventDefault();
            //     showWarningMessage();
            //     return false;
            // }
        };

        // Bloquear arrastar
        const handleDragStart = (e: DragEvent) => {
            if (config.disableDrag) {
                e.preventDefault();
                return false;
            }
        };

        // Bloquear seleção
        const handleSelectStart = (e: Event) => {
            if (config.disableTextSelection) {
                e.preventDefault();
                return false;
            }
        };

        // Adicionar estilos CSS para desabilitar seleção
        if (config.disableTextSelection) {
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            (document.body.style as any).msUserSelect = 'none';
            (document.body.style as any).MozUserSelect = 'none';
        }

        // Adicionar event listeners
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('dragstart', handleDragStart);
        document.addEventListener('selectstart', handleSelectStart);

        // Cleanup
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('dragstart', handleDragStart);
            document.removeEventListener('selectstart', handleSelectStart);

            // Restaurar seleção
            if (config.disableTextSelection) {
                document.body.style.userSelect = '';
                document.body.style.webkitUserSelect = '';
                (document.body.style as any).msUserSelect = '';
                (document.body.style as any).MozUserSelect = '';
            }
        };
    }, [enabled, config]);
}

export default useContentProtection;
