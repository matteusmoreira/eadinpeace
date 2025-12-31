"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Save,
    Eye,
    Undo,
    Redo,
    ZoomIn,
    ZoomOut,
    Download,
    Loader2,
    Menu,
    PanelLeft,
    PanelRight,
    Layers,
    Settings2,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

    // Mobile responsive states
    const [showLeftSidebar, setShowLeftSidebar] = useState(false);
    const [showRightSidebar, setShowRightSidebar] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const canvasRef = useRef<HTMLDivElement>(null);

    const selectedElement = elements.find((el) => el.id === selectedElementId);

    // Check screen size
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) {
                setShowLeftSidebar(false);
                setShowRightSidebar(false);
            }
            // Adjust scale for smaller screens
            if (window.innerWidth < 640) {
                setScale(0.3);
            } else if (window.innerWidth < 1024) {
                setScale(0.4);
            } else {
                setScale(0.6);
            }
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

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
        // Close left sidebar on mobile after adding element
        if (isMobile) {
            setShowLeftSidebar(false);
        }
    }, [elements, pushToHistory, isMobile]);

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
    const zoomOut = () => setScale((s) => Math.max(s - 0.1, 0.2));

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
            {/* Toolbar - Responsive */}
            <div className="h-auto min-h-14 border-b bg-background flex flex-wrap items-center justify-between px-2 sm:px-4 py-2 gap-2">
                {/* Left section */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Mobile menu buttons */}
                    {isMobile && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowLeftSidebar(true)}
                            className="shrink-0"
                        >
                            <Layers className="h-4 w-4" />
                        </Button>
                    )}

                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full max-w-[200px] sm:max-w-[250px] lg:max-w-[300px] font-medium text-sm"
                        placeholder="Nome do template"
                    />
                </div>

                {/* Center section - Controls */}
                <div className="flex items-center gap-1 sm:gap-2 order-last sm:order-none w-full sm:w-auto justify-center sm:justify-start">
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" onClick={undo} disabled={historyIndex === 0} className="h-8 w-8 sm:h-9 sm:w-9">
                            <Undo className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1} className="h-8 w-8 sm:h-9 sm:w-9">
                            <Redo className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                    </div>

                    <div className="h-6 w-px bg-border mx-1 sm:mx-2 hidden sm:block" />

                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" onClick={zoomOut} className="h-8 w-8 sm:h-9 sm:w-9">
                            <ZoomOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <span className="text-xs sm:text-sm text-muted-foreground w-10 sm:w-12 text-center">
                            {Math.round(scale * 100)}%
                        </span>
                        <Button variant="outline" size="icon" onClick={zoomIn} className="h-8 w-8 sm:h-9 sm:w-9">
                            <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                    </div>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-1 sm:gap-2">
                    {isMobile && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowRightSidebar(true)}
                            className="shrink-0 h-8 w-8 sm:h-9 sm:w-9"
                        >
                            <Settings2 className="h-4 w-4" />
                        </Button>
                    )}

                    <Button onClick={handleSave} disabled={isSaving} className="gap-1 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-4">
                        {isSaving ? (
                            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                        ) : (
                            <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        )}
                        <span className="hidden xs:inline">Salvar</span>
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Sidebar - Element Toolbar (Desktop) */}
                <div className="hidden lg:block">
                    <ElementToolbar />
                </div>

                {/* Left Sidebar - Mobile Sheet */}
                <Sheet open={showLeftSidebar} onOpenChange={setShowLeftSidebar}>
                    <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
                        <SheetHeader className="p-4 border-b">
                            <SheetTitle>Elementos</SheetTitle>
                        </SheetHeader>
                        <ElementToolbar isMobile onAddElement={(element) => {
                            addElement(element);
                        }} />
                    </SheetContent>
                </Sheet>

                {/* Canvas Area */}
                <div
                    className="flex-1 overflow-auto bg-muted/30 p-2 sm:p-4 lg:p-8 flex items-start sm:items-center justify-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    <div ref={canvasRef} className="min-w-0">
                        <CanvasArea
                            width={initialWidth}
                            height={initialHeight}
                            backgroundColor={backgroundColor}
                            backgroundImage={backgroundImage}
                            elements={elements}
                            selectedElementId={selectedElementId}
                            onSelectElement={(id) => {
                                setSelectedElementId(id);
                                // Open properties panel on mobile when selecting element
                                if (isMobile && id) {
                                    setShowRightSidebar(true);
                                }
                            }}
                            onUpdateElement={updateElement}
                            onDeleteElement={deleteElement}
                            onAddElement={addElement}
                            scale={scale}
                        />
                    </div>
                </div>

                {/* Right Sidebar - Properties Panel (Desktop) */}
                <div className="hidden lg:block">
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

                {/* Right Sidebar - Mobile Sheet */}
                <Sheet open={showRightSidebar} onOpenChange={setShowRightSidebar}>
                    <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
                        <SheetHeader className="p-4 border-b">
                            <SheetTitle>Propriedades</SheetTitle>
                        </SheetHeader>
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
                            isMobile
                        />
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}
