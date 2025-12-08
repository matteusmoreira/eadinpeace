"use client";

import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

interface FillBlanksQuestionProps {
    question: string; // Texto com _____ marcando as lacunas
    blankAnswers: string[]; // Respostas corretas para cada lacuna
    userBlanks?: string[];
    onAnswer?: (blanks: string[]) => void;
    disabled?: boolean;
    showCorrection?: boolean;
}

export function FillBlanksQuestion({
    question,
    blankAnswers,
    userBlanks = [],
    onAnswer,
    disabled = false,
    showCorrection = false,
}: FillBlanksQuestionProps) {
    const [answers, setAnswers] = useState<string[]>([]);

    // Inicializar com respostas do usuário ou vazias
    useEffect(() => {
        if (userBlanks.length > 0) {
            setAnswers(userBlanks);
        } else {
            setAnswers(new Array(blankAnswers.length).fill(""));
        }
    }, [blankAnswers.length, userBlanks]);

    const handleChange = (index: number, value: string) => {
        if (disabled) return;

        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
        onAnswer?.(newAnswers);
    };

    const isCorrect = (index: number) => {
        return answers[index]?.toLowerCase().trim() === blankAnswers[index]?.toLowerCase().trim();
    };

    // Dividir o texto nas lacunas
    const parts = question.split(/(_____)/g);
    let blankIndex = 0;

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-2">
                Preencha as lacunas com as palavras corretas
            </p>

            {/* Texto com campos de input inline */}
            <div className="text-gray-900 leading-relaxed text-lg">
                {parts.map((part, index) => {
                    if (part === "_____") {
                        const currentBlankIndex = blankIndex;
                        blankIndex++;

                        const userAnswer = answers[currentBlankIndex] || "";
                        const correct = showCorrection && isCorrect(currentBlankIndex);
                        const wrong = showCorrection && !isCorrect(currentBlankIndex) && userAnswer.length > 0;
                        const empty = showCorrection && userAnswer.length === 0;

                        return (
                            <span key={index} className="inline-flex items-center mx-1 align-baseline">
                                <span className="relative">
                                    <input
                                        type="text"
                                        value={userAnswer}
                                        onChange={(e) => handleChange(currentBlankIndex, e.target.value)}
                                        disabled={disabled}
                                        placeholder={`Lacuna ${currentBlankIndex + 1}`}
                                        className={`
                      w-32 px-3 py-1 text-center border-b-2 bg-transparent
                      focus:outline-none transition-colors
                      ${correct ? "border-green-500 text-green-700" : ""}
                      ${wrong ? "border-red-500 text-red-700" : ""}
                      ${empty ? "border-orange-500" : ""}
                      ${!showCorrection ? "border-indigo-400 focus:border-indigo-600" : ""}
                      ${disabled ? "cursor-not-allowed" : ""}
                    `}
                                    />
                                    {showCorrection && (
                                        <span className="absolute -right-6 top-1/2 -translate-y-1/2">
                                            {correct && <Check className="w-4 h-4 text-green-600" />}
                                            {wrong && <X className="w-4 h-4 text-red-600" />}
                                        </span>
                                    )}
                                </span>
                            </span>
                        );
                    }
                    return <span key={index}>{part}</span>;
                })}
            </div>

            {/* Mostrar respostas corretas na correção */}
            {showCorrection && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-700 mb-3">Respostas Corretas:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {blankAnswers.map((answer, index) => {
                            const userAnswer = answers[index] || "";
                            const correct = isCorrect(index);

                            return (
                                <div
                                    key={index}
                                    className={`
                    p-3 rounded-lg border
                    ${correct ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}
                  `}
                                >
                                    <p className="text-xs text-gray-600 mb-1">Lacuna {index + 1}</p>
                                    <p className={`font-medium ${correct ? "text-green-700" : "text-red-700"}`}>
                                        {answer}
                                    </p>
                                    {!correct && userAnswer && (
                                        <p className="text-xs text-red-500 mt-1">
                                            Sua resposta: {userAnswer}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Contador de lacunas preenchidas */}
            {!showCorrection && (
                <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
                    <span>
                        {answers.filter((a) => a.trim().length > 0).length} de {blankAnswers.length} lacunas preenchidas
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div
                            className="bg-indigo-500 h-1.5 rounded-full transition-all"
                            style={{
                                width: `${(answers.filter((a) => a.trim().length > 0).length / blankAnswers.length) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
