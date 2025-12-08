"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

interface SingleChoiceProps {
    question: string;
    options: string[];
    correctAnswer?: string;
    userAnswer?: string;
    onAnswer?: (answer: string) => void;
    disabled?: boolean;
    showCorrection?: boolean;
}

export function SingleChoiceQuestion({
    question,
    options,
    correctAnswer,
    userAnswer,
    onAnswer,
    disabled = false,
    showCorrection = false,
}: SingleChoiceProps) {
    const [selected, setSelected] = useState<string>(userAnswer || "");

    const handleSelect = (option: string) => {
        if (disabled) return;
        setSelected(option);
        onAnswer?.(option);
    };

    return (
        <div className="space-y-4">
            <p className="text-gray-900 font-medium">{question}</p>
            <div className="space-y-2">
                {options.map((option, index) => {
                    const isSelected = selected === option;
                    const isCorrect = showCorrection && option === correctAnswer;
                    const isWrong = showCorrection && isSelected && option !== correctAnswer;

                    return (
                        <button
                            key={index}
                            onClick={() => handleSelect(option)}
                            disabled={disabled}
                            className={`
                w-full text-left p-4 rounded-lg border-2 transition-all
                ${isSelected && !showCorrection ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}
                ${isCorrect ? "border-green-500 bg-green-50" : ""}
                ${isWrong ? "border-red-500 bg-red-50" : ""}
                ${!disabled && !showCorrection ? "hover:border-indigo-300 cursor-pointer" : ""}
                ${disabled ? "cursor-not-allowed opacity-60" : ""}
              `}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${isSelected && !showCorrection ? "border-indigo-500 bg-indigo-500" : "border-gray-300"}
                      ${isCorrect ? "border-green-500 bg-green-500" : ""}
                      ${isWrong ? "border-red-500 bg-red-500" : ""}
                    `}
                                    >
                                        {(isSelected || isCorrect) && (
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                        )}
                                    </div>
                                    <span className="text-gray-900">{option}</span>
                                </div>
                                {showCorrection && (
                                    <>
                                        {isCorrect && <Check className="w-5 h-5 text-green-600" />}
                                        {isWrong && <X className="w-5 h-5 text-red-600" />}
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
