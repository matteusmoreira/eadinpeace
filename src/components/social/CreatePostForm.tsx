"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Image,
    Loader2,
    Globe,
    Users,
    Lock,
    X,
    Video,
    Smile,
    Link as LinkIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@convex/_generated/dataModel";

interface Author {
    _id: Id<"users">;
    firstName: string;
    lastName: string;
    imageUrl?: string;
}

interface CreatePostFormProps {
    author: Author;
    onSubmit: (data: {
        content: string;
        visibility: "public" | "followers" | "private";
        imageUrl?: string;
        videoUrl?: string;
    }) => Promise<void>;
    isSubmitting?: boolean;
}

// Lista de emojis populares organizados por categoria
const emojiCategories = [
    {
        name: "😊 Rostos",
        emojis: ["😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊", "😋", "😎", "😍", "🥰", "😘", "😗", "😙", "😚", "🙂", "🤗", "🤩", "🤔", "🤨", "😐", "😑", "😶", "🙄", "😏", "😣", "😥", "😮", "🤐", "😯", "😪", "😫", "🥱", "😴", "😌", "😛", "😜", "😝", "🤤", "😒", "😓", "😔", "😕", "🙃", "🤑", "😲", "☹️", "🙁", "😖", "😞", "😟", "😤", "😢", "😭", "😦", "😧", "😨", "😩", "🤯", "😬", "😰", "😱"]
    },
    {
        name: "👍 Gestos",
        emojis: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤝", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🙏", "💪", "🦾", "🦵", "🦶", "👂", "👃", "🧠", "👀", "👁️", "👅", "👄", "💋"]
    },
    {
        name: "❤️ Amor",
        emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "💌", "💍", "💐", "🌹", "🌷", "🌸", "💮", "🏵️", "🌻", "🌺"]
    },
    {
        name: "🎉 Celebração",
        emojis: ["🎉", "🎊", "🎈", "🎁", "🎀", "🎂", "🍰", "🧁", "🎄", "🎃", "🎆", "🎇", "✨", "🎐", "🎏", "🎑", "🎋", "🎍", "🎎", "🪅", "🪆", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🎗️", "🏵️"]
    },
    {
        name: "📚 Educação",
        emojis: ["📚", "📖", "📗", "📘", "📙", "📔", "📒", "📕", "📓", "📃", "📄", "📑", "🔖", "📋", "📝", "✏️", "🖊️", "🖋️", "✒️", "📐", "📏", "📌", "📍", "✂️", "🖇️", "📎", "🔗", "🎓", "🏫", "🔬", "🔭", "💻", "⌨️", "🖥️", "📱"]
    },
    {
        name: "🌟 Natureza",
        emojis: ["🌟", "⭐", "🌙", "☀️", "🌈", "☁️", "⛅", "🌤️", "🌦️", "🌧️", "⛈️", "🌩️", "🌪️", "❄️", "☃️", "⛄", "🔥", "💧", "💦", "🌊", "🌲", "🌳", "🌴", "🍀", "🍁", "🍂", "🌾", "🌵", "🌿", "☘️"]
    }
];

// Função para extrair ID do vídeo de URLs do YouTube/Vimeo
const extractVideoId = (url: string): { provider: "youtube" | "vimeo" | null; id: string | null } => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/);
    if (youtubeMatch) {
        return { provider: "youtube", id: youtubeMatch[1] };
    }

    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeoMatch) {
        return { provider: "vimeo", id: vimeoMatch[1] };
    }

    return { provider: null, id: null };
};

// Função para validar URL de imagem
const isValidImageUrl = (url: string): boolean => {
    try {
        new URL(url);
        return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url) ||
            url.includes("imgur.com") ||
            url.includes("images.unsplash.com") ||
            url.includes("i.postimg.cc") ||
            url.includes("media.giphy.com") ||
            url.includes("cloudinary.com") ||
            url.includes("res.cloudinary.com");
    } catch {
        return false;
    }
};

export function CreatePostForm({ author, onSubmit, isSubmitting = false }: CreatePostFormProps) {
    const [content, setContent] = useState("");
    const [visibility, setVisibility] = useState<"public" | "followers" | "private">("public");
    const [imageUrl, setImageUrl] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [showImageInput, setShowImageInput] = useState(false);
    const [showVideoInput, setShowVideoInput] = useState(false);
    const [imageError, setImageError] = useState("");
    const [videoError, setVideoError] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = async () => {
        if (!content.trim()) return;

        // Validar URLs antes de enviar
        const finalImageUrl = imageUrl.trim();
        const finalVideoUrl = videoUrl.trim();

        if (finalImageUrl && !isValidImageUrl(finalImageUrl)) {
            setImageError("URL de imagem inválida");
            return;
        }

        if (finalVideoUrl) {
            const videoInfo = extractVideoId(finalVideoUrl);
            if (!videoInfo.provider) {
                setVideoError("URL de vídeo inválida. Use YouTube ou Vimeo.");
                return;
            }
        }

        await onSubmit({
            content: content.trim(),
            visibility,
            imageUrl: finalImageUrl || undefined,
            videoUrl: finalVideoUrl || undefined,
        });

        // Limpar formulário
        setContent("");
        setImageUrl("");
        setVideoUrl("");
        setIsFocused(false);
        setShowImageInput(false);
        setShowVideoInput(false);
        setImageError("");
        setVideoError("");
    };

    const insertEmoji = (emoji: string) => {
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newContent = content.slice(0, start) + emoji + content.slice(end);
            setContent(newContent);
            // Reposicionar cursor após o emoji
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + emoji.length, start + emoji.length);
            }, 0);
        } else {
            setContent(content + emoji);
        }
    };

    const toggleImageInput = () => {
        setShowImageInput(!showImageInput);
        if (showImageInput) {
            setImageUrl("");
            setImageError("");
        }
    };

    const toggleVideoInput = () => {
        setShowVideoInput(!showVideoInput);
        if (showVideoInput) {
            setVideoUrl("");
            setVideoError("");
        }
    };

    const handleImageUrlChange = (value: string) => {
        setImageUrl(value);
        setImageError("");
    };

    const handleVideoUrlChange = (value: string) => {
        setVideoUrl(value);
        setVideoError("");
    };

    // Preview do vídeo
    const videoInfo = videoUrl ? extractVideoId(videoUrl) : null;
    const hasValidVideo = videoInfo?.provider && videoInfo?.id;

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-4">
                <div className="flex gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-background shadow">
                        <AvatarImage src={author.imageUrl} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                            {author.firstName?.[0]}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-3">
                        <Textarea
                            ref={textareaRef}
                            placeholder="No que você está pensando?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            className={cn(
                                "min-h-[60px] resize-none border-0 p-0 focus-visible:ring-0 text-base",
                                "placeholder:text-muted-foreground/60"
                            )}
                        />

                        {/* Input de link de imagem */}
                        {showImageInput && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cole o link da imagem aqui..."
                                            value={imageUrl}
                                            onChange={(e) => handleImageUrlChange(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={toggleImageInput}
                                        className="shrink-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                {imageError && (
                                    <p className="text-xs text-destructive">{imageError}</p>
                                )}
                                {/* Preview da imagem */}
                                {imageUrl && isValidImageUrl(imageUrl) && (
                                    <div className="relative inline-block">
                                        <img
                                            src={imageUrl}
                                            alt="Preview"
                                            className="max-h-48 rounded-lg object-cover"
                                            onError={() => setImageError("Não foi possível carregar a imagem")}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Input de link de vídeo */}
                        {showVideoInput && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cole o link do YouTube ou Vimeo..."
                                            value={videoUrl}
                                            onChange={(e) => handleVideoUrlChange(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={toggleVideoInput}
                                        className="shrink-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                {videoError && (
                                    <p className="text-xs text-destructive">{videoError}</p>
                                )}
                                {/* Preview do vídeo */}
                                {hasValidVideo && (
                                    <div className="rounded-lg overflow-hidden aspect-video max-w-md">
                                        {videoInfo?.provider === "youtube" ? (
                                            <iframe
                                                src={`https://www.youtube.com/embed/${videoInfo.id}`}
                                                title="YouTube video preview"
                                                className="w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        ) : (
                                            <iframe
                                                src={`https://player.vimeo.com/video/${videoInfo?.id}`}
                                                title="Vimeo video preview"
                                                className="w-full h-full"
                                                allow="autoplay; fullscreen; picture-in-picture"
                                                allowFullScreen
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Ações */}
                        <div className={cn(
                            "flex items-center justify-between gap-3 pt-3 border-t",
                            !isFocused && !content && "hidden"
                        )}>
                            <div className="flex items-center gap-1">
                                {/* Botão de Imagem */}
                                <Button
                                    type="button"
                                    variant={showImageInput ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={toggleImageInput}
                                    className={cn(
                                        "gap-2 text-muted-foreground",
                                        showImageInput && "text-primary"
                                    )}
                                >
                                    <Image className="h-4 w-4" />
                                    <span className="hidden sm:inline">Foto</span>
                                </Button>

                                {/* Botão de Vídeo */}
                                <Button
                                    type="button"
                                    variant={showVideoInput ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={toggleVideoInput}
                                    className={cn(
                                        "gap-2 text-muted-foreground",
                                        showVideoInput && "text-primary"
                                    )}
                                >
                                    <Video className="h-4 w-4" />
                                    <span className="hidden sm:inline">Vídeo</span>
                                </Button>

                                {/* Seletor de Emoji */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="gap-2 text-muted-foreground"
                                        >
                                            <Smile className="h-4 w-4" />
                                            <span className="hidden sm:inline">Emoji</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-80 p-2"
                                        align="start"
                                        side="top"
                                    >
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                            {emojiCategories.map((category) => (
                                                <div key={category.name}>
                                                    <p className="text-xs font-medium text-muted-foreground mb-2">
                                                        {category.name}
                                                    </p>
                                                    <div className="grid grid-cols-8 gap-1">
                                                        {category.emojis.map((emoji) => (
                                                            <button
                                                                key={emoji}
                                                                type="button"
                                                                onClick={() => insertEmoji(emoji)}
                                                                className="h-8 w-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                {/* Seletor de Visibilidade */}
                                <Select
                                    value={visibility}
                                    onValueChange={(v) => setVisibility(v as typeof visibility)}
                                >
                                    <SelectTrigger className="w-[120px] sm:w-[140px] h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="public">
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-3 w-3" />
                                                Público
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="followers">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-3 w-3" />
                                                Seguidores
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="private">
                                            <div className="flex items-center gap-2">
                                                <Lock className="h-3 w-3" />
                                                Privado
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={!content.trim() || isSubmitting}
                                className="gradient-bg border-0"
                            >
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Publicar
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
