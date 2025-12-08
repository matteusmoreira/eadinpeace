"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

interface TextAnswerProps {
    question: string;
    correctAnswer?: string;
    userAnswer?: string;
    onAnswer?: (answer: string) => void;
    disabled?: boolean;
    showCorrection?: boolean;
    maxLength?: number;
    placeholder?: string;
}

export function TextAnswerQuestion({
    question,
    correctAnswer,
    userAnswer = "",
    onAnswer,
    disabled = false,
    showCorrection = false,
    maxLength = 1000,
    placeholder = "Digite sua resposta aqui...",
}: TextAnswerProps) {
    const [answer, setAnswer] = useState(userAnswer);

    const handleChange = (value: string) => {
        if (disabled) return;
        setAnswer(value);
        onAnswer?.(value);
    };

    const isCorrect = showCorrection && answer.trim().toLowerCase() === correctAnswer?.trim().toLowerCase();
    const hasAnswer = answer.trim().length > 0;

    return (
        <div className="space-y-4">
            <div>
                <p className="text-gray-900 font-medium mb-1">{question}</p>
                {!showCorrection && (
                    <p className="text-sm text-gray-600">
                        Resposta dissertativa (máx: {maxLength} caracteres)
                    </p>
                )}
            </div>

            <div className="relative">
                <textarea
                    value={answer}
                    onChange={(e) => handleChange(e.target.value)}
                    disabled={disabled}
                    maxLength={maxLength}
                    placeholder={placeholder}
                    rows={6}
                    className={`
            w-full px-4 py-3 rounded-lg border-2 transition-all resize-none
            ${showCorrection && isCorrect ? "border-green-500 bg-green-50" : ""}
            ${showCorrection && !isCorrect && hasAnswer ? "border-orange-500 bg-orange-50" : ""}
            ${!showCorrection ? "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" : ""}
            ${disabled ? "cursor-not-allowed bg-gray-50" : ""}
          `}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                    {answer.length}/{maxLength}
                </div>
            </div>

            {showCorrection && (
                <div className="space-y-3">
                    {/* Para questões dissertativas, geralmente não há "resposta correta" única */}
                    {/* Mas vamos mostrar um indicador geral */}
                    <div
                        className={`
              p-4 rounded-lg flex items-start gap-3
              ${hasAnswer ? "bg-orange-50 border border-orange-200" : "bg-gray-50 border border-gray-200"}
            `}
                    >
                        {hasAnswer ? (
                            <>
                                <div className="p-1 bg-orange-100 rounded">
                                    <Check className="w-4 h-4 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-orange-900">
                                        Aguardando Correção Manual
                                    </p>
                                    <p className="text-xs text-orange-700 mt-1">
                                        Esta questão será corrigida pelo professor
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-1 bg-gray-200 rounded">
                                    <X className="w-4 h-4 text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        Não Respondida
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Você não forneceu uma resposta para esta questão
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
