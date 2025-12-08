"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Image, Loader2, Globe, Users, Lock, X } from "lucide-react";
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
    }) => Promise<void>;
    isSubmitting?: boolean;
}

export function CreatePostForm({ author, onSubmit, isSubmitting = false }: CreatePostFormProps) {
    const [content, setContent] = useState("");
    const [visibility, setVisibility] = useState<"public" | "followers" | "private">("public");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async () => {
        if (!content.trim()) return;

        await onSubmit({
            content: content.trim(),
            visibility,
            imageUrl: imagePreview || undefined,
        });

        setContent("");
        setImagePreview(null);
        setIsFocused(false);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

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
                            placeholder="No que você está pensando?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            className={cn(
                                "min-h-[60px] resize-none border-0 p-0 focus-visible:ring-0 text-base",
                                "placeholder:text-muted-foreground/60"
                            )}
                        />

                        {/* Preview da imagem */}
                        {imagePreview && (
                            <div className="relative inline-block">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="max-h-48 rounded-lg object-cover"
                                />
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                    onClick={removeImage}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        )}

                        {/* Ações */}
                        <div className={cn(
                            "flex items-center justify-between gap-3 pt-3 border-t",
                            !isFocused && !content && "hidden"
                        )}>
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageSelect}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="gap-2 text-muted-foreground"
                                >
                                    <Image className="h-4 w-4" />
                                    Foto
                                </Button>

                                <Select
                                    value={visibility}
                                    onValueChange={(v) => setVisibility(v as typeof visibility)}
                                >
                                    <SelectTrigger className="w-[140px] h-8 text-xs">
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
