"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Copy,
    BookOpen,
    Tag,
    BarChart3,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function QuestionBankPage() {
    const { user } = useUser();
    const [searchText, setSearchText] = useState("");
    const [typeFilter, setTypeFilter] = useState<string[]>([]);
    const [difficultyFilter, setDifficultyFilter] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    const currentUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
    const questions = useQuery(
        api.questionBank.search,
        currentUser?.organizationId
            ? {
                organizationId: currentUser.organizationId,
                searchText: searchText || undefined,
                types: typeFilter.length > 0 ? typeFilter : undefined,
                difficulties: difficultyFilter.length > 0 ? difficultyFilter : undefined,
            }
            : "skip"
    );

    const stats = useQuery(
        api.questionBank.getStats,
        currentUser?.organizationId
            ? { organizationId: currentUser.organizationId }
            : "skip"
    );

    const removeQuestion = useMutation(api.questionBank.remove);

    const handleDelete = async (questionId: string) => {
        if (!confirm("Tem certeza que deseja excluir esta questão?")) return;

        try {
            await removeQuestion({ questionId: questionId as any });
            toast.success("Questão excluída com sucesso!");
        } catch (error) {
            toast.error("Erro ao excluir questão");
            console.error(error);
        }
    };

    if (!currentUser || !questions) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const questionTypes = [
        { value: "true_false", label: "Verdadeiro/Falso" },
        { value: "single_choice", label: "Múltipla Escolha" },
        { value: "multiple_choice", label: "Múltiplas Respostas" },
        { value: "short_answer", label: "Resposta Curta" },
        { value: "text_answer", label: "Dissertativa" },
        { value: "match_following", label: "Associar" },
        { value: "sortable", label: "Ordenar" },
        { value: "fill_blanks", label: "Preencher Lacunas" },
        { value: "audio_video", label: "Áudio/Vídeo" },
    ];

    const difficulties = [
        { value: "easy", label: "Fácil", color: "green" },
        { value: "medium", label: "Médio", color: "yellow" },
        { value: "hard", label: "Difícil", color: "red" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Banco de Questões
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Crie e gerencie questões reutilizáveis para suas provas
                        </p>
                    </div>
                    <Link
                        href="/professor/question-bank/create"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
                    >
                        <Plus className="w-5 h-5" />
                        Nova Questão
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de Questões</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {stats?.total || 0}
                                </p>
                            </div>
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg">
                                <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </div>
                    </div>

                    <DifficultyStatCard
                        label="Fácil"
                        count={stats?.byDifficulty.easy || 0}
                        color="green"
                    />
                    <DifficultyStatCard
                        label="Médio"
                        count={stats?.byDifficulty.medium || 0}
                        color="yellow"
                    />
                    <DifficultyStatCard
                        label="Difícil"
                        count={stats?.byDifficulty.hard || 0}
                        color="red"
                    />
                </div>

                {/* Search and Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar questões..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                        >
                            <Filter className="w-5 h-5" />
                            Filtros
                            {(typeFilter.length > 0 || difficultyFilter.length > 0) && (
                                <span className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded-full text-xs font-medium">
                                    {typeFilter.length + difficultyFilter.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                            {/* Type Filters */}
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tipo de Questão
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {questionTypes.map((type) => (
                                        <button
                                            key={type.value}
                                            onClick={() => {
                                                if (typeFilter.includes(type.value)) {
                                                    setTypeFilter(typeFilter.filter((t) => t !== type.value));
                                                } else {
                                                    setTypeFilter([...typeFilter, type.value]);
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter.includes(type.value)
                                                ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                                }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Difficulty Filters */}
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Dificuldade
                                </p>
                                <div className="flex gap-2">
                                    {difficulties.map((diff) => (
                                        <button
                                            key={diff.value}
                                            onClick={() => {
                                                if (difficultyFilter.includes(diff.value)) {
                                                    setDifficultyFilter(
                                                        difficultyFilter.filter((d) => d !== diff.value)
                                                    );
                                                } else {
                                                    setDifficultyFilter([...difficultyFilter, diff.value]);
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${difficultyFilter.includes(diff.value)
                                                ? getDifficultyClass(diff.color, true)
                                                : getDifficultyClass(diff.color, false)
                                                }`}
                                        >
                                            {diff.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => {
                                        setTypeFilter([]);
                                        setDifficultyFilter([]);
                                    }}
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    Limpar Filtros
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                    {questions.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
                            <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Nenhuma questão encontrada
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {searchText || typeFilter.length > 0 || difficultyFilter.length > 0
                                    ? "Tente ajustar os filtros de busca"
                                    : "Comece criando sua primeira questão"}
                            </p>
                            <Link
                                href="/professor/question-bank/create"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Criar Primeira Questão
                            </Link>
                        </div>
                    ) : (
                        questions.map((question) => (
                            <QuestionCard
                                key={question._id}
                                question={question}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>

                {/* Results Count */}
                {questions.length > 0 && (
                    <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Mostrando {questions.length} questões
                    </div>
                )}
            </div>
        </div>
    );
}

function DifficultyStatCard({
    label,
    count,
    color,
}: {
    label: string;
    count: number;
    color: "green" | "yellow" | "red";
}) {
    const colors = {
        green: { bg: "bg-green-50 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400", icon: "text-green-600 dark:text-green-400" },
        yellow: {
            bg: "bg-yellow-50 dark:bg-yellow-900/30",
            text: "text-yellow-600 dark:text-yellow-400",
            icon: "text-yellow-600 dark:text-yellow-400",
        },
        red: { bg: "bg-red-50 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", icon: "text-red-600 dark:text-red-400" },
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{count}</p>
                </div>
                <div className={`p-3 ${colors[color].bg} rounded-lg`}>
                    <BarChart3 className={`w-6 h-6 ${colors[color].icon}`} />
                </div>
            </div>
        </div>
    );
}

function QuestionCard({
    question,
    onDelete,
}: {
    question: any;
    onDelete: (id: string) => void;
}) {
    const typeLabels: Record<string, string> = {
        true_false: "Verdadeiro/Falso",
        single_choice: "Múltipla Escolha",
        multiple_choice: "Múltiplas Respostas",
        short_answer: "Resposta Curta",
        text_answer: "Dissertativa",
        match_following: "Associar",
        sortable: "Ordenar",
        fill_blanks: "Preencher Lacunas",
        audio_video: "Áudio/Vídeo",
    };

    const difficultyConfig = {
        easy: { label: "Fácil", class: "bg-green-100 text-green-700" },
        medium: { label: "Médio", class: "bg-yellow-100 text-yellow-700" },
        hard: { label: "Difícil", class: "bg-red-100 text-red-700" },
    };

    const difficulty = difficultyConfig[question.difficulty as keyof typeof difficultyConfig];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium">
                            {typeLabels[question.type]}
                        </span>
                        <span
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${difficulty.class}`}
                        >
                            {difficulty.label}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">
                            {question.defaultPoints} pts
                        </span>
                        {question.usageCount > 0 && (
                            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium flex items-center gap-1">
                                <Copy className="w-3 h-3" />
                                Usada {question.usageCount}x
                            </span>
                        )}
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium mb-2">{question.question}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>Por {question.creatorName}</span>
                        <span>•</span>
                        <span>{new Date(question.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                    {question.tags.length > 0 && (
                        <div className="flex items-center gap-2 mt-3">
                            <Tag className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <div className="flex flex-wrap gap-1">
                                {question.tags.map((tag: string) => (
                                    <span
                                        key={tag}
                                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <Link
                        href={`/professor/question-bank/${question._id}/edit`}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                    >
                        <Edit className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={() => onDelete(question._id)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function getDifficultyClass(color: string, selected: boolean) {
    const classes = {
        green: selected
            ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600",
        yellow: selected
            ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300"
            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600",
        red: selected
            ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600",
    };
    return classes[color as keyof typeof classes];
}
