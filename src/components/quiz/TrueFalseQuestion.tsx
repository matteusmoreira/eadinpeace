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
            <p className="text-gray-900 font-medium">{question}</p>
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
                ${isSelected && !showCorrection ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-700"}
                ${isCorrect ? "border-green-500 bg-green-50 text-green-700" : ""}
                ${isWrong ? "border-red-500 bg-red-50 text-red-700" : ""}
                ${!disabled && !showCorrection ? "hover:border-indigo-300 cursor-pointer hover:bg-indigo-50/50" : ""}
                ${disabled ? "cursor-not-allowed opacity-60" : ""}
              `}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-lg">{option.label}</span>
                                {showCorrection && (
                                    <>
                                        {isCorrect && (
                                            <Check className="w-6 h-6 text-green-600" />
                                        )}
                                        {isWrong && (
                                            <X className="w-6 h-6 text-red-600" />
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
