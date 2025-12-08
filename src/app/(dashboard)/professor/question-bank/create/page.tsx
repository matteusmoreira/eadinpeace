"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { QuestionType, getQuestionTypeLabel } from "@/components/quiz/QuestionRenderer";
import { useUser } from "@clerk/nextjs";

export default function CreateQuestionPage() {
    const router = useRouter();
    const { user } = useUser();
    const currentUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
    const createQuestion = useMutation(api.questionBank.create);

    const [formData, setFormData] = useState({
        type: "single_choice" as QuestionType,
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        correctAnswers: [] as string[],
        explanation: "",
        defaultPoints: 10,
        tags: [] as string[],
        difficulty: "medium" as "easy" | "medium" | "hard",
    });

    const [tagInput, setTagInput] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const questionTypes: QuestionType[] = [
        "true_false",
        "single_choice",
        "multiple_choice",
        "short_answer",
        "text_answer",
    ];

    const handleAddOption = () => {
        setFormData({
            ...formData,
            options: [...formData.options, ""],
        });
    };

    const handleRemoveOption = (index: number) => {
        const newOptions = formData.options.filter((_, i) => i !== index);
        setFormData({ ...formData, options: newOptions });
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData({ ...formData, options: newOptions });
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData({
                ...formData,
                tags: [...formData.tags, tagInput.trim()],
            });
            setTagInput("");
        }
    };

    const handleRemoveTag = (tag: string) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter((t) => t !== tag),
        });
    };

    const handleSave = async () => {
        if (!currentUser?.organizationId) {
            toast.error("Organização não encontrada");
            return;
        }

        // Validações
        if (!formData.question.trim()) {
            toast.error("Digite a pergunta");
            return;
        }

        if (["single_choice", "multiple_choice"].includes(formData.type)) {
            const validOptions = formData.options.filter((opt) => opt.trim());
            if (validOptions.length < 2) {
                toast.error("Adicione pelo menos 2 opções");
                return;
            }

            if (formData.type === "single_choice" && !formData.correctAnswer) {
                toast.error("Selecione a resposta correta");
                return;
            }

            if (formData.type === "multiple_choice" && formData.correctAnswers.length === 0) {
                toast.error("Selecione pelo menos uma resposta correta");
                return;
            }
        }

        setIsSaving(true);
        try {
            await createQuestion({
                organizationId: currentUser.organizationId,
                type: formData.type,
                question: formData.question,
                options: formData.options.filter((opt) => opt.trim()).length > 0
                    ? formData.options.filter((opt) => opt.trim())
                    : undefined,
                correctAnswer: formData.correctAnswer || undefined,
                correctAnswers: formData.correctAnswers.length > 0 ? formData.correctAnswers : undefined,
                explanation: formData.explanation || undefined,
                defaultPoints: formData.defaultPoints,
                tags: formData.tags,
                difficulty: formData.difficulty,
                // Campos para outros tipos (não implementados ainda)
                matchPairs: undefined,
                correctOrder: undefined,
                blankPositions: undefined,
                blankAnswers: undefined,
                mediaUrl: undefined,
                mediaType: undefined,
            });

            toast.success("Questão criada com sucesso!");
            router.push("/professor/question-bank");
        } catch (error) {
            toast.error("Erro ao criar questão");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/professor/question-bank"
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Banco de Questões
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Nova Questão
                    </h1>
                    <p className="text-gray-600">Crie uma questão reutilizável para suas provas</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
                    {/* Tipo de Questão */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Questão *
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as QuestionType })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            {questionTypes.map((type) => (
                                <option key={type} value={type}>
                                    {getQuestionTypeLabel(type)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Pergunta */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pergunta *
                        </label>
                        <textarea
                            value={formData.question}
                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                            rows={3}
                            placeholder="Digite a pergunta..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Opções (para single_choice e multiple_choice) */}
                    {["single_choice", "multiple_choice"].includes(formData.type) && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Opções *
                                </label>
                                <button
                                    onClick={handleAddOption}
                                    className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" />
                                    Adicionar Opção
                                </button>
                            </div>
                            <div className="space-y-3">
                                {formData.options.map((option, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        {formData.type === "single_choice" ? (
                                            <input
                                                type="radio"
                                                name="correctAnswer"
                                                checked={formData.correctAnswer === option}
                                                onChange={() => setFormData({ ...formData, correctAnswer: option })}
                                                className="w-5 h-5 text-indigo-600"
                                            />
                                        ) : (
                                            <input
                                                type="checkbox"
                                                checked={formData.correctAnswers.includes(option)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setFormData({
                                                            ...formData,
                                                            correctAnswers: [...formData.correctAnswers, option],
                                                        });
                                                    } else {
                                                        setFormData({
                                                            ...formData,
                                                            correctAnswers: formData.correctAnswers.filter((a) => a !== option),
                                                        });
                                                    }
                                                }}
                                                className="w-5 h-5 text-indigo-600 rounded"
                                            />
                                        )}
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            placeholder={`Opção ${index + 1}`}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                        {formData.options.length > 2 && (
                                            <button
                                                onClick={() => handleRemoveOption(index)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                {formData.type === "single_choice"
                                    ? "Selecione a opção correta (círculo)"
                                    : "Selecione todas as opções corretas (quadrado)"}
                            </p>
                        </div>
                    )}

                    {/* Resposta Correta (para true_false) */}
                    {formData.type === "true_false" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Resposta Correta *
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setFormData({ ...formData, correctAnswer: "true" })}
                                    className={`p-4 rounded-lg border-2 transition-all ${formData.correctAnswer === "true"
                                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                        : "border-gray-300 text-gray-700 hover:border-indigo-300"
                                        }`}
                                >
                                    Verdadeiro
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, correctAnswer: "false" })}
                                    className={`p-4 rounded-lg border-2 transition-all ${formData.correctAnswer === "false"
                                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                        : "border-gray-300 text-gray-700 hover:border-indigo-300"
                                        }`}
                                >
                                    Falso
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Explicação */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Explicação (opcional)
                        </label>
                        <textarea
                            value={formData.explanation}
                            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                            rows={3}
                            placeholder="Explique a resposta correta..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Pontos e Dificuldade */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pontos Padrão *
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={formData.defaultPoints}
                                onChange={(e) => setFormData({ ...formData, defaultPoints: Number(e.target.value) })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Dificuldade *
                            </label>
                            <select
                                value={formData.difficulty}
                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="easy">Fácil</option>
                                <option value="medium">Médio</option>
                                <option value="hard">Difícil</option>
                            </select>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tags (opcional)
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                                placeholder="Digite uma tag e pressione Enter"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleAddTag}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Adicionar
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm"
                                >
                                    {tag}
                                    <button
                                        onClick={() => handleRemoveTag(tag)}
                                        className="hover:text-indigo-900"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-6 border-t">
                        <Link
                            href="/professor/question-bank"
                            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </Link>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? "Salvando..." : "Salvar Questão"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
