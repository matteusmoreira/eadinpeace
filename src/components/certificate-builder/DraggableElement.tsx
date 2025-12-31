"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { CertificateElement, DraggableElementProps } from "./types";
import { Trash2, Move, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DraggableElement({
    element,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
    scale,
}: DraggableElementProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [elementStart, setElementStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const elementRef = useRef<HTMLDivElement>(null);

    // Handle drag start
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        onSelect();
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setElementStart({ x: element.x, y: element.y, width: element.width, height: element.height });
    }, [element.x, element.y, element.width, element.height, onSelect]);

    // Handle resize start
    const handleResizeStart = useCallback((e: React.MouseEvent, corner: string) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setElementStart({ x: element.x, y: element.y, width: element.width, height: element.height });
    }, [element.x, element.y, element.width, element.height]);

    // Handle mouse move
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const dx = (e.clientX - dragStart.x) / scale;
                const dy = (e.clientY - dragStart.y) / scale;
                onUpdate({
                    x: Math.max(0, elementStart.x + dx),
                    y: Math.max(0, elementStart.y + dy),
                });
            } else if (isResizing) {
                const dx = (e.clientX - dragStart.x) / scale;
                const dy = (e.clientY - dragStart.y) / scale;
                onUpdate({
                    width: Math.max(20, elementStart.width + dx),
                    height: Math.max(20, elementStart.height + dy),
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, isResizing, dragStart, elementStart, scale, onUpdate]);

    // Render element content based on type
    const renderContent = () => {
        switch (element.type) {
            case "text":
                return (
                    <div
                        className="w-full h-full flex items-center justify-center overflow-hidden"
                        style={{
                            fontSize: (element.fontSize || 24) * scale,
                            fontFamily: element.fontFamily || "Inter",
                            fontWeight: element.fontWeight || "normal",
                            textAlign: (element.textAlign as any) || "center",
                            color: element.color || "#1e293b",
                        }}
                    >
                        {element.content || "Texto"}
                    </div>
                );
            case "shape":
                if (element.shapeType === "circle") {
                    return (
                        <div
                            className="w-full h-full rounded-full"
                            style={{
                                backgroundColor: element.fill || "#7c3aed",
                                border: element.stroke ? `${element.strokeWidth || 1}px solid ${element.stroke}` : "none",
                                opacity: element.opacity ?? 1,
                            }}
                        />
                    );
                }
                if (element.shapeType === "line") {
                    return (
                        <div
                            className="w-full h-0.5"
                            style={{
                                backgroundColor: element.fill || "#7c3aed",
                                marginTop: element.height * scale / 2,
                            }}
                        />
                    );
                }
                return (
                    <div
                        className="w-full h-full"
                        style={{
                            backgroundColor: element.fill || "#7c3aed",
                            border: element.stroke ? `${element.strokeWidth || 1}px solid ${element.stroke}` : "none",
                            borderRadius: element.borderRadius || 0,
                            opacity: element.opacity ?? 1,
                        }}
                    />
                );
            case "image":
                return element.src ? (
                    <img
                        src={element.src}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{
                            borderRadius: element.borderRadius || 0,
                            opacity: element.opacity ?? 1,
                        }}
                        draggable={false}
                    />
                ) : (
                    <div
                        className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground"
                        style={{ fontSize: 12 * scale }}
                    >
                        Imagem
                    </div>
                );
            case "qrcode":
                return (
                    <div
                        className="w-full h-full bg-white flex items-center justify-center border"
                        style={{ padding: 4 * scale }}
                    >
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <rect width="100" height="100" fill="white" />
                            <rect x="10" y="10" width="30" height="30" fill="black" />
                            <rect x="60" y="10" width="30" height="30" fill="black" />
                            <rect x="10" y="60" width="30" height="30" fill="black" />
                            <rect x="45" y="45" width="10" height="10" fill="black" />
                            <rect x="65" y="65" width="10" height="10" fill="black" />
                        </svg>
                    </div>
                );
            case "signature":
                return (
                    <div
                        className="w-full h-full flex flex-col items-center justify-end"
                        style={{ padding: 8 * scale }}
                    >
                        <div
                            className="w-full border-b-2 border-gray-400"
                            style={{ marginBottom: 4 * scale }}
                        />
                        <span
                            className="text-muted-foreground"
                            style={{ fontSize: 10 * scale }}
                        >
                            Assinatura
                        </span>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div
            ref={elementRef}
            className={`absolute cursor-move ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}
            style={{
                left: element.x * scale,
                top: element.y * scale,
                width: element.width * scale,
                height: element.height * scale,
                transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
            }}
            onMouseDown={handleMouseDown}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            {renderContent()}

            {/* Selection controls */}
            {isSelected && (
                <>
                    {/* Delete button */}
                    <button
                        className="absolute -top-3 -right-3 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>

                    {/* Resize handle */}
                    <div
                        className="absolute -bottom-2 -right-2 w-4 h-4 bg-primary rounded-full cursor-se-resize"
                        onMouseDown={(e) => handleResizeStart(e, "se")}
                    />

                    {/* Corner indicators */}
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full" />
                </>
            )}
        </div>
    );
}
