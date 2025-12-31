"use client";

import { motion } from "framer-motion";
import { CertificateElement, CanvasAreaProps } from "./types";
import { DraggableElement } from "./DraggableElement";

export function CanvasArea({
    width,
    height,
    backgroundColor,
    backgroundImage,
    elements,
    selectedElementId,
    onSelectElement,
    onUpdateElement,
    onDeleteElement,
    scale,
}: CanvasAreaProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative shadow-2xl"
            style={{
                width: width * scale,
                height: height * scale,
                backgroundColor,
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onSelectElement(null);
                }
            }}
        >
            {/* Grid overlay */}
            <div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, #94a3b8 1px, transparent 1px),
                        linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
                    `,
                    backgroundSize: `${20 * scale}px ${20 * scale}px`,
                }}
            />

            {/* Elements */}
            {elements.map((element) => (
                <DraggableElement
                    key={element.id}
                    element={element}
                    isSelected={selectedElementId === element.id}
                    onSelect={() => onSelectElement(element.id)}
                    onUpdate={(updates) => onUpdateElement(element.id, updates)}
                    onDelete={() => onDeleteElement(element.id)}
                    scale={scale}
                />
            ))}

            {/* Border decoration preview */}
            <div
                className="absolute pointer-events-none"
                style={{
                    top: 16 * scale,
                    left: 16 * scale,
                    right: 16 * scale,
                    bottom: 16 * scale,
                    border: `${3 * scale}px solid #7c3aed`,
                    borderRadius: 8 * scale,
                    opacity: 0.3,
                }}
            />
        </motion.div>
    );
}
