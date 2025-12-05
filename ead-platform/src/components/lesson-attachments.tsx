"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    FileText,
    File,
    FileSpreadsheet,
    Image,
    Video,
    Music,
    Archive,
    Download,
    Trash2,
    Upload,
    Loader2,
    Paperclip,
    Plus,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LessonAttachmentsProps {
    lessonId: Id<"lessons">;
    canEdit?: boolean;
}

const fileTypeIcons: Record<string, React.ReactNode> = {
    pdf: <FileText className="h-5 w-5 text-red-500" />,
    document: <FileText className="h-5 w-5 text-blue-500" />,
    spreadsheet: <FileSpreadsheet className="h-5 w-5 text-green-500" />,
    image: <Image className="h-5 w-5 text-purple-500" />,
    video: <Video className="h-5 w-5 text-pink-500" />,
    audio: <Music className="h-5 w-5 text-amber-500" />,
    archive: <Archive className="h-5 w-5 text-slate-500" />,
    other: <File className="h-5 w-5 text-muted-foreground" />,
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const detectFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    const typeMap: Record<string, string> = {
        'pdf': 'pdf',
        'doc': 'document', 'docx': 'document', 'txt': 'document', 'rtf': 'document', 'odt': 'document',
        'xls': 'spreadsheet', 'xlsx': 'spreadsheet', 'csv': 'spreadsheet', 'ods': 'spreadsheet',
        'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'webp': 'image', 'svg': 'image',
        'mp4': 'video', 'avi': 'video', 'mov': 'video', 'mkv': 'video', 'webm': 'video',
        'mp3': 'audio', 'wav': 'audio', 'ogg': 'audio', 'flac': 'audio',
        'zip': 'archive', 'rar': 'archive', '7z': 'archive', 'tar': 'archive', 'gz': 'archive',
    };

    return typeMap[ext] || 'other';
};

export function LessonAttachments({ lessonId, canEdit = false }: LessonAttachmentsProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const attachments = useQuery(api.attachments.getByLesson, { lessonId });
    const generateUploadUrl = useMutation(api.attachments.generateUploadUrl);
    const createAttachment = useMutation(api.attachments.create);
    const deleteAttachment = useMutation(api.attachments.remove);
    const incrementDownload = useMutation(api.attachments.incrementDownload);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Max 50MB
        if (file.size > 50 * 1024 * 1024) {
            toast.error("Arquivo muito grande (máx. 50MB)");
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Get upload URL
            const uploadUrl = await generateUploadUrl();

            // Upload file
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) throw new Error("Upload failed");

            const { storageId } = await result.json();

            setUploadProgress(80);

            // Create attachment record
            await createAttachment({
                lessonId,
                name: file.name,
                type: detectFileType(file.name) as any,
                url: uploadUrl, // Will be replaced with actual storage URL
                storageId,
                size: file.size,
            });

            setUploadProgress(100);
            toast.success("Arquivo enviado com sucesso!");
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Erro ao enviar arquivo");
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            // Reset input
            event.target.value = "";
        }
    };

    const handleDownload = async (attachment: any) => {
        try {
            await incrementDownload({ attachmentId: attachment._id });
            window.open(attachment.url, "_blank");
        } catch (error) {
            toast.error("Erro ao baixar arquivo");
        }
    };

    const handleDelete = async (attachmentId: Id<"lessonAttachments">) => {
        if (!confirm("Tem certeza que deseja excluir este arquivo?")) return;

        try {
            await deleteAttachment({ attachmentId });
            toast.success("Arquivo excluído!");
        } catch (error) {
            toast.error("Erro ao excluir arquivo");
        }
    };

    if (attachments === undefined) {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Paperclip className="h-5 w-5" />
                    Materiais
                    {attachments.length > 0 && (
                        <Badge variant="secondary">{attachments.length}</Badge>
                    )}
                </CardTitle>
                {canEdit && (
                    <div className="relative">
                        <input
                            type="file"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isUploading}
                        />
                        <Button size="sm" disabled={isUploading} className="gap-2">
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            Adicionar
                        </Button>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {isUploading && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span>Enviando arquivo...</span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-1" />
                    </div>
                )}

                {attachments.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                        <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum material disponível</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {attachments.map((attachment) => (
                                <motion.div
                                    key={attachment._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {fileTypeIcons[attachment.type]}
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">{attachment.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatFileSize(attachment.size)}
                                                {attachment.downloadCount > 0 && (
                                                    <> • {attachment.downloadCount} downloads</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleDownload(attachment)}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        {canEdit && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive"
                                                onClick={() => handleDelete(attachment._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
