'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useContentProtection } from '@/hooks/useContentProtection';

interface ProtectedYouTubePlayerProps {
    /** URL do vídeo do YouTube ou ID do vídeo */
    videoUrl: string;
    /** Título do vídeo (para acessibilidade) */
    title?: string;
    /** Classes CSS adicionais */
    className?: string;
    /** Se a proteção de conteúdo está habilitada */
    protectionEnabled?: boolean;
    /** Callback quando o vídeo é carregado */
    onLoad?: () => void;
    /** Callback quando ocorre erro */
    onError?: () => void;
    /** Parâmetros adicionais do YouTube embed */
    youtubeParams?: {
        autoplay?: boolean;
        controls?: boolean;
        modestbranding?: boolean;
        rel?: boolean;
    };
}

/**
 * Extrai o ID do vídeo de uma URL do YouTube
 */
function extractYouTubeId(url: string): string | null {
    if (!url) return null;

    // Se já for um ID (11 caracteres alfanuméricos)
    if (/^[\w-]{11}$/.test(url)) {
        return url;
    }

    // Padrões de URL do YouTube
    const patterns = [
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/))([\w-]{11})/,
        /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
        /(?:youtu\.be\/)([\w-]{11})/,
        /(?:youtube\.com\/embed\/)([\w-]{11})/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

/**
 * Componente de Player do YouTube com proteção de conteúdo
 * 
 * Implementa múltiplas camadas de proteção:
 * - Overlay invisível sobre o player para capturar interações indesejadas
 * - Bloqueio de clique direito
 * - Bloqueio de atalhos de teclado (F12, Ctrl+U, etc)
 * - Desabilitação de seleção de texto
 * 
 * IMPORTANTE: Esta proteção é apenas "visual/UX". Usuários técnicos ainda
 * podem contornar essas proteções usando DevTools ou ferramentas externas.
 */
export function ProtectedYouTubePlayer({
    videoUrl,
    title = 'Vídeo do YouTube',
    className,
    protectionEnabled = true,
    onLoad,
    onError,
    youtubeParams = {},
}: ProtectedYouTubePlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showOverlay, setShowOverlay] = useState(true);

    // Aplicar proteção de conteúdo no container
    useContentProtection({
        disableRightClick: true,
        disableKeyboardShortcuts: false, // Não bloquear globalmente, apenas no container
        disableTextSelection: true,
        disableDrag: true,
    }, protectionEnabled);

    const videoId = extractYouTubeId(videoUrl);

    // Construir URL do embed
    const buildEmbedUrl = useCallback(() => {
        if (!videoId) return '';

        const params = new URLSearchParams({
            rel: '0',
            modestbranding: youtubeParams.modestbranding !== false ? '1' : '0',
            controls: youtubeParams.controls !== false ? '1' : '0',
            enablejsapi: '1',
            origin: typeof window !== 'undefined' ? window.location.origin : '',
            playsinline: '1',
            // Desabilitar anotações e cards do YouTube
            iv_load_policy: '3',
        });

        if (youtubeParams.autoplay) {
            params.set('autoplay', '1');
        }

        return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    }, [videoId, youtubeParams]);

    // Handler para clique no overlay - inicia reprodução
    const handleOverlayClick = () => {
        setShowOverlay(false);
        setIsPlaying(true);
    };

    // Bloquear clique direito no container
    const handleContextMenu = (e: React.MouseEvent) => {
        if (protectionEnabled) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    };

    if (!videoId) {
        return (
            <div className={cn(
                "flex items-center justify-center bg-black text-white",
                className
            )}>
                <p className="text-center opacity-75">Vídeo não disponível</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full h-full bg-black overflow-hidden",
                className
            )}
            onContextMenu={handleContextMenu}
            style={{
                userSelect: protectionEnabled ? 'none' : 'auto',
                WebkitUserSelect: protectionEnabled ? 'none' : 'auto',
            }}
        >
            {/* Player do YouTube */}
            <iframe
                src={buildEmbedUrl()}
                title={title}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={onLoad}
                onError={onError}
                style={{
                    pointerEvents: protectionEnabled && showOverlay ? 'none' : 'auto',
                }}
            />

            {/* Overlay protetor - permite apenas clique para iniciar */}
            {protectionEnabled && showOverlay && (
                <div
                    className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center"
                    onClick={handleOverlayClick}
                    onContextMenu={handleContextMenu}
                    style={{
                        background: 'transparent',
                    }}
                >
                    {/* Botão de play visual */}
                    <div className="w-20 h-20 bg-black/70 rounded-full flex items-center justify-center transition-transform hover:scale-110">
                        <svg
                            className="w-10 h-10 text-white ml-1"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Overlay inferior para bloquear barra do YouTube (opcional) */}
            {protectionEnabled && !showOverlay && (
                <>
                    {/* Bloqueio do canto inferior direito (logo do YouTube) */}
                    <div
                        className="absolute bottom-0 right-0 w-32 h-10 z-10"
                        onContextMenu={handleContextMenu}
                        style={{ background: 'transparent' }}
                    />
                </>
            )}
        </div>
    );
}

export default ProtectedYouTubePlayer;
