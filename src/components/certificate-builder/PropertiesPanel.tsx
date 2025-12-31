"use client";

import { CertificateElement, DEFAULT_FONTS } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    AlignLeft,
    AlignCenter,
    AlignRight,
    Bold,
    Palette,
} from "lucide-react";

interface PropertiesPanelProps {
    selectedElement: CertificateElement | undefined;
    onUpdate: (updates: Partial<CertificateElement>) => void;
    backgroundColor: string;
    onBackgroundColorChange: (color: string) => void;
    isMobile?: boolean;
}

export function PropertiesPanel({
    selectedElement,
    onUpdate,
    backgroundColor,
    onBackgroundColorChange,
    isMobile,
}: PropertiesPanelProps) {
    if (!selectedElement) {
        return (
            <div className={cn(
                "bg-background flex flex-col h-full",
                !isMobile && "w-72 border-l"
            )}>
                <div className="p-4 border-b">
                    <h3 className="font-semibold text-sm">Propriedades</h3>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center text-muted-foreground">
                        <Palette className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Selecione um elemento para editar suas propriedades</p>
                    </div>
                </div>

                {/* Background settings when no element selected */}
                <div className="p-4 border-t">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Fundo do Canvas
                    </Label>
                    <div className="mt-2 flex items-center gap-2">
                        <Input
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => onBackgroundColorChange(e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                            type="text"
                            value={backgroundColor}
                            onChange={(e) => onBackgroundColorChange(e.target.value)}
                            className="flex-1 font-mono text-sm"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "bg-background flex flex-col h-full",
            !isMobile && "w-72 border-l"
        )}>
            <div className="p-4 border-b">
                <h3 className="font-semibold text-sm">Propriedades</h3>
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {selectedElement.type === "text" && "Texto"}
                    {selectedElement.type === "shape" && "Forma"}
                    {selectedElement.type === "image" && "Imagem"}
                    {selectedElement.type === "qrcode" && "QR Code"}
                    {selectedElement.type === "signature" && "Assinatura"}
                </p>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {/* Position */}
                    <div className="space-y-3">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Posição
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs">X</Label>
                                <Input
                                    type="number"
                                    value={Math.round(selectedElement.x)}
                                    onChange={(e) => onUpdate({ x: Number(e.target.value) })}
                                    className="h-8"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Y</Label>
                                <Input
                                    type="number"
                                    value={Math.round(selectedElement.y)}
                                    onChange={(e) => onUpdate({ y: Number(e.target.value) })}
                                    className="h-8"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Size */}
                    <div className="space-y-3">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Tamanho
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs">Largura</Label>
                                <Input
                                    type="number"
                                    value={Math.round(selectedElement.width)}
                                    onChange={(e) => onUpdate({ width: Number(e.target.value) })}
                                    className="h-8"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Altura</Label>
                                <Input
                                    type="number"
                                    value={Math.round(selectedElement.height)}
                                    onChange={(e) => onUpdate({ height: Number(e.target.value) })}
                                    className="h-8"
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Text Properties */}
                    {selectedElement.type === "text" && (
                        <>
                            <div className="space-y-3">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Conteúdo
                                </Label>
                                <Input
                                    value={selectedElement.content || ""}
                                    onChange={(e) => onUpdate({ content: e.target.value })}
                                    placeholder="Texto ou {{placeholder}}"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Tipografia
                                </Label>
                                <Select
                                    value={selectedElement.fontFamily || "Inter"}
                                    onValueChange={(value) => onUpdate({ fontFamily: value })}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DEFAULT_FONTS.map((font) => (
                                            <SelectItem key={font} value={font}>
                                                <span style={{ fontFamily: font }}>{font}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-xs">Tamanho</Label>
                                        <Input
                                            type="number"
                                            value={selectedElement.fontSize || 24}
                                            onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
                                            className="h-8"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Peso</Label>
                                        <Select
                                            value={selectedElement.fontWeight || "normal"}
                                            onValueChange={(value) => onUpdate({ fontWeight: value })}
                                        >
                                            <SelectTrigger className="h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="medium">Médio</SelectItem>
                                                <SelectItem value="semibold">Semibold</SelectItem>
                                                <SelectItem value="bold">Negrito</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs">Alinhamento</Label>
                                    <div className="flex gap-1 mt-1">
                                        <Button
                                            variant={selectedElement.textAlign === "left" ? "default" : "outline"}
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => onUpdate({ textAlign: "left" })}
                                        >
                                            <AlignLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant={selectedElement.textAlign === "center" || !selectedElement.textAlign ? "default" : "outline"}
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => onUpdate({ textAlign: "center" })}
                                        >
                                            <AlignCenter className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant={selectedElement.textAlign === "right" ? "default" : "outline"}
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => onUpdate({ textAlign: "right" })}
                                        >
                                            <AlignRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs">Cor</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Input
                                            type="color"
                                            value={selectedElement.color || "#1e293b"}
                                            onChange={(e) => onUpdate({ color: e.target.value })}
                                            className="w-12 h-8 p-1 cursor-pointer"
                                        />
                                        <Input
                                            type="text"
                                            value={selectedElement.color || "#1e293b"}
                                            onChange={(e) => onUpdate({ color: e.target.value })}
                                            className="flex-1 h-8 font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Shape Properties */}
                    {selectedElement.type === "shape" && (
                        <div className="space-y-3">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Estilo
                            </Label>

                            <div>
                                <Label className="text-xs">Preenchimento</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Input
                                        type="color"
                                        value={selectedElement.fill || "#7c3aed"}
                                        onChange={(e) => onUpdate({ fill: e.target.value })}
                                        className="w-12 h-8 p-1 cursor-pointer"
                                    />
                                    <Input
                                        type="text"
                                        value={selectedElement.fill || "#7c3aed"}
                                        onChange={(e) => onUpdate({ fill: e.target.value })}
                                        className="flex-1 h-8 font-mono text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs">Borda</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Input
                                        type="color"
                                        value={selectedElement.stroke || "#000000"}
                                        onChange={(e) => onUpdate({ stroke: e.target.value })}
                                        className="w-12 h-8 p-1 cursor-pointer"
                                    />
                                    <Input
                                        type="number"
                                        value={selectedElement.strokeWidth || 0}
                                        onChange={(e) => onUpdate({ strokeWidth: Number(e.target.value) })}
                                        className="w-16 h-8"
                                        placeholder="Largura"
                                    />
                                </div>
                            </div>

                            {selectedElement.shapeType === "rectangle" && (
                                <div>
                                    <Label className="text-xs">Arredondamento</Label>
                                    <Input
                                        type="number"
                                        value={selectedElement.borderRadius || 0}
                                        onChange={(e) => onUpdate({ borderRadius: Number(e.target.value) })}
                                        className="h-8 mt-1"
                                    />
                                </div>
                            )}

                            <div>
                                <Label className="text-xs">Opacidade: {Math.round((selectedElement.opacity ?? 1) * 100)}%</Label>
                                <Slider
                                    value={[(selectedElement.opacity ?? 1) * 100]}
                                    onValueChange={(value) => onUpdate({ opacity: value[0] / 100 })}
                                    max={100}
                                    step={1}
                                    className="mt-2"
                                />
                            </div>
                        </div>
                    )}

                    {/* Image Properties */}
                    {selectedElement.type === "image" && (
                        <div className="space-y-3">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Imagem
                            </Label>

                            <div>
                                <Label className="text-xs">URL da Imagem</Label>
                                <Input
                                    value={selectedElement.src || ""}
                                    onChange={(e) => onUpdate({ src: e.target.value })}
                                    placeholder="https://..."
                                    className="h-8 mt-1"
                                />
                            </div>

                            <div>
                                <Label className="text-xs">Arredondamento</Label>
                                <Input
                                    type="number"
                                    value={selectedElement.borderRadius || 0}
                                    onChange={(e) => onUpdate({ borderRadius: Number(e.target.value) })}
                                    className="h-8 mt-1"
                                />
                            </div>

                            <div>
                                <Label className="text-xs">Opacidade: {Math.round((selectedElement.opacity ?? 1) * 100)}%</Label>
                                <Slider
                                    value={[(selectedElement.opacity ?? 1) * 100]}
                                    onValueChange={(value) => onUpdate({ opacity: value[0] / 100 })}
                                    max={100}
                                    step={1}
                                    className="mt-2"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
