"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

interface MultipleChoiceProps {
    question: string;
    options: string[];
    correctAnswers?: string[];
    userAnswers?: string[];
    onAnswer?: (answers: string[]) => void;
    disabled?: boolean;
    showCorrection?: boolean;
}

export function MultipleChoiceQuestion({
    question,
    options,
    correctAnswers = [],
    userAnswers = [],
    onAnswer,
    disabled = false,
    showCorrection = false,
}: MultipleChoiceProps) {
    const [selected, setSelected] = useState<string[]>(userAnswers);

    const handleToggle = (option: string) => {
        if (disabled) return;

        const newSelected = selected.includes(option)
            ? selected.filter((s) => s !== option)
            : [...selected, option];

        setSelected(newSelected);
        onAnswer?.(newSelected);
    };

    return (
        <div className="space-y-4">
            <div>
                <p className="text-gray-900 font-medium mb-1">{question}</p>
                <p className="text-sm text-gray-600">Selecione todas as alternativas corretas</p>
            </div>
            <div className="space-y-2">
                {options.map((option, index) => {
                    const isSelected = selected.includes(option);
                    const isCorrect = showCorrection && correctAnswers.includes(option);
                    const isWrong = showCorrection && isSelected && !correctAnswers.includes(option);
                    const isMissed = showCorrection && !isSelected && correctAnswers.includes(option);

                    return (
                        <button
                            key={index}
                            onClick={() => handleToggle(option)}
                            disabled={disabled}
                            className={`
                w-full text-left p-4 rounded-lg border-2 transition-all
                ${isSelected && !showCorrection ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}
                ${isCorrect && isSelected ? "border-green-500 bg-green-50" : ""}
                ${isWrong ? "border-red-500 bg-red-50" : ""}
                ${isMissed ? "border-yellow-500 bg-yellow-50" : ""}
                ${!disabled && !showCorrection ? "hover:border-indigo-300 cursor-pointer" : ""}
                ${disabled ? "cursor-not-allowed opacity-60" : ""}
              `}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center
                      ${isSelected && !showCorrection ? "border-indigo-500 bg-indigo-500" : "border-gray-300"}
                      ${isCorrect && isSelected ? "border-green-500 bg-green-500" : ""}
                      ${isWrong ? "border-red-500 bg-red-500" : ""}
                      ${isMissed ? "border-yellow-500 bg-yellow-100" : ""}
                    `}
                                    >
                                        {isSelected && !showCorrection && (
                                            <Check className="w-3 h-3 text-white" />
                                        )}
                                        {isCorrect && isSelected && (
                                            <Check className="w-3 h-3 text-white" />
                                        )}
                                        {isWrong && (
                                            <X className="w-3 h-3 text-white" />
                                        )}
                                        {isMissed && (
                                            <Check className="w-3 h-3 text-yellow-600" />
                                        )}
                                    </div>
                                    <span className="text-gray-900">{option}</span>
                                </div>
                                {showCorrection && (
                                    <>
                                        {isCorrect && isSelected && <Check className="w-5 h-5 text-green-600" />}
                                        {isWrong && <X className="w-5 h-5 text-red-600" />}
                                        {isMissed && (
                                            <span className="text-xs text-yellow-600 font-medium">Não marcada</span>
                                        )}
                                    </>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
