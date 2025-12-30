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
                <p className="text-gray-900 dark:text-white font-medium mb-1">{question}</p>
                {!showCorrection && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
            w-full px-4 py-3 rounded-lg border-2 transition-all resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
            ${showCorrection && isCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/30" : ""}
            ${showCorrection && !isCorrect && hasAnswer ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30" : ""}
            ${!showCorrection ? "border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800" : ""}
            ${disabled ? "cursor-not-allowed bg-gray-50 dark:bg-gray-900" : ""}
          `}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-500 dark:text-gray-400">
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
              ${hasAnswer ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800" : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"}
            `}
                    >
                        {hasAnswer ? (
                            <>
                                <div className="p-1 bg-orange-100 dark:bg-orange-900/40 rounded">
                                    <Check className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                                        Aguardando Correção Manual
                                    </p>
                                    <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                                        Esta questão será corrigida pelo professor
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-1 bg-gray-200 dark:bg-gray-700 rounded">
                                    <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        Não Respondida
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
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
