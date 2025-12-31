"use client";

import { motion } from "framer-motion";
import {
    Type,
    Image,
    Square,
    Circle,
    Minus,
    QrCode,
    Signature,
    User,
    BookOpen,
    Calendar,
    Clock,
    Hash,
    GraduationCap,
    Building,
} from "lucide-react";
import { TEXT_PLACEHOLDERS, CertificateElement, DEFAULT_TEXT_ELEMENT, DEFAULT_SHAPE_ELEMENT, DEFAULT_IMAGE_ELEMENT } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ToolbarItem {
    type: string;
    icon: React.ReactNode;
    label: string;
    data?: Record<string, string>;
}

const textElements: ToolbarItem[] = [
    { type: "text", icon: <User className="h-4 w-4" />, label: "Nome do Aluno", data: { placeholder: "{{studentName}}" } },
    { type: "text", icon: <BookOpen className="h-4 w-4" />, label: "Nome do Curso", data: { placeholder: "{{courseName}}" } },
    { type: "text", icon: <Calendar className="h-4 w-4" />, label: "Data de Emissão", data: { placeholder: "{{issueDate}}" } },
    { type: "text", icon: <Clock className="h-4 w-4" />, label: "Carga Horária", data: { placeholder: "{{courseHours}}" } },
    { type: "text", icon: <Hash className="h-4 w-4" />, label: "Código", data: { placeholder: "{{certificateCode}}" } },
    { type: "text", icon: <GraduationCap className="h-4 w-4" />, label: "Instrutor", data: { placeholder: "{{instructorName}}" } },
    { type: "text", icon: <Building className="h-4 w-4" />, label: "Organização", data: { placeholder: "{{organizationName}}" } },
    { type: "text", icon: <Type className="h-4 w-4" />, label: "Texto Livre", data: { placeholder: "Texto" } },
];

const shapeElements: ToolbarItem[] = [
    { type: "shape", icon: <Square className="h-4 w-4" />, label: "Retângulo", data: { shapeType: "rectangle" } },
    { type: "shape", icon: <Circle className="h-4 w-4" />, label: "Círculo", data: { shapeType: "circle" } },
    { type: "shape", icon: <Minus className="h-4 w-4" />, label: "Linha", data: { shapeType: "line" } },
];

const specialElements: ToolbarItem[] = [
    { type: "image", icon: <Image className="h-4 w-4" />, label: "Imagem/Logo" },
    { type: "qrcode", icon: <QrCode className="h-4 w-4" />, label: "QR Code" },
    { type: "signature", icon: <Signature className="h-4 w-4" />, label: "Assinatura" },
];

interface DraggableItemProps {
    item: ToolbarItem;
    isMobile?: boolean;
    onClick?: () => void;
}

function DraggableItem({ item, isMobile, onClick }: DraggableItemProps) {
    const handleDragStart = (e: React.DragEvent) => {
        if (isMobile) return;
        e.dataTransfer.setData("elementType", item.type);
        if (item.data) {
            Object.entries(item.data).forEach(([key, value]) => {
                e.dataTransfer.setData(key, value);
            });
        }
        e.dataTransfer.effectAllowed = "copy";
    };

    return (
        <div
            draggable={!isMobile}
            onDragStart={handleDragStart}
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-all duration-200",
                isMobile ? "cursor-pointer active:scale-[0.98]" : "cursor-grab active:cursor-grabbing hover:scale-[1.02]"
            )}
        >
            <div className="h-8 w-8 shrink-0 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                {item.icon}
            </div>
            <span className="text-sm font-medium truncate">{item.label}</span>
        </div>
    );
}

interface ElementToolbarProps {
    isMobile?: boolean;
    onAddElement?: (element: Partial<CertificateElement>) => void;
}

export function ElementToolbar({ isMobile, onAddElement }: ElementToolbarProps) {
    const handleItemClick = (item: ToolbarItem) => {
        if (!isMobile || !onAddElement) return;

        let newElement: Partial<CertificateElement>;

        switch (item.type) {
            case "text":
                newElement = {
                    ...DEFAULT_TEXT_ELEMENT,
                    x: 100,
                    y: 100,
                    content: item.data?.placeholder || "Texto",
                };
                break;
            case "shape":
                newElement = {
                    ...DEFAULT_SHAPE_ELEMENT,
                    x: 100,
                    y: 100,
                    shapeType: (item.data?.shapeType as "rectangle" | "circle" | "line") || "rectangle",
                };
                break;
            case "image":
                newElement = {
                    ...DEFAULT_IMAGE_ELEMENT,
                    x: 100,
                    y: 100,
                };
                break;
            default:
                newElement = {
                    type: item.type as CertificateElement["type"],
                    x: 100,
                    y: 100,
                    width: 100,
                    height: 100,
                };
        }

        onAddElement(newElement);
    };

    return (
        <div className={cn(
            "bg-background flex flex-col h-full",
            !isMobile && "w-64 border-r"
        )}>
            {!isMobile && (
                <div className="p-4 border-b">
                    <h3 className="font-semibold text-sm">Elementos</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        Arraste para o canvas
                    </p>
                </div>
            )}

            {isMobile && (
                <div className="px-4 pt-2 pb-3">
                    <p className="text-xs text-muted-foreground">
                        Toque para adicionar ao canvas
                    </p>
                </div>
            )}

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {/* Text Elements */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Texto
                        </h4>
                        <div className="grid gap-2">
                            {textElements.map((item, index) => (
                                <DraggableItem
                                    key={index}
                                    item={item}
                                    isMobile={isMobile}
                                    onClick={() => handleItemClick(item)}
                                />
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Shape Elements */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Formas
                        </h4>
                        <div className="grid gap-2">
                            {shapeElements.map((item, index) => (
                                <DraggableItem
                                    key={index}
                                    item={item}
                                    isMobile={isMobile}
                                    onClick={() => handleItemClick(item)}
                                />
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Special Elements */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Especiais
                        </h4>
                        <div className="grid gap-2">
                            {specialElements.map((item, index) => (
                                <DraggableItem
                                    key={index}
                                    item={item}
                                    isMobile={isMobile}
                                    onClick={() => handleItemClick(item)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
