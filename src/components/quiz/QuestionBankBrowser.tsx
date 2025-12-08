"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, X, Check, Filter, Plus } from "lucide-react";
import { getQuestionTypeLabel } from "@/components/quiz/QuestionRenderer";

interface QuestionBankBrowserProps {
    organizationId: string;
    quizId?: string;
    onSelect?: (questionIds: string[]) => void;
    onImport?: (count: number) => void;
    isOpen: boolean;
    onClose: () => void;
}

export function QuestionBankBrowser({
    organizationId,
    quizId,
    onSelect,
    onImport,
    isOpen,
    onClose,
}: QuestionBankBrowserProps) {
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<string>("");
    const [filterDifficulty, setFilterDifficulty] = useState<string>("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const questions = useQuery(
        api.questionBank.search,
        organizationId
            ? {
                organizationId: organizationId as any,
                searchTerm: search || undefined,
                type: filterType || undefined,
                difficulty: filterDifficulty as any || undefined,
            }
            : "skip"
    );

    const importToQuiz = useMutation(api.questionBank.importToQuiz);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const handleImport = async () => {
        if (!quizId || selectedIds.length === 0) return;

        try {
            for (const questionId of selectedIds) {
                await importToQuiz({
                    questionBankId: questionId as any,
                    quizId: quizId as any,
                });
            }
            onImport?.(selectedIds.length);
            setSelectedIds([]);
            onClose();
        } catch (error) {
            console.error("Error importing questions:", error);
        }
    };

    if (!isOpen) return null;

    const difficultyLabels: Record<string, string> = {
        easy: "Fácil",
        medium: "Médio",
        hard: "Difícil",
    };

    const difficultyColors: Record<string, string> = {
        easy: "bg-green-100 text-green-700",
        medium: "bg-yellow-100 text-yellow-700",
        hard: "bg-red-100 text-red-700",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Banco de Questões</h2>
                        <p className="text-sm text-gray-600">
                            Selecione as questões para importar para o quiz
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 border-b flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar questões..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Todos os Tipos</option>
                        <option value="true_false">Verdadeiro/Falso</option>
                        <option value="single_choice">Múltipla Escolha</option>
                        <option value="multiple_choice">Múltiplas Respostas</option>
                        <option value="short_answer">Resposta Curta</option>
                        <option value="text_answer">Dissertativa</option>
                        <option value="match_following">Associar</option>
                        <option value="sortable">Ordenar</option>
                        <option value="fill_blanks">Preencher Lacunas</option>
                        <option value="audio_video">Áudio/Vídeo</option>
                    </select>
                    <select
                        value={filterDifficulty}
                        onChange={(e) => setFilterDifficulty(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Todas as Dificuldades</option>
                        <option value="easy">Fácil</option>
                        <option value="medium">Médio</option>
                        <option value="hard">Difícil</option>
                    </select>
                </div>

                {/* Questions List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {!questions || questions.length === 0 ? (
                        <div className="text-center py-12">
                            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">Nenhuma questão encontrada</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {questions.map((q) => {
                                const isSelected = selectedIds.includes(q._id);

                                return (
                                    <div
                                        key={q._id}
                                        onClick={() => toggleSelect(q._id)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                            ? "border-indigo-500 bg-indigo-50"
                                            : "border-gray-200 hover:border-indigo-200"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 mt-1 ${isSelected
                                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                                    : "border-gray-300"
                                                    }`}
                                            >
                                                {isSelected && <Check className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-gray-900 font-medium mb-2">{q.question}</p>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                                        {getQuestionTypeLabel(q.type as any)}
                                                    </span>
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs ${difficultyColors[q.difficulty] || "bg-gray-100 text-gray-700"
                                                            }`}
                                                    >
                                                        {difficultyLabels[q.difficulty] || q.difficulty}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {q.defaultPoints} pts
                                                    </span>
                                                    {q.tags?.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t flex items-center justify-between bg-gray-50">
                    <p className="text-sm text-gray-600">
                        {selectedIds.length} questão(ões) selecionada(s)
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={selectedIds.length === 0}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4" />
                            Importar Selecionadas
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
