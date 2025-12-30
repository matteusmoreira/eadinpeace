"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    GripVertical,
    Settings2,
    BookOpen,
    ChevronDown,
    ChevronUp,
    Loader2,
    Import,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
    QuestionType,
    getQuestionTypeLabel,
    requiresManualGrading,
} from "@/components/quiz/QuestionRenderer";
import { QuestionBankBrowser } from "@/components/quiz/QuestionBankBrowser";
import { Id } from "@convex/_generated/dataModel";

// Tipos locais
interface LocalQuestion {
    _id?: Id<"quizQuestions">;
    id: string;
    type: QuestionType;
    question: string;
    options: string[];
    correctAnswer: string;
    correctAnswers: string[];
    matchPairs: { prompt: string; answer: string }[];
    correctOrder: string[];
    blankAnswers: string[];
    mediaUrl: string;
    mediaType: "audio" | "video";
    points: number;
    explanation: string;
    isNew?: boolean;
    isDeleted?: boolean;
}

export default function EditQuizPage() {
    const router = useRouter();
    const params = useParams();
    const quizId = params.id as string;
    const { user } = useUser();

    const currentUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
    const quiz = useQuery(api.quizzes.getById, { quizId: quizId as any });
    const quizQuestions = useQuery(api.quizzes.getQuestions, { quizId: quizId as any });
    // Buscar todos os cursos da organização (api.courses.getAll já filtra por organização)
    const courses = useQuery(
        api.courses.getAll,
        currentUser ? {} : "skip"
    );

    const updateQuiz = useMutation(api.quizzes.update);
    const publishQuiz = useMutation(api.quizzes.publish);
    const unpublishQuiz = useMutation(api.quizzes.unpublish);
    const addQuestion = useMutation(api.quizzes.addQuestion);
    const updateQuestion = useMutation(api.quizzes.updateQuestion);
    const removeQuestion = useMutation(api.quizzes.removeQuestion);

    // Estado do Quiz
    const [quizData, setQuizData] = useState({
        title: "",
        description: "",
        courseId: "",
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
        isPublished: false,
        randomizeQuestions: false,
        randomizeOptions: false,
        allowStudentFeedback: false,
        weight: 1,
    });

    // Estado das Questões
    const [questions, setQuestions] = useState<LocalQuestion[]>([]);
    const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const [showQuestionBank, setShowQuestionBank] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Carregar dados do quiz
    useEffect(() => {
        if (quiz && quizQuestions && !isLoaded) {
            setQuizData({
                title: quiz.title,
                description: quiz.description || "",
                courseId: quiz.courseId,
                duration: quiz.timeLimit || 30,
                passingScore: quiz.passingScore || 70,
                maxAttempts: quiz.maxAttempts || 3,
                isPublished: quiz.isPublished || false,
                randomizeQuestions: quiz.randomizeQuestions || false,
                randomizeOptions: quiz.randomizeOptions || false,
                allowStudentFeedback: quiz.allowStudentFeedback || false,
                weight: quiz.weight || 1,
            });

            setQuestions(
                quizQuestions.map((q: any) => ({
                    _id: q._id,
                    id: q._id,
                    type: q.type as QuestionType,
                    question: q.question,
                    options: q.options || [],
                    correctAnswer: q.correctAnswer || "",
                    correctAnswers: q.correctAnswers || [],
                    matchPairs: q.matchPairs || [],
                    correctOrder: q.correctOrder || [],
                    blankAnswers: q.blankAnswers || [],
                    mediaUrl: q.mediaUrl || "",
                    mediaType: q.mediaType || "video",
                    points: q.points || 10,
                    explanation: q.explanation || "",
                    isNew: false,
                    isDeleted: false,
                }))
            );
            setIsLoaded(true);
        }
    }, [quiz, quizQuestions, isLoaded]);

    // Criar nova questão
    const addNewQuestion = (type: QuestionType) => {
        const newQuestion: LocalQuestion = {
            id: `new-${Date.now()}`,
            type,
            question: "",
            options: type === "single_choice" || type === "multiple_choice" ? ["", "", "", ""] : [],
            correctAnswer: type === "true_false" ? "true" : "",
            correctAnswers: [],
            matchPairs: type === "match_following" ? [{ prompt: "", answer: "" }] : [],
            correctOrder: type === "sortable" ? [""] : [],
            blankAnswers: type === "fill_blanks" ? [""] : [],
            mediaUrl: "",
            mediaType: "video",
            points: 10,
            explanation: "",
            isNew: true,
        };
        setQuestions([...questions, newQuestion]);
        setSelectedQuestionIndex(questions.length);
    };

    // Atualizar questão
    const updateLocalQuestion = (index: number, updates: Partial<LocalQuestion>) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], ...updates };
        setQuestions(newQuestions);
    };

    // Remover questão (marcar como deletada)
    const markQuestionDeleted = (index: number) => {
        const question = questions[index];
        if (question.isNew) {
            // Se é nova, só remove da lista
            setQuestions(questions.filter((_, i) => i !== index));
        } else {
            // Se existe no banco, marca como deletada
            const newQuestions = [...questions];
            newQuestions[index] = { ...newQuestions[index], isDeleted: true };
            setQuestions(newQuestions);
        }
        setSelectedQuestionIndex(null);
    };

    // Mover questão
    const moveQuestion = (index: number, direction: "up" | "down") => {
        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= questions.length) return;

        const newQuestions = [...questions];
        [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
        setQuestions(newQuestions);
        setSelectedQuestionIndex(newIndex);
    };

    // Salvar Quiz
    const handleSave = async () => {
        if (!quiz) return;
        if (!quizData.title.trim()) {
            toast.error("Digite o título da prova");
            return;
        }

        setIsSaving(true);
        try {
            // Atualizar dados do quiz
            await updateQuiz({
                quizId: quizId as any,
                title: quizData.title,
                description: quizData.description,
                timeLimit: quizData.duration,
                passingScore: quizData.passingScore,
                maxAttempts: quizData.maxAttempts,
            });

            // Atualizar status de publicação
            if (quizData.isPublished !== quiz.isPublished) {
                if (quizData.isPublished) {
                    await publishQuiz({ quizId: quizId as any });
                } else {
                    await unpublishQuiz({ quizId: quizId as any });
                }
            }

            // Processar questões
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];

                if (q.isDeleted && q._id) {
                    // Remover questão
                    await removeQuestion({ questionId: q._id });
                } else if (q.isNew) {
                    // Adicionar nova questão
                    await addQuestion({
                        quizId: quizId as any,
                        type: q.type,
                        question: q.question,
                        options: q.options.filter((o) => o.trim()).length > 0 ? q.options.filter((o) => o.trim()) : undefined,
                        correctAnswer: q.correctAnswer || undefined,
                        points: q.points,
                    });
                } else if (q._id) {
                    // Atualizar questão existente
                    await updateQuestion({
                        questionId: q._id,
                        question: q.question,
                        options: q.options.filter((o) => o.trim()).length > 0 ? q.options.filter((o) => o.trim()) : undefined,
                        correctAnswer: q.correctAnswer || undefined,
                        points: q.points,
                    });
                }
            }

            toast.success("Prova atualizada com sucesso!");
            router.push("/professor/quizzes");
        } catch (error) {
            toast.error("Erro ao atualizar prova");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!quiz || !quizQuestions) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
            </div>
        );
    }

    const activeQuestions = questions.filter((q) => !q.isDeleted);
    const questionTypes: { type: QuestionType; icon: string }[] = [
        { type: "true_false", icon: "✓✗" },
        { type: "single_choice", icon: "○" },
        { type: "multiple_choice", icon: "☑" },
        { type: "short_answer", icon: "Aa" },
        { type: "text_answer", icon: "📝" },
        { type: "match_following", icon: "↔" },
        { type: "sortable", icon: "⇅" },
        { type: "fill_blanks", icon: "___" },
        { type: "audio_video", icon: "▶" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/professor/quizzes"
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Editar Prova</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {activeQuestions.length} questões •{" "}
                                    {activeQuestions.reduce((acc, q) => acc + q.points, 0)} pontos
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowQuestionBank(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                            >
                                <Import className="w-4 h-4" />
                                Importar
                            </button>
                            <button
                                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                            >
                                <Settings2 className="w-4 h-4" />
                                Configurações
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {isSaving ? "Salvando..." : "Salvar"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="grid grid-cols-12 gap-6">
                    {/* Sidebar - Lista de Questões */}
                    <div className="col-span-3">
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/50 p-4 sticky top-24 border border-transparent dark:border-gray-800">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Questões</h3>

                            {/* Lista de questões */}
                            <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
                                {activeQuestions.map((q, index) => {
                                    const realIndex = questions.findIndex((qq) => qq.id === q.id);
                                    return (
                                        <div
                                            key={q.id}
                                            onClick={() => setSelectedQuestionIndex(realIndex)}
                                            className={`
                        flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors
                        ${selectedQuestionIndex === realIndex ? "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-500" : "hover:bg-gray-50 dark:hover:bg-gray-800"}
                        ${q.isNew ? "border-l-4 border-l-green-500" : ""}
                        border border-gray-200 dark:border-gray-700
                      `}
                                        >
                                            <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{index + 1}.</span>
                                            <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">
                                                {q.question || `Nova ${getQuestionTypeLabel(q.type)}`}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{q.points}pts</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Adicionar Questão */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adicionar Questão</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {questionTypes.map(({ type, icon }) => (
                                        <button
                                            key={type}
                                            onClick={() => addNewQuestion(type)}
                                            title={getQuestionTypeLabel(type)}
                                            className="p-2 text-center bg-gray-100 dark:bg-gray-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-400 rounded-lg transition-colors text-lg"
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main - Editor */}
                    <div className="col-span-9 space-y-6">
                        {/* Informações do Quiz */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-800">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Informações da Prova
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
                                    <input
                                        type="text"
                                        value={quizData.title}
                                        onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                                    <textarea
                                        value={quizData.description}
                                        onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    />
                                </div>
                                <div className="grid grid-cols-4 gap-3 col-span-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duração (min)</label>
                                        <input
                                            type="number"
                                            min="5"
                                            value={quizData.duration}
                                            onChange={(e) => setQuizData({ ...quizData, duration: Number(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aprovação (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={quizData.passingScore}
                                            onChange={(e) => setQuizData({ ...quizData, passingScore: Number(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tentativas</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={quizData.maxAttempts}
                                            onChange={(e) => setQuizData({ ...quizData, maxAttempts: Number(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <label className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer w-full border border-transparent dark:border-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={quizData.isPublished}
                                                onChange={(e) => setQuizData({ ...quizData, isPublished: e.target.checked })}
                                                className="w-4 h-4 text-indigo-600 rounded"
                                            />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Publicado</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Configurações Avançadas */}
                            {showAdvancedSettings && (
                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Configurações Avançadas</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer border border-transparent dark:border-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={quizData.randomizeQuestions}
                                                onChange={(e) => setQuizData({ ...quizData, randomizeQuestions: e.target.checked })}
                                                className="w-4 h-4 text-indigo-600 rounded"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Embaralhar Questões</span>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer border border-transparent dark:border-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={quizData.randomizeOptions}
                                                onChange={(e) => setQuizData({ ...quizData, randomizeOptions: e.target.checked })}
                                                className="w-4 h-4 text-indigo-600 rounded"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Embaralhar Opções</span>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer border border-transparent dark:border-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={quizData.allowStudentFeedback}
                                                onChange={(e) => setQuizData({ ...quizData, allowStudentFeedback: e.target.checked })}
                                                className="w-4 h-4 text-indigo-600 rounded"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Feedback de Alunos</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Editor de Questão Selecionada */}
                        {selectedQuestionIndex !== null && questions[selectedQuestionIndex] && !questions[selectedQuestionIndex].isDeleted && (
                            <QuestionEditor
                                question={questions[selectedQuestionIndex]}
                                index={activeQuestions.findIndex((q) => q.id === questions[selectedQuestionIndex].id)}
                                totalQuestions={activeQuestions.length}
                                onUpdate={(updates) => updateLocalQuestion(selectedQuestionIndex, updates)}
                                onRemove={() => markQuestionDeleted(selectedQuestionIndex)}
                                onMove={(direction) => moveQuestion(selectedQuestionIndex, direction)}
                            />
                        )}

                        {/* Empty State */}
                        {activeQuestions.length === 0 && (
                            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/50 p-12 text-center border border-transparent dark:border-gray-800">
                                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Plus className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma questão</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Clique nos ícones da barra lateral para adicionar questões
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Question Bank Browser Modal */}
            {showQuestionBank && currentUser?.organizationId && (
                <QuestionBankBrowser
                    organizationId={currentUser.organizationId}
                    quizId={quizId}
                    isOpen={showQuestionBank}
                    onClose={() => setShowQuestionBank(false)}
                    onImport={(count) => {
                        toast.success(`${count} questão(ões) importada(s)!`);
                        setIsLoaded(false); // Força recarregar
                    }}
                />
            )}
        </div>
    );
}

// Componente para editar questão (reutilizado da página de criação)
function QuestionEditor({
    question,
    index,
    totalQuestions,
    onUpdate,
    onRemove,
    onMove,
}: {
    question: LocalQuestion;
    index: number;
    totalQuestions: number;
    onUpdate: (updates: Partial<LocalQuestion>) => void;
    onRemove: () => void;
    onMove: (direction: "up" | "down") => void;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{index + 1}</span>
                    <div>
                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium">
                            {getQuestionTypeLabel(question.type)}
                        </span>
                        {requiresManualGrading(question.type) && (
                            <span className="ml-2 px-2 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded text-xs">
                                Correção Manual
                            </span>
                        )}
                        {question.isNew && (
                            <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded text-xs">
                                Nova
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onMove("up")}
                        disabled={index === 0}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50"
                    >
                        <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onMove("down")}
                        disabled={index === totalQuestions - 1}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onRemove}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Pergunta */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pergunta *</label>
                <textarea
                    value={question.question}
                    onChange={(e) => onUpdate({ question: e.target.value })}
                    rows={2}
                    placeholder="Digite a pergunta..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
            </div>

            {/* Campos específicos por tipo */}
            {(question.type === "single_choice" || question.type === "multiple_choice") && (
                <OptionsEditor question={question} onUpdate={onUpdate} />
            )}

            {question.type === "true_false" && (
                <TrueFalseEditor question={question} onUpdate={onUpdate} />
            )}

            {/* Pontuação */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pontos</label>
                    <input
                        type="number"
                        min="1"
                        value={question.points}
                        onChange={(e) => onUpdate({ points: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explicação</label>
                    <input
                        type="text"
                        value={question.explanation}
                        onChange={(e) => onUpdate({ explanation: e.target.value })}
                        placeholder="Explique a resposta..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                </div>
            </div>
        </div>
    );
}

// Sub-componentes de edição
function OptionsEditor({ question, onUpdate }: { question: LocalQuestion; onUpdate: (updates: Partial<LocalQuestion>) => void }) {
    const isMultiple = question.type === "multiple_choice";

    const addOption = () => onUpdate({ options: [...question.options, ""] });
    const removeOption = (index: number) => onUpdate({ options: question.options.filter((_, i) => i !== index) });
    const updateOption = (index: number, value: string) => {
        const newOptions = [...question.options];
        newOptions[index] = value;
        onUpdate({ options: newOptions });
    };

    const toggleCorrect = (option: string) => {
        if (isMultiple) {
            const current = question.correctAnswers || [];
            onUpdate({
                correctAnswers: current.includes(option)
                    ? current.filter((a) => a !== option)
                    : [...current, option],
            });
        } else {
            onUpdate({ correctAnswer: option });
        }
    };

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Opções</label>
                <button onClick={addOption} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                    Adicionar
                </button>
            </div>
            <div className="space-y-2">
                {question.options.map((option, index) => {
                    const isCorrect = isMultiple ? question.correctAnswers?.includes(option) : question.correctAnswer === option;
                    return (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type={isMultiple ? "checkbox" : "radio"}
                                checked={isCorrect && option.length > 0}
                                onChange={() => toggleCorrect(option)}
                                className="w-5 h-5 text-indigo-600 dark:bg-gray-800 dark:border-gray-600"
                            />
                            <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(index, e.target.value)}
                                placeholder={`Opção ${index + 1}`}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            />
                            {question.options.length > 2 && (
                                <button onClick={() => removeOption(index)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function TrueFalseEditor({ question, onUpdate }: { question: LocalQuestion; onUpdate: (updates: Partial<LocalQuestion>) => void }) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resposta Correta</label>
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => onUpdate({ correctAnswer: "true" })}
                    className={`p-4 rounded-lg border-2 transition-all font-medium ${question.correctAnswer === "true"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                        : "border-gray-300 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 text-gray-700 dark:text-gray-300"
                        }`}
                >
                    Verdadeiro
                </button>
                <button
                    onClick={() => onUpdate({ correctAnswer: "false" })}
                    className={`p-4 rounded-lg border-2 transition-all font-medium ${question.correctAnswer === "false"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                        : "border-gray-300 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 text-gray-700 dark:text-gray-300"
                        }`}
                >
                    Falso
                </button>
            </div>
        </div>
    );
}
