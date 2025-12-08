"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Upload,
    Video,
    X,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Cloud,
    FileVideo,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BunnyStreamService } from "@/lib/bunny";
import { useBunnyStream } from "@/hooks/use-bunny-stream";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import Link from "next/link";

interface BunnyVideoUploadProps {
    onUploadComplete?: (videoId: string, videoUrl: string) => void;
    onError?: (error: string) => void;
    maxSizeMB?: number;
    acceptedFormats?: string[];
    className?: string;
    // Nova prop: organizationId para buscar credenciais do banco
    organizationId?: Id<"organizations">;
    // Ou pode passar um serviço já configurado
    bunnyService?: BunnyStreamService;
}

interface UploadState {
    status: "idle" | "preparing" | "uploading" | "processing" | "complete" | "error";
    progress: number;
    videoId?: string;
    error?: string;
    fileName?: string;
}

const DEFAULT_ACCEPTED_FORMATS = [".mp4", ".mov", ".webm", ".avi", ".mkv"];
const DEFAULT_MAX_SIZE_MB = 500;

export function BunnyVideoUpload({
    onUploadComplete,
    onError,
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
    acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
    className,
    organizationId,
    bunnyService: externalBunnyService,
}: BunnyVideoUploadProps) {
    const [uploadState, setUploadState] = useState<UploadState>({
        status: "idle",
        progress: 0,
    });
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Se organizationId foi fornecido, usa hook para buscar credenciais
    const orgBunny = useBunnyStream(organizationId);

    // Determina qual serviço usar: externo > hook > fallback
    const bunnyServiceRef = useRef<BunnyStreamService | null>(null);

    useEffect(() => {
        if (externalBunnyService) {
            bunnyServiceRef.current = externalBunnyService;
        } else if (organizationId && orgBunny.bunnyService) {
            bunnyServiceRef.current = orgBunny.bunnyService;
        } else {
            bunnyServiceRef.current = new BunnyStreamService();
        }
    }, [externalBunnyService, organizationId, orgBunny.bunnyService]);

    // Helper para obter o serviço atual
    const getBunnyService = () => {
        return bunnyServiceRef.current || new BunnyStreamService();
    };

    const resetUpload = () => {
        setUploadState({ status: "idle", progress: 0 });
    };

    const validateFile = (file: File): string | null => {
        // Check file size
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
            return `O arquivo é muito grande. Máximo permitido: ${maxSizeMB}MB`;
        }

        // Check file type
        const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
        if (!acceptedFormats.includes(extension)) {
            return `Formato não suportado. Use: ${acceptedFormats.join(", ")}`;
        }

        return null;
    };

    const handleUpload = async (file: File) => {
        // Validate file
        const error = validateFile(file);
        if (error) {
            setUploadState({ status: "error", progress: 0, error });
            onError?.(error);
            return;
        }

        // Check if Bunny is configured
        const bunny = getBunnyService();
        if (!bunny.isConfigured()) {
            const configError = "Bunny Stream não está configurado. Configure em Configurações > Vídeo/Bunny.";
            setUploadState({ status: "error", progress: 0, error: configError });
            onError?.(configError);
            toast.error(configError);
            return;
        }

        try {
            // Step 1: Create video entry
            setUploadState({
                status: "preparing",
                progress: 0,
                fileName: file.name
            });

            const title = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
            const { videoId } = await bunny.createVideo(title);

            // Step 2: Upload the file
            setUploadState({
                status: "uploading",
                progress: 0,
                videoId,
                fileName: file.name
            });

            await bunny.uploadVideo(videoId, file, (progress: number) => {
                setUploadState((prev) => ({ ...prev, progress }));
            });

            // Step 3: Processing
            setUploadState({
                status: "processing",
                progress: 100,
                videoId,
                fileName: file.name
            });

            // Get the embed URL
            const videoUrl = bunny.getEmbedUrl(videoId);

            // Complete
            setUploadState({
                status: "complete",
                progress: 100,
                videoId,
                fileName: file.name
            });

            onUploadComplete?.(videoId, videoUrl);
            toast.success("Vídeo enviado com sucesso!");

        } catch (err: any) {
            const errorMessage = err.message || "Erro ao fazer upload do vídeo";
            setUploadState({
                status: "error",
                progress: 0,
                error: errorMessage
            });
            onError?.(errorMessage);
            toast.error(errorMessage);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleUpload(file);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpload(file);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const renderStatus = () => {
        switch (uploadState.status) {
            case "preparing":
                return (
                    <div className="flex items-center gap-2 text-blue-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Preparando upload...</span>
                    </div>
                );

            case "uploading":
                return (
                    <div className="space-y-3 w-full">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Cloud className="h-4 w-4 text-blue-500" />
                                <span className="text-sm truncate max-w-[200px]">
                                    {uploadState.fileName}
                                </span>
                            </div>
                            <span className="text-sm font-medium">
                                {uploadState.progress}%
                            </span>
                        </div>
                        <Progress value={uploadState.progress} className="h-2" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetUpload}
                            className="text-muted-foreground"
                        >
                            Cancelar
                        </Button>
                    </div>
                );

            case "processing":
                return (
                    <div className="flex items-center gap-2 text-amber-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processando vídeo...</span>
                    </div>
                );

            case "complete":
                return (
                    <div className="space-y-3 w-full">
                        <div className="flex items-center gap-2 text-emerald-500">
                            <CheckCircle2 className="h-5 w-5" />
                            <span>Upload concluído!</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                                {uploadState.videoId}
                            </Badge>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={resetUpload}
                        >
                            Enviar outro vídeo
                        </Button>
                    </div>
                );

            case "error":
                return (
                    <div className="space-y-3 w-full">
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            <span className="text-sm">{uploadState.error}</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={resetUpload}
                        >
                            Tentar novamente
                        </Button>
                    </div>
                );

            default:
                return null;
        }
    };

    if (uploadState.status !== "idle") {
        return (
            <Card className={cn("border-2 border-dashed", className)}>
                <CardContent className="flex flex-col items-center justify-center p-6">
                    {renderStatus()}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            className={cn(
                "border-2 border-dashed cursor-pointer transition-all duration-200",
                isDragging
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-muted-foreground/25 hover:border-primary/50",
                className
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
        >
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedFormats.join(",")}
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileVideo className="h-7 w-7 text-primary" />
                </div>

                <h3 className="font-medium mb-1">
                    {isDragging ? "Solte o vídeo aqui" : "Arraste um vídeo ou clique para selecionar"}
                </h3>

                <p className="text-sm text-muted-foreground mb-4">
                    Formatos: MP4, MOV, WebM • Máx: {maxSizeMB}MB
                </p>

                <Badge variant="outline" className="gap-1">
                    <Cloud className="h-3 w-3" />
                    Powered by Bunny Stream
                </Badge>
            </CardContent>
        </Card>
    );
}

// Simple URL input for Bunny video IDs
interface BunnyVideoInputProps {
    value?: string;
    onChange?: (videoId: string, embedUrl: string) => void;
    className?: string;
}

export function BunnyVideoInput({ value, onChange, className }: BunnyVideoInputProps) {
    const [videoId, setVideoId] = useState(value || "");
    const bunnyService = useRef(new BunnyStreamService());

    const handleChange = (newValue: string) => {
        setVideoId(newValue);
        if (newValue) {
            const embedUrl = bunnyService.current.getEmbedUrl(newValue);
            onChange?.(newValue, embedUrl);
        }
    };

    return (
        <div className={cn("space-y-2", className)}>
            <Label htmlFor="bunny-video-id">ID do Vídeo (Bunny Stream)</Label>
            <div className="flex gap-2">
                <Input
                    id="bunny-video-id"
                    value={videoId}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="font-mono"
                />
            </div>
            <p className="text-xs text-muted-foreground">
                Insira o ID do vídeo do Bunny Stream
            </p>
        </div>
    );
}
