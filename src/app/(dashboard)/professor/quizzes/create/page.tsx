"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useRouter } from "next/navigation";
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
    Database,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
    QuestionType,
    getQuestionTypeLabel,
    requiresManualGrading,
} from "@/components/quiz/QuestionRenderer";
import { QuestionBankBrowser } from "@/components/quiz/QuestionBankBrowser";


// Tipos locais
interface LocalQuestion {
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
}

export default function CreateQuizPage() {
    const router = useRouter();
    const { user } = useUser();
    const currentUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");

    // Buscar todos os cursos da organização (api.courses.getAll já filtra por organização)
    const courses = useQuery(
        api.courses.getAll,
        currentUser ? {} : "skip"
    );

    // Buscar questões do banco de questões
    const questionBank = useQuery(
        api.questionBank.search,
        currentUser?.organizationId
            ? { organizationId: currentUser.organizationId }
            : "skip"
    );

    const createQuiz = useMutation(api.quizzes.create);
    const publishQuiz = useMutation(api.quizzes.publish);
    const createQuestion = useMutation(api.quizzes.addQuestion);

    // Estado do Quiz

    const [quizData, setQuizData] = useState({
        title: "",
        description: "",
        courseId: "",
        lessonId: "",
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
        isPublished: false,
        // Novos campos
        randomizeQuestions: false,
        randomizeOptions: false,
        revealMode: "never" as "never" | "after_attempt" | "after_deadline",
        allowStudentFeedback: false,
        weight: 1,
    });

    // Estado das Questões
    const [questions, setQuestions] = useState<LocalQuestion[]>([]);
    const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showQuestionBank, setShowQuestionBank] = useState(false);


    // Criar nova questão
    const addQuestion = (type: QuestionType) => {
        const newQuestion: LocalQuestion = {
            id: `temp-${Date.now()}`,
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
        };
        setQuestions([...questions, newQuestion]);
        setSelectedQuestionIndex(questions.length);
    };

    // Atualizar questão
    const updateQuestion = (index: number, updates: Partial<LocalQuestion>) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], ...updates };
        setQuestions(newQuestions);
    };

    // Remover questão
    const removeQuestion = (index: number) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
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

    // Importar questões do banco
    const importFromBank = (bankQuestions: any[]) => {
        const importedQuestions: LocalQuestion[] = bankQuestions.map((bq, idx) => ({
            id: `imported-${Date.now()}-${idx}`,
            type: bq.type as QuestionType,
            question: bq.question,
            options: bq.options || [],
            correctAnswer: bq.correctAnswer || "",
            correctAnswers: bq.correctAnswers || [],
            matchPairs: bq.matchPairs || [],
            correctOrder: bq.correctOrder || [],
            blankAnswers: bq.blankAnswers || [],
            mediaUrl: bq.mediaUrl || "",
            mediaType: bq.mediaType || "video",
            points: bq.defaultPoints || 10,
            explanation: bq.explanation || "",
        }));

        setQuestions([...questions, ...importedQuestions]);
        setShowQuestionBank(false);
        toast.success(`${importedQuestions.length} questão(ões) importada(s)!`);
    };


    // Salvar Quiz
    const handleSave = async () => {
        if (!currentUser?.organizationId) {
            toast.error("Organização não encontrada");
            return;
        }

        if (!quizData.title.trim()) {
            toast.error("Digite o título da prova");
            return;
        }

        if (!quizData.courseId) {
            toast.error("Selecione um curso");
            return;
        }

        if (questions.length === 0) {
            toast.error("Adicione pelo menos uma questão");
            return;
        }

        // Validar questões
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question.trim()) {
                toast.error(`Questão ${i + 1}: Digite o texto da pergunta`);
                return;
            }
        }

        setIsSaving(true);
        try {
            // Criar o quiz
            const quizId = await createQuiz({
                title: quizData.title,
                description: quizData.description,
                courseId: quizData.courseId as any,
                lessonId: quizData.lessonId ? (quizData.lessonId as any) : undefined,
                timeLimit: quizData.duration,
                passingScore: quizData.passingScore,
                maxAttempts: quizData.maxAttempts,
            });

            if (quizData.isPublished) {
                await publishQuiz({ quizId });
            }

            // Criar as questões
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                await createQuestion({
                    quizId,
                    type: q.type,
                    question: q.question,
                    options: q.options.length > 0 ? q.options.filter((o) => o.trim()) : undefined,
                    correctAnswer: q.correctAnswer || undefined,
                    correctAnswers: q.correctAnswers && q.correctAnswers.length > 0 ? q.correctAnswers : undefined,
                    matchPairs: q.matchPairs && q.matchPairs.length > 0 ? q.matchPairs.filter(p => p.prompt.trim() && p.answer.trim()) : undefined,
                    correctOrder: q.correctOrder && q.correctOrder.length > 0 ? q.correctOrder.filter(o => o.trim()) : undefined,
                    blankAnswers: q.blankAnswers && q.blankAnswers.length > 0 ? q.blankAnswers : undefined,
                    mediaUrl: q.mediaUrl || undefined,
                    mediaType: q.mediaType || undefined,
                    explanation: q.explanation || undefined,
                    points: q.points,
                });
            }


            toast.success("Prova criada com sucesso!");
            router.push("/professor/quizzes");
        } catch (error) {
            toast.error("Erro ao criar prova");
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
            <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/professor/quizzes"
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 dark:text-gray-300" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Criar Nova Prova</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {questions.length} questões •{" "}
                                    {questions.reduce((acc, q) => acc + q.points, 0)} pontos
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                            >
                                <Settings2 className="w-4 h-4" />
                                Configurações
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? "Salvando..." : "Salvar Prova"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="grid grid-cols-12 gap-6">
                    {/* Sidebar - Lista de Questões */}
                    <div className="col-span-3">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sticky top-24">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Questões</h3>

                            {/* Lista de questões */}
                            <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
                                {questions.map((q, index) => (
                                    <div
                                        key={q.id}
                                        onClick={() => setSelectedQuestionIndex(index)}
                                        className={`
                      flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors
                      ${selectedQuestionIndex === index ? "bg-indigo-100 dark:bg-indigo-900/40 border-indigo-500" : "hover:bg-gray-50 dark:hover:bg-gray-700"}
                      border dark:border-gray-700
                    `}
                                    >
                                        <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{index + 1}.</span>
                                        <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">
                                            {q.question || `Nova ${getQuestionTypeLabel(q.type)}`}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{q.points}pts</span>
                                    </div>
                                ))}
                            </div>

                            {/* Adicionar Questão */}
                            <div className="border-t dark:border-gray-700 pt-4">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adicionar Questão</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {questionTypes.map(({ type, icon }) => (
                                        <button
                                            key={type}
                                            onClick={() => addQuestion(type)}
                                            title={getQuestionTypeLabel(type)}
                                            className="p-2 text-center bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-lg transition-colors text-lg"
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                                {/* Importar do Banco de Questões */}
                                <button
                                    onClick={() => setShowQuestionBank(true)}
                                    className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium"
                                >
                                    <Database className="w-4 h-4" />
                                    Importar do Banco
                                </button>
                            </div>
                        </div>
                    </div>


                    {/* Main - Editor */}
                    <div className="col-span-9 space-y-6">
                        {/* Informações do Quiz */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                Informações da Prova
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
                                    <input
                                        type="text"
                                        value={quizData.title}
                                        onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                                        placeholder="Ex: Avaliação do Módulo 1"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Descrição (opcional)
                                    </label>
                                    <textarea
                                        value={quizData.description}
                                        onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                                        rows={2}
                                        placeholder="Descreva o conteúdo da prova..."
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Curso *</label>
                                    <select
                                        value={quizData.courseId}
                                        onChange={(e) => setQuizData({ ...quizData, courseId: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="">Selecione um curso</option>
                                        {courses?.map((course) => (
                                            <option key={course._id} value={course._id}>
                                                {course.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Duração (min)
                                        </label>
                                        <input
                                            type="number"
                                            min="5"
                                            value={quizData.duration}
                                            onChange={(e) =>
                                                setQuizData({ ...quizData, duration: Number(e.target.value) })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Aprovação (%)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={quizData.passingScore}
                                            onChange={(e) =>
                                                setQuizData({ ...quizData, passingScore: Number(e.target.value) })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Tentativas
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={quizData.maxAttempts}
                                            onChange={(e) =>
                                                setQuizData({ ...quizData, maxAttempts: Number(e.target.value) })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Configurações Avançadas */}
                            {showAdvancedSettings && (
                                <div className="mt-6 pt-6 border-t">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Configurações Avançadas</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={quizData.randomizeQuestions}
                                                onChange={(e) =>
                                                    setQuizData({ ...quizData, randomizeQuestions: e.target.checked })
                                                }
                                                className="w-4 h-4 text-indigo-600 rounded"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Embaralhar Questões</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Ordem aleatória para cada aluno</p>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={quizData.randomizeOptions}
                                                onChange={(e) =>
                                                    setQuizData({ ...quizData, randomizeOptions: e.target.checked })
                                                }
                                                className="w-4 h-4 text-indigo-600 rounded"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Embaralhar Opções</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Alternativas em ordem aleatória</p>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={quizData.randomizeOptions}
                                                onChange={(e) =>
                                                    setQuizData({ ...quizData, randomizeOptions: e.target.checked })
                                                }
                                                className="w-4 h-4 text-indigo-600 rounded"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Embaralhar Opções</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Alternativas em ordem aleatória</p>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={quizData.allowStudentFeedback}
                                                onChange={(e) =>
                                                    setQuizData({ ...quizData, allowStudentFeedback: e.target.checked })
                                                }
                                                className="w-4 h-4 text-indigo-600 rounded"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Feedback de Alunos</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Permitir avaliação da prova</p>
                                            </div>
                                        </label>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Peso da Nota
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                value={quizData.weight}
                                                onChange={(e) =>
                                                    setQuizData({ ...quizData, weight: Number(e.target.value) })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Editor de Questão Selecionada */}
                        {selectedQuestionIndex !== null && questions[selectedQuestionIndex] && (
                            <QuestionEditor
                                question={questions[selectedQuestionIndex]}
                                index={selectedQuestionIndex}
                                totalQuestions={questions.length}
                                onUpdate={(updates) => updateQuestion(selectedQuestionIndex, updates)}
                                onRemove={() => removeQuestion(selectedQuestionIndex)}
                                onMove={(direction) => moveQuestion(selectedQuestionIndex, direction)}
                            />
                        )}

                        {/* Empty State */}
                        {questions.length === 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
                                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Plus className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma questão ainda</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Clique nos ícones da barra lateral para adicionar questões
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal do Banco de Questões */}
            {showQuestionBank && (
                <QuestionBankModal
                    questions={questionBank || []}
                    onImport={importFromBank}
                    onClose={() => setShowQuestionBank(false)}
                />
            )}
        </div>
    );
}

// Modal para selecionar questões do banco
function QuestionBankModal({
    questions,
    onImport,
    onClose,
}: {
    questions: any[];
    onImport: (selected: any[]) => void;
    onClose: () => void;
}) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [search, setSearch] = useState("");

    const filteredQuestions = questions.filter(q =>
        q.question.toLowerCase().includes(search.toLowerCase())
    );

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleImport = () => {
        const selected = questions.filter(q => selectedIds.includes(q._id));
        onImport(selected);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Banco de Questões</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Selecione as questões para importar para a prova
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        ✕
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b dark:border-gray-700">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar questões..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Questions List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {filteredQuestions.length === 0 ? (
                        <div className="text-center py-12">
                            <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">Nenhuma questão encontrada</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredQuestions.map((q) => {
                                const isSelected = selectedIds.includes(q._id);

                                return (
                                    <div
                                        key={q._id}
                                        onClick={() => toggleSelect(q._id)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                                            : "border-gray-200 dark:border-gray-700 hover:border-indigo-200"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 mt-1 ${isSelected
                                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                                    : "border-gray-300 dark:border-gray-600"
                                                    }`}
                                            >
                                                {isSelected && <span>✓</span>}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-gray-900 dark:text-white font-medium mb-2">{q.question}</p>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                                                        {getQuestionTypeLabel(q.type as QuestionType)}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {q.defaultPoints} pts
                                                    </span>
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
                <div className="p-4 border-t dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedIds.length} questão(ões) selecionada(s)
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
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


// Componente para editar questão
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
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
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onMove("up")}
                        disabled={index === 0}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                    >
                        <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onMove("down")}
                        disabled={index === totalQuestions - 1}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
            </div>

            {/* Campos específicos por tipo */}
            {(question.type === "single_choice" || question.type === "multiple_choice") && (
                <OptionsEditor question={question} onUpdate={onUpdate} />
            )}

            {question.type === "true_false" && (
                <TrueFalseEditor question={question} onUpdate={onUpdate} />
            )}

            {question.type === "match_following" && (
                <MatchPairsEditor question={question} onUpdate={onUpdate} />
            )}

            {question.type === "sortable" && (
                <SortableItemsEditor question={question} onUpdate={onUpdate} />
            )}

            {question.type === "fill_blanks" && (
                <FillBlanksEditor question={question} onUpdate={onUpdate} />
            )}

            {/* Pontuação e Explicação */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t dark:border-gray-700">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pontos</label>
                    <input
                        type="number"
                        min="1"
                        value={question.points}
                        onChange={(e) => onUpdate({ points: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Explicação (opcional)
                    </label>
                    <input
                        type="text"
                        value={question.explanation}
                        onChange={(e) => onUpdate({ explanation: e.target.value })}
                        placeholder="Explique a resposta correta..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                </div>
            </div>
        </div>
    );
}

// Editor de opções (single/multiple choice)
function OptionsEditor({
    question,
    onUpdate,
}: {
    question: LocalQuestion;
    onUpdate: (updates: Partial<LocalQuestion>) => void;
}) {
    const isMultiple = question.type === "multiple_choice";

    const addOption = () => {
        onUpdate({ options: [...question.options, ""] });
    };

    const removeOption = (index: number) => {
        const removedOption = question.options[index];
        const newOptions = question.options.filter((_, i) => i !== index);

        // Se a opção removida era a correta, limpar o correctAnswer
        if (!isMultiple && question.correctAnswer === removedOption) {
            onUpdate({ options: newOptions, correctAnswer: "" });
        } else if (isMultiple) {
            // Remover da lista de respostas corretas se estava lá
            const newCorrectAnswers = (question.correctAnswers || []).filter(a => a !== removedOption);
            onUpdate({ options: newOptions, correctAnswers: newCorrectAnswers });
        } else {
            onUpdate({ options: newOptions });
        }
    };

    const updateOption = (index: number, value: string) => {
        const oldValue = question.options[index];
        const newOptions = [...question.options];
        newOptions[index] = value;

        // IMPORTANTE: Se a opção editada era a resposta correta, atualizar o correctAnswer também!
        if (!isMultiple && question.correctAnswer === oldValue) {
            onUpdate({ options: newOptions, correctAnswer: value });
        } else if (isMultiple && question.correctAnswers?.includes(oldValue)) {
            // Para múltipla escolha, atualizar a opção na lista de corretas
            const newCorrectAnswers = question.correctAnswers.map(a => a === oldValue ? value : a);
            onUpdate({ options: newOptions, correctAnswers: newCorrectAnswers });
        } else {
            onUpdate({ options: newOptions });
        }
    };

    const toggleCorrect = (option: string) => {
        // Não permitir selecionar opção vazia como correta
        if (!option.trim()) {
            return;
        }

        if (isMultiple) {
            const current = question.correctAnswers || [];
            if (current.includes(option)) {
                onUpdate({ correctAnswers: current.filter((a) => a !== option) });
            } else {
                onUpdate({ correctAnswers: [...current, option] });
            }
        } else {
            onUpdate({ correctAnswer: option });
        }
    };

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Opções</label>
                <button
                    onClick={addOption}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar
                </button>
            </div>
            <div className="space-y-2">
                {question.options.map((option, index) => {
                    const isCorrect = isMultiple
                        ? question.correctAnswers?.includes(option)
                        : question.correctAnswer === option;

                    return (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type={isMultiple ? "checkbox" : "radio"}
                                checked={isCorrect && option.length > 0}
                                onChange={() => toggleCorrect(option)}
                                className="w-5 h-5 text-indigo-600"
                            />
                            <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(index, e.target.value)}
                                placeholder={`Opção ${index + 1}`}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            />
                            {question.options.length > 2 && (
                                <button
                                    onClick={() => removeOption(index)}
                                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {isMultiple ? "Marque todas as opções corretas" : "Selecione a opção correta"}
            </p>
        </div>
    );
}

// Editor de Verdadeiro/Falso
function TrueFalseEditor({
    question,
    onUpdate,
}: {
    question: LocalQuestion;
    onUpdate: (updates: Partial<LocalQuestion>) => void;
}) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resposta Correta</label>
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => onUpdate({ correctAnswer: "true" })}
                    className={`p-4 rounded-lg border-2 transition-all ${question.correctAnswer === "true"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                        : "border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 text-gray-700 dark:text-gray-300"
                        }`}
                >
                    Verdadeiro
                </button>
                <button
                    onClick={() => onUpdate({ correctAnswer: "false" })}
                    className={`p-4 rounded-lg border-2 transition-all ${question.correctAnswer === "false"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                        : "border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 text-gray-700 dark:text-gray-300"
                        }`}
                >
                    Falso
                </button>
            </div>
        </div>
    );
}

// Editor de Match Following
function MatchPairsEditor({
    question,
    onUpdate,
}: {
    question: LocalQuestion;
    onUpdate: (updates: Partial<LocalQuestion>) => void;
}) {
    const addPair = () => {
        onUpdate({ matchPairs: [...question.matchPairs, { prompt: "", answer: "" }] });
    };

    const removePair = (index: number) => {
        const newPairs = question.matchPairs.filter((_, i) => i !== index);
        onUpdate({ matchPairs: newPairs });
    };

    const updatePair = (index: number, field: "prompt" | "answer", value: string) => {
        const newPairs = [...question.matchPairs];
        newPairs[index] = { ...newPairs[index], [field]: value };
        onUpdate({ matchPairs: newPairs });
    };

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pares de Correspondência</label>
                <button
                    onClick={addPair}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar Par
                </button>
            </div>
            <div className="space-y-2">
                {question.matchPairs.map((pair, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={pair.prompt}
                            onChange={(e) => updatePair(index, "prompt", e.target.value)}
                            placeholder="Item"
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        <span className="text-gray-400 dark:text-gray-500">→</span>
                        <input
                            type="text"
                            value={pair.answer}
                            onChange={(e) => updatePair(index, "answer", e.target.value)}
                            placeholder="Correspondência"
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        {question.matchPairs.length > 1 && (
                            <button
                                onClick={() => removePair(index)}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Editor de Sortable
function SortableItemsEditor({
    question,
    onUpdate,
}: {
    question: LocalQuestion;
    onUpdate: (updates: Partial<LocalQuestion>) => void;
}) {
    const addItem = () => {
        onUpdate({ correctOrder: [...question.correctOrder, ""] });
    };

    const removeItem = (index: number) => {
        const newOrder = question.correctOrder.filter((_, i) => i !== index);
        onUpdate({ correctOrder: newOrder });
    };

    const updateItem = (index: number, value: string) => {
        const newOrder = [...question.correctOrder];
        newOrder[index] = value;
        onUpdate({ correctOrder: newOrder });
    };

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Itens (na ordem correta)
                </label>
                <button
                    onClick={addItem}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar
                </button>
            </div>
            <div className="space-y-2">
                {question.correctOrder.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                        </span>
                        <input
                            type="text"
                            value={item}
                            onChange={(e) => updateItem(index, e.target.value)}
                            placeholder={`Item ${index + 1}`}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        {question.correctOrder.length > 1 && (
                            <button
                                onClick={() => removeItem(index)}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Os alunos verão os itens em ordem aleatória</p>
        </div>
    );
}

// Editor de Fill Blanks
function FillBlanksEditor({
    question,
    onUpdate,
}: {
    question: LocalQuestion;
    onUpdate: (updates: Partial<LocalQuestion>) => void;
}) {
    const addBlank = () => {
        onUpdate({ blankAnswers: [...question.blankAnswers, ""] });
    };

    const removeBlank = (index: number) => {
        const newBlanks = question.blankAnswers.filter((_, i) => i !== index);
        onUpdate({ blankAnswers: newBlanks });
    };

    const updateBlank = (index: number, value: string) => {
        const newBlanks = [...question.blankAnswers];
        newBlanks[index] = value;
        onUpdate({ blankAnswers: newBlanks });
    };

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Respostas das Lacunas</label>
                <button
                    onClick={addBlank}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar
                </button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Use _____ (5 underscores) no texto da pergunta para marcar as lacunas
            </p>
            <div className="space-y-2">
                {question.blankAnswers.map((blank, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Lacuna {index + 1}:</span>
                        <input
                            type="text"
                            value={blank}
                            onChange={(e) => updateBlank(index, e.target.value)}
                            placeholder="Resposta correta"
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        {question.blankAnswers.length > 1 && (
                            <button
                                onClick={() => removeBlank(index)}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
