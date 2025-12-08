"use client";

import { useState, useEffect } from "react";
import { Check, X, GripVertical } from "lucide-react";

interface MatchPair {
    prompt: string;
    promptImage?: string;
    answer: string;
    answerImage?: string;
}

interface UserMatch {
    prompt: string;
    answer: string;
}

interface MatchFollowingProps {
    question: string;
    matchPairs: MatchPair[];
    userMatches?: UserMatch[];
    onAnswer?: (matches: UserMatch[]) => void;
    disabled?: boolean;
    showCorrection?: boolean;
}

export function MatchFollowingQuestion({
    question,
    matchPairs,
    userMatches = [],
    onAnswer,
    disabled = false,
    showCorrection = false,
}: MatchFollowingProps) {
    // Separar prompts e respostas
    const prompts = matchPairs.map((p) => p.prompt);
    const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
    const [selections, setSelections] = useState<Record<string, string>>({});
    const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

    // Embaralhar respostas na primeira vez
    useEffect(() => {
        const answers = matchPairs.map((p) => p.answer);
        const shuffled = [...answers].sort(() => Math.random() - 0.5);
        setShuffledAnswers(shuffled);

        // Inicializar com respostas existentes
        if (userMatches.length > 0) {
            const initial: Record<string, string> = {};
            userMatches.forEach((um) => {
                initial[um.prompt] = um.answer;
            });
            setSelections(initial);
        }
    }, [matchPairs]);

    const handleSelectPrompt = (prompt: string) => {
        if (disabled) return;
        setSelectedPrompt(prompt);
    };

    const handleSelectAnswer = (answer: string) => {
        if (disabled || !selectedPrompt) return;

        // Verificar se esta resposta já foi usada
        const existingPrompt = Object.keys(selections).find(
            (p) => selections[p] === answer
        );

        const newSelections = { ...selections };

        // Se já estava associada a outro prompt, remover
        if (existingPrompt) {
            delete newSelections[existingPrompt];
        }

        // Associar ao prompt selecionado
        newSelections[selectedPrompt] = answer;
        setSelections(newSelections);
        setSelectedPrompt(null);

        // Converter para array de matches
        const matches: UserMatch[] = Object.entries(newSelections).map(
            ([prompt, answer]) => ({ prompt, answer })
        );
        onAnswer?.(matches);
    };

    const removeSelection = (prompt: string) => {
        if (disabled) return;
        const newSelections = { ...selections };
        delete newSelections[prompt];
        setSelections(newSelections);

        const matches: UserMatch[] = Object.entries(newSelections).map(
            ([p, a]) => ({ prompt: p, answer: a })
        );
        onAnswer?.(matches);
    };

    const isCorrectMatch = (prompt: string, answer: string) => {
        return matchPairs.some((p) => p.prompt === prompt && p.answer === answer);
    };

    return (
        <div className="space-y-4">
            <div>
                <p className="text-gray-900 font-medium mb-1">{question}</p>
                <p className="text-sm text-gray-600">
                    Clique em um item da esquerda, depois clique no item correspondente da direita
                </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Coluna de Prompts */}
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Itens</p>
                    {prompts.map((prompt, index) => {
                        const isSelected = selectedPrompt === prompt;
                        const hasMatch = selections[prompt] !== undefined;
                        const matchedAnswer = selections[prompt];
                        const isCorrect = showCorrection && hasMatch && isCorrectMatch(prompt, matchedAnswer);
                        const isWrong = showCorrection && hasMatch && !isCorrectMatch(prompt, matchedAnswer);

                        return (
                            <div
                                key={index}
                                onClick={() => !hasMatch && handleSelectPrompt(prompt)}
                                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${isSelected ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}
                  ${hasMatch && !showCorrection ? "border-green-500 bg-green-50" : ""}
                  ${isCorrect ? "border-green-500 bg-green-50" : ""}
                  ${isWrong ? "border-red-500 bg-red-50" : ""}
                  ${!disabled && !hasMatch ? "cursor-pointer hover:border-indigo-300" : ""}
                  ${disabled ? "cursor-not-allowed opacity-60" : ""}
                `}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-900">{prompt}</span>
                                    {hasMatch && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">→ {matchedAnswer}</span>
                                            {!disabled && !showCorrection && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeSelection(prompt);
                                                    }}
                                                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                            {showCorrection && (
                                                <>
                                                    {isCorrect && <Check className="w-5 h-5 text-green-600" />}
                                                    {isWrong && <X className="w-5 h-5 text-red-600" />}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Coluna de Respostas */}
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Correspondências</p>
                    {shuffledAnswers.map((answer, index) => {
                        const isUsed = Object.values(selections).includes(answer);

                        return (
                            <div
                                key={index}
                                onClick={() => handleSelectAnswer(answer)}
                                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${isUsed ? "opacity-50 border-gray-300 bg-gray-100" : "border-gray-200"}
                  ${selectedPrompt && !isUsed ? "cursor-pointer hover:border-indigo-300 hover:bg-indigo-50" : ""}
                  ${!selectedPrompt ? "cursor-default" : ""}
                  ${disabled ? "cursor-not-allowed opacity-60" : ""}
                `}
                            >
                                <span className="text-gray-900">{answer}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mostrar respostas corretas na correção */}
            {showCorrection && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-700 mb-2">Respostas Corretas:</p>
                    <div className="space-y-1">
                        {matchPairs.map((pair, index) => (
                            <p key={index} className="text-sm text-blue-900">
                                {pair.prompt} → {pair.answer}
                            </p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
