"use client";

import { useState, useEffect } from "react";
import { GripVertical, Check, X, ArrowUp, ArrowDown } from "lucide-react";

interface SortableQuestionProps {
    question: string;
    items: string[]; // Itens na ordem correta
    userOrder?: string[];
    onAnswer?: (order: string[]) => void;
    disabled?: boolean;
    showCorrection?: boolean;
}

export function SortableQuestion({
    question,
    items,
    userOrder = [],
    onAnswer,
    disabled = false,
    showCorrection = false,
}: SortableQuestionProps) {
    const [orderedItems, setOrderedItems] = useState<string[]>([]);

    useEffect(() => {
        if (userOrder.length > 0) {
            setOrderedItems(userOrder);
        } else {
            // Embaralhar itens inicialmente
            const shuffled = [...items].sort(() => Math.random() - 0.5);
            setOrderedItems(shuffled);
            onAnswer?.(shuffled);
        }
    }, [items]);

    const moveItem = (index: number, direction: "up" | "down") => {
        if (disabled) return;

        const newOrder = [...orderedItems];
        const newIndex = direction === "up" ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= newOrder.length) return;

        // Trocar posições
        [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];

        setOrderedItems(newOrder);
        onAnswer?.(newOrder);
    };

    const isCorrectPosition = (item: string, index: number) => {
        return items[index] === item;
    };

    const allCorrect = orderedItems.every((item, index) => isCorrectPosition(item, index));

    return (
        <div className="space-y-4">
            <div>
                <p className="text-gray-900 font-medium mb-1">{question}</p>
                <p className="text-sm text-gray-600">
                    Organize os itens na ordem correta usando as setas
                </p>
            </div>

            <div className="space-y-2">
                {orderedItems.map((item, index) => {
                    const isCorrect = showCorrection && isCorrectPosition(item, index);
                    const isWrong = showCorrection && !isCorrectPosition(item, index);

                    return (
                        <div
                            key={index}
                            className={`
                flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                ${isCorrect ? "border-green-500 bg-green-50" : ""}
                ${isWrong ? "border-red-500 bg-red-50" : ""}
                ${!showCorrection ? "border-gray-200 bg-white hover:border-indigo-200" : ""}
                ${disabled ? "opacity-60" : ""}
              `}
                        >
                            {/* Número de posição */}
                            <div
                                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${isCorrect ? "bg-green-500 text-white" : ""}
                  ${isWrong ? "bg-red-500 text-white" : ""}
                  ${!showCorrection ? "bg-indigo-100 text-indigo-700" : ""}
                `}
                            >
                                {index + 1}
                            </div>

                            {/* Ícone de arrastar */}
                            <GripVertical className="w-5 h-5 text-gray-400" />

                            {/* Texto do item */}
                            <span className="flex-1 text-gray-900">{item}</span>

                            {/* Botões de mover */}
                            {!disabled && !showCorrection && (
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => moveItem(index, "up")}
                                        disabled={index === 0}
                                        className={`
                      p-2 rounded-lg transition-colors
                      ${index === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-indigo-100 hover:text-indigo-600"}
                    `}
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => moveItem(index, "down")}
                                        disabled={index === orderedItems.length - 1}
                                        className={`
                      p-2 rounded-lg transition-colors
                      ${index === orderedItems.length - 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-indigo-100 hover:text-indigo-600"}
                    `}
                                    >
                                        <ArrowDown className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Ícone de correção */}
                            {showCorrection && (
                                <>
                                    {isCorrect && <Check className="w-5 h-5 text-green-600" />}
                                    {isWrong && <X className="w-5 h-5 text-red-600" />}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Mostrar ordem correta na correção */}
            {showCorrection && !allCorrect && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-700 mb-2">Ordem Correta:</p>
                    <ol className="list-decimal list-inside space-y-1">
                        {items.map((item, index) => (
                            <li key={index} className="text-sm text-blue-900">
                                {item}
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {/* Indicador de progresso */}
            {showCorrection && (
                <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all ${allCorrect ? "bg-green-500" : "bg-orange-500"
                                }`}
                            style={{
                                width: `${(orderedItems.filter((item, i) => isCorrectPosition(item, i)).length / orderedItems.length) * 100}%`,
                            }}
                        />
                    </div>
                    <span className="text-sm text-gray-600">
                        {orderedItems.filter((item, i) => isCorrectPosition(item, i)).length}/{orderedItems.length} corretos
                    </span>
                </div>
            )}
        </div>
    );
}
