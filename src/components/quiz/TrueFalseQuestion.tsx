"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

interface TrueFalseProps {
    question: string;
    correctAnswer?: boolean;
    userAnswer?: boolean;
    onAnswer?: (answer: boolean) => void;
    disabled?: boolean;
    showCorrection?: boolean;
}

export function TrueFalseQuestion({
    question,
    correctAnswer,
    userAnswer,
    onAnswer,
    disabled = false,
    showCorrection = false,
}: TrueFalseProps) {
    const [selected, setSelected] = useState<boolean | null>(
        userAnswer !== undefined ? userAnswer : null
    );

    const handleSelect = (value: boolean) => {
        if (disabled) return;
        setSelected(value);
        onAnswer?.(value);
    };

    const options = [
        { label: "Verdadeiro", value: true },
        { label: "Falso", value: false },
    ];

    return (
        <div className="space-y-4">
            <p className="text-gray-900 dark:text-white font-medium">{question}</p>
            <div className="grid grid-cols-2 gap-4">
                {options.map((option) => {
                    const isSelected = selected === option.value;
                    const isCorrect = showCorrection && option.value === correctAnswer;
                    const isWrong = showCorrection && isSelected && option.value !== correctAnswer;

                    return (
                        <button
                            key={option.label}
                            onClick={() => handleSelect(option.value)}
                            disabled={disabled}
                            className={`
                p-6 rounded-xl border-2 transition-all font-medium
                ${isSelected && !showCorrection ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"}
                ${isCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300" : ""}
                ${isWrong ? "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300" : ""}
                ${!disabled && !showCorrection ? "hover:border-indigo-300 dark:hover:border-indigo-600 cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20" : ""}
                ${disabled ? "cursor-not-allowed opacity-60" : ""}
              `}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-lg">{option.label}</span>
                                {showCorrection && (
                                    <>
                                        {isCorrect && (
                                            <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                                        )}
                                        {isWrong && (
                                            <X className="w-6 h-6 text-red-600 dark:text-red-400" />
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
