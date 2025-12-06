"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Settings,
    Loader2,
    AlertCircle,
    RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BunnyStreamService, isVideoReady, isVideoProcessing, isVideoError } from "@/lib/bunny";

interface BunnyPlayerProps {
    videoId: string;
    title?: string;
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    controls?: boolean;
    responsive?: boolean;
    onProgress?: (currentTime: number, duration: number) => void;
    onComplete?: () => void;
    onError?: (error: string) => void;
    className?: string;
    aspectRatio?: "16/9" | "4/3" | "1/1";
}

type PlayerStatus = "loading" | "ready" | "processing" | "error";

export function BunnyPlayer({
    videoId,
    title,
    autoplay = false,
    muted = false,
    loop = false,
    controls = true,
    responsive = true,
    onProgress,
    onComplete,
    onError,
    className,
    aspectRatio = "16/9",
}: BunnyPlayerProps) {
    const [status, setStatus] = useState<PlayerStatus>("loading");
    const [error, setError] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const bunnyService = useRef(new BunnyStreamService());

    // Check video status on mount
    useEffect(() => {
        if (!videoId) {
            setError("ID do vídeo não fornecido");
            setStatus("error");
            return;
        }

        const checkVideoStatus = async () => {
            try {
                if (!bunnyService.current.isConfigured()) {
                    // If not configured, just show the embed (it might still work)
                    setStatus("ready");
                    return;
                }

                const video = await bunnyService.current.getVideo(videoId);

                if (isVideoReady(video.status)) {
                    setStatus("ready");
                } else if (isVideoProcessing(video.status)) {
                    setStatus("processing");
                } else if (isVideoError(video.status)) {
                    setError("Erro ao processar o vídeo");
                    setStatus("error");
                    onError?.("Erro ao processar o vídeo");
                }
            } catch (err: any) {
                // If API fails, try to show the embed anyway
                console.warn("Could not check video status:", err);
                setStatus("ready");
            }
        };

        checkVideoStatus();
    }, [videoId, onError]);

    // Build embed URL with parameters
    const getEmbedUrl = () => {
        const params = new URLSearchParams();
        if (autoplay) params.append("autoplay", "true");
        if (muted) params.append("muted", "true");
        if (loop) params.append("loop", "true");
        if (!controls) params.append("controls", "false");

        const baseUrl = bunnyService.current.getEmbedUrl(videoId);
        const queryString = params.toString();
        return queryString ? `${baseUrl}?${queryString}` : baseUrl;
    };

    // Handle iframe load
    const handleLoad = () => {
        if (status === "loading") {
            setStatus("ready");
        }
    };

    // Handle iframe error
    const handleError = () => {
        setError("Erro ao carregar o vídeo");
        setStatus("error");
        onError?.("Erro ao carregar o vídeo");
    };

    // Retry loading
    const handleRetry = () => {
        setStatus("loading");
        setError(null);
        // Force iframe reload
        if (iframeRef.current) {
            iframeRef.current.src = getEmbedUrl();
        }
    };

    // Render based on status
    if (status === "loading") {
        return (
            <Card className={cn("overflow-hidden", className)}>
                <div
                    className="relative bg-muted flex items-center justify-center"
                    style={{ aspectRatio }}
                >
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Carregando vídeo...</span>
                    </div>
                </div>
            </Card>
        );
    }

    if (status === "processing") {
        return (
            <Card className={cn("overflow-hidden", className)}>
                <div
                    className="relative bg-muted flex items-center justify-center"
                    style={{ aspectRatio }}
                >
                    <div className="flex flex-col items-center gap-3 text-center p-4">
                        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                        <div>
                            <h3 className="font-medium">Vídeo em processamento</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                O vídeo está sendo processado. Isso pode levar alguns minutos.
                            </p>
                        </div>
                        <Button variant="outline" onClick={handleRetry} className="gap-2 mt-2">
                            <RefreshCw className="h-4 w-4" />
                            Verificar novamente
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    if (status === "error") {
        return (
            <Card className={cn("overflow-hidden", className)}>
                <div
                    className="relative bg-muted flex items-center justify-center"
                    style={{ aspectRatio }}
                >
                    <div className="flex flex-col items-center gap-3 text-center p-4">
                        <AlertCircle className="h-10 w-10 text-destructive" />
                        <div>
                            <h3 className="font-medium">Erro ao carregar vídeo</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {error || "Ocorreu um erro ao carregar o vídeo"}
                            </p>
                        </div>
                        <Button variant="outline" onClick={handleRetry} className="gap-2 mt-2">
                            <RefreshCw className="h-4 w-4" />
                            Tentar novamente
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className={cn("overflow-hidden", className)}>
            <div
                className="relative bg-black"
                style={{ aspectRatio }}
            >
                <iframe
                    ref={iframeRef}
                    src={getEmbedUrl()}
                    title={title || "Bunny Stream Video"}
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={handleLoad}
                    onError={handleError}
                />
            </div>
            {title && (
                <CardContent className="p-3">
                    <h3 className="font-medium line-clamp-1">{title}</h3>
                </CardContent>
            )}
        </Card>
    );
}

// Skeleton for loading state
export function BunnyPlayerSkeleton({ aspectRatio = "16/9" }: { aspectRatio?: string }) {
    return (
        <Card className="overflow-hidden">
            <Skeleton className="w-full" style={{ aspectRatio }} />
        </Card>
    );
}

// Thumbnail preview component
interface BunnyThumbnailProps {
    videoId: string;
    alt?: string;
    className?: string;
    onClick?: () => void;
}

export function BunnyThumbnail({ videoId, alt, className, onClick }: BunnyThumbnailProps) {
    const bunnyService = useRef(new BunnyStreamService());
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    const thumbnailUrl = bunnyService.current.getThumbnailUrl(videoId);

    if (error) {
        return (
            <div
                className={cn(
                    "bg-muted flex items-center justify-center aspect-video",
                    className
                )}
            >
                <Play className="h-8 w-8 text-muted-foreground" />
            </div>
        );
    }

    return (
        <div
            className={cn(
                "relative overflow-hidden cursor-pointer group",
                className
            )}
            onClick={onClick}
        >
            {!loaded && (
                <Skeleton className="absolute inset-0" />
            )}
            <img
                src={thumbnailUrl}
                alt={alt || "Video thumbnail"}
                className={cn(
                    "w-full h-full object-cover transition-transform duration-300",
                    "group-hover:scale-105",
                    loaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="h-6 w-6 text-black ml-1" />
                </div>
            </div>
        </div>
    );
}
