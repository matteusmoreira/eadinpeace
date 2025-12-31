"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
    CertificateElement,
    TEXT_PLACEHOLDERS,
    DEFAULT_TEXT_ELEMENT,
    DEFAULT_SHAPE_ELEMENT,
    DEFAULT_IMAGE_ELEMENT,
} from "./types";
import { CanvasArea } from "./CanvasArea";
import { ElementToolbar } from "./ElementToolbar";
import { PropertiesPanel } from "./PropertiesPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Save,
    Eye,
    Undo,
    Redo,
    ZoomIn,
    ZoomOut,
    Download,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface CertificateBuilderProps {
    templateId?: string;
    templateName?: string;
    initialElements?: CertificateElement[];
    initialWidth?: number;
    initialHeight?: number;
    initialBackgroundColor?: string;
    initialBackgroundImage?: string;
    onSave?: (data: {
        name: string;
        elements: CertificateElement[];
        width: number;
        height: number;
        backgroundColor: string;
        backgroundImage?: string;
    }) => Promise<void>;
    isSaving?: boolean;
}

export function CertificateBuilder({
    templateId,
    templateName = "Novo Template",
    initialElements = [],
    initialWidth = 1056,
    initialHeight = 816,
    initialBackgroundColor = "#ffffff",
    initialBackgroundImage,
    onSave,
    isSaving = false,
}: CertificateBuilderProps) {
    const [name, setName] = useState(templateName);
    const [elements, setElements] = useState<CertificateElement[]>(initialElements);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [scale, setScale] = useState(0.6);
    const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor);
    const [backgroundImage, setBackgroundImage] = useState(initialBackgroundImage);
    const [history, setHistory] = useState<CertificateElement[][]>([initialElements]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const canvasRef = useRef<HTMLDivElement>(null);

    const selectedElement = elements.find((el) => el.id === selectedElementId);

    // Generate unique ID
    const generateId = () => `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // History management
    const pushToHistory = useCallback((newElements: CertificateElement[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newElements);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setElements(history[historyIndex - 1]);
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setElements(history[historyIndex + 1]);
        }
    }, [history, historyIndex]);

    // Element operations
    const addElement = useCallback((partialElement: Partial<CertificateElement>) => {
        const newElement: CertificateElement = {
            id: generateId(),
            type: partialElement.type || "text",
            x: 100,
            y: 100,
            width: 200,
            height: 40,
            ...partialElement,
        };
        const newElements = [...elements, newElement];
        setElements(newElements);
        pushToHistory(newElements);
        setSelectedElementId(newElement.id);
    }, [elements, pushToHistory]);

    const updateElement = useCallback((id: string, updates: Partial<CertificateElement>) => {
        const newElements = elements.map((el) =>
            el.id === id ? { ...el, ...updates } : el
        );
        setElements(newElements);
    }, [elements]);

    const finalizeElementUpdate = useCallback(() => {
        pushToHistory(elements);
    }, [elements, pushToHistory]);

    const deleteElement = useCallback((id: string) => {
        const newElements = elements.filter((el) => el.id !== id);
        setElements(newElements);
        pushToHistory(newElements);
        if (selectedElementId === id) {
            setSelectedElementId(null);
        }
    }, [elements, selectedElementId, pushToHistory]);

    // Zoom controls
    const zoomIn = () => setScale((s) => Math.min(s + 0.1, 2));
    const zoomOut = () => setScale((s) => Math.max(s - 0.1, 0.3));

    // Save handler
    const handleSave = async () => {
        if (!onSave) return;
        try {
            await onSave({
                name,
                elements,
                width: initialWidth,
                height: initialHeight,
                backgroundColor,
                backgroundImage,
            });
            toast.success("Template salvo com sucesso!");
        } catch (error) {
            toast.error("Erro ao salvar template");
        }
    };

    // Handle drop from toolbar
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const type = e.dataTransfer.getData("elementType");
        const placeholder = e.dataTransfer.getData("placeholder");

        if (!canvasRef.current || !type) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        let newElement: Partial<CertificateElement>;

        switch (type) {
            case "text":
                newElement = {
                    ...DEFAULT_TEXT_ELEMENT,
                    x,
                    y,
                    content: placeholder || "Texto",
                };
                break;
            case "shape":
                const shapeType = e.dataTransfer.getData("shapeType") as "rectangle" | "circle" | "line";
                newElement = {
                    ...DEFAULT_SHAPE_ELEMENT,
                    x,
                    y,
                    shapeType: shapeType || "rectangle",
                };
                break;
            case "image":
                newElement = {
                    ...DEFAULT_IMAGE_ELEMENT,
                    x,
                    y,
                };
                break;
            default:
                newElement = {
                    type: type as CertificateElement["type"],
                    x,
                    y,
                    width: 100,
                    height: 100,
                };
        }

        addElement(newElement as CertificateElement);
    }, [scale, addElement]);

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col">
            {/* Toolbar */}
            <div className="h-14 border-b bg-background flex items-center justify-between px-4 gap-4">
                <div className="flex items-center gap-4">
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-64 font-medium"
                        placeholder="Nome do template"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={undo} disabled={historyIndex === 0}>
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}>
                        <Redo className="h-4 w-4" />
                    </Button>

                    <div className="h-6 w-px bg-border mx-2" />

                    <Button variant="outline" size="icon" onClick={zoomOut}>
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground w-12 text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button variant="outline" size="icon" onClick={zoomIn}>
                        <ZoomIn className="h-4 w-4" />
                    </Button>

                    <div className="h-6 w-px bg-border mx-2" />

                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Salvar
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Element Toolbar */}
                <ElementToolbar />

                {/* Canvas Area */}
                <div
                    className="flex-1 overflow-auto bg-muted/30 p-8 flex items-center justify-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    <div ref={canvasRef}>
                        <CanvasArea
                            width={initialWidth}
                            height={initialHeight}
                            backgroundColor={backgroundColor}
                            backgroundImage={backgroundImage}
                            elements={elements}
                            selectedElementId={selectedElementId}
                            onSelectElement={setSelectedElementId}
                            onUpdateElement={updateElement}
                            onDeleteElement={deleteElement}
                            onAddElement={addElement}
                            scale={scale}
                        />
                    </div>
                </div>

                {/* Right Sidebar - Properties Panel */}
                <PropertiesPanel
                    selectedElement={selectedElement}
                    onUpdate={(updates) => {
                        if (selectedElementId) {
                            updateElement(selectedElementId, updates);
                            finalizeElementUpdate();
                        }
                    }}
                    backgroundColor={backgroundColor}
                    onBackgroundColorChange={setBackgroundColor}
                />
            </div>
        </div>
    );
}
