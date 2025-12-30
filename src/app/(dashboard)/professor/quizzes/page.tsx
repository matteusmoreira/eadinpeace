"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    Copy,
    Users,
    Clock,
    BookOpen,
    Target,
    GripVertical,
    CheckCircle2,
    HelpCircle,
    ArrowLeft,
    Save,
    Loader2,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import {
    QuestionType,
    getQuestionTypeLabel,
} from "@/components/quiz/QuestionRenderer";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

// Tipos de questão disponíveis
const questionTypes: { type: QuestionType; icon: string; label: string }[] = [
    { type: "true_false", icon: "✓✗", label: "Verdadeiro/Falso" },
    { type: "single_choice", icon: "○", label: "Múltipla Escolha" },
    { type: "multiple_choice", icon: "☑", label: "Múltiplas Respostas" },
    { type: "short_answer", icon: "Aa", label: "Resposta Curta" },
    { type: "text_answer", icon: "📝", label: "Dissertativa" },
    { type: "match_following", icon: "↔", label: "Associar" },
    { type: "sortable", icon: "⇅", label: "Ordenar" },
    { type: "fill_blanks", icon: "___", label: "Preencher Lacunas" },
    { type: "audio_video", icon: "▶", label: "Áudio/Vídeo" },
];

interface Question {
    id: string;
    type: QuestionType;
    text: string;
    options: { id: string; text: string; isCorrect: boolean }[];
    correctAnswer?: string;
    correctAnswers?: string[];
    matchPairs?: { prompt: string; answer: string }[];
    correctOrder?: string[];
    blankAnswers?: string[];
    mediaUrl?: string;
    mediaType?: "audio" | "video";
    explanation: string;
    points: number;
}

export default function ProfessorQuizzesPage() {
    const { user } = useUser();
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState<any>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Get current user
    const currentUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get quizzes for this instructor
    const quizzes = useQuery(api.quizzes.getByInstructor,
        currentUser?._id
            ? { instructorId: currentUser._id }
            : "skip"
    );

    // Get instructor's courses for the quiz creation dropdown
    const courses = useQuery(api.courses.getByInstructor,
        currentUser?._id
            ? { instructorId: currentUser._id }
            : "skip"
    );

    // Mutations
    const createQuiz = useMutation(api.quizzes.create);
    const updateQuiz = useMutation(api.quizzes.update);
    const addQuestionMutation = useMutation(api.quizzes.addQuestion);
    const removeQuiz = useMutation(api.quizzes.remove);

    const isLoading = quizzes === undefined;

    // New quiz form
    const [quizForm, setQuizForm] = useState({
        title: "",
        courseId: "",
        lessonId: "",
        timeLimit: "10",
        passingScore: "70",
    });

    // Question form
    const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType>("single_choice");
    const [questionForm, setQuestionForm] = useState({
        text: "",
        type: "single_choice" as QuestionType,
        options: [
            { id: "a", text: "", isCorrect: true },
            { id: "b", text: "", isCorrect: false },
            { id: "c", text: "", isCorrect: false },
            { id: "d", text: "", isCorrect: false },
        ],
        correctAnswer: "true",
        correctAnswers: [] as string[],
        matchPairs: [{ prompt: "", answer: "" }],
        correctOrder: [""],
        blankAnswers: [""],
        mediaUrl: "",
        mediaType: "video" as "audio" | "video",
        explanation: "",
        points: 10,
    });

    const filteredQuizzes = (quizzes || []).filter((quiz) =>
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openNewQuiz = () => {
        setIsCreating(true);
        setEditingQuiz(null);
        setQuestions([]);
        setQuizForm({
            title: "",
            courseId: "",
            lessonId: "",
            timeLimit: "10",
            passingScore: "70",
        });
    };

    const openEditQuiz = (quiz: any) => {
        setIsCreating(true);
        setEditingQuiz(quiz);
        setQuizForm({
            title: quiz.title,
            courseId: quiz.courseId || "",
            lessonId: quiz.lessonId || "",
            timeLimit: String(quiz.timeLimit || 10),
            passingScore: String(quiz.passingScore),
        });
        // Transform questions from API format to local format
        if (quiz.questions && Array.isArray(quiz.questions)) {
            const formattedQuestions = quiz.questions.map((q: any) => ({
                id: q._id || q.id,
                text: q.question || q.text,
                options: q.options?.map((opt: string, idx: number) => ({
                    id: String.fromCharCode(97 + idx), // a, b, c, d...
                    text: opt,
                    isCorrect: q.correctAnswer === opt,
                })) || [],
                explanation: q.explanation || "",
            }));
            setQuestions(formattedQuestions);
        } else {
            setQuestions([]);
        }
    };

    const openAddQuestion = () => {
        setEditingQuestion(null);
        setSelectedQuestionType("single_choice");
        setQuestionForm({
            text: "",
            type: "single_choice",
            options: [
                { id: "a", text: "", isCorrect: true },
                { id: "b", text: "", isCorrect: false },
                { id: "c", text: "", isCorrect: false },
                { id: "d", text: "", isCorrect: false },
            ],
            correctAnswer: "true",
            correctAnswers: [],
            matchPairs: [{ prompt: "", answer: "" }],
            correctOrder: [""],
            blankAnswers: [""],
            mediaUrl: "",
            mediaType: "video",
            explanation: "",
            points: 10,
        });
        setQuestionDialogOpen(true);
    };

    const openEditQuestion = (question: Question) => {
        setEditingQuestion(question);
        setSelectedQuestionType(question.type);
        setQuestionForm({
            text: question.text,
            type: question.type,
            options: question.options || [],
            correctAnswer: question.correctAnswer || "true",
            correctAnswers: question.correctAnswers || [],
            matchPairs: question.matchPairs || [{ prompt: "", answer: "" }],
            correctOrder: question.correctOrder || [""],
            blankAnswers: question.blankAnswers || [""],
            mediaUrl: question.mediaUrl || "",
            mediaType: question.mediaType || "video",
            explanation: question.explanation,
            points: question.points || 10,
        });
        setQuestionDialogOpen(true);
    };

    const saveQuestion = () => {
        if (editingQuestion) {
            setQuestions((prev) =>
                prev.map((q) =>
                    q.id === editingQuestion.id
                        ? {
                            ...q,
                            type: selectedQuestionType,
                            text: questionForm.text,
                            options: questionForm.options,
                            correctAnswer: questionForm.correctAnswer,
                            correctAnswers: questionForm.correctAnswers,
                            matchPairs: questionForm.matchPairs,
                            correctOrder: questionForm.correctOrder,
                            blankAnswers: questionForm.blankAnswers,
                            mediaUrl: questionForm.mediaUrl,
                            mediaType: questionForm.mediaType,
                            explanation: questionForm.explanation,
                            points: questionForm.points,
                        }
                        : q
                )
            );
        } else {
            const newQuestion: Question = {
                id: `q${Date.now()}`,
                type: selectedQuestionType,
                text: questionForm.text,
                options: questionForm.options,
                correctAnswer: questionForm.correctAnswer,
                correctAnswers: questionForm.correctAnswers,
                matchPairs: questionForm.matchPairs,
                correctOrder: questionForm.correctOrder,
                blankAnswers: questionForm.blankAnswers,
                mediaUrl: questionForm.mediaUrl,
                mediaType: questionForm.mediaType,
                explanation: questionForm.explanation,
                points: questionForm.points,
            };
            setQuestions((prev) => [...prev, newQuestion]);
        }
        setQuestionDialogOpen(false);
    };

    const deleteQuestion = (questionId: string) => {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    };

    const setCorrectOption = (optionId: string) => {
        setQuestionForm((prev) => ({
            ...prev,
            options: prev.options.map((opt) => ({
                ...opt,
                isCorrect: opt.id === optionId,
            })),
        }));
    };

    const handleSaveQuiz = async () => {
        if (!quizForm.title || !quizForm.courseId) {
            toast.error("Preencha o título e selecione um curso");
            return;
        }
        if (questions.length === 0) {
            toast.error("Adicione pelo menos uma questão");
            return;
        }

        setIsSaving(true);
        try {
            let quizId: Id<"quizzes">;

            if (editingQuiz) {
                // Update existing quiz
                await updateQuiz({
                    quizId: editingQuiz._id,
                    title: quizForm.title,
                    passingScore: parseInt(quizForm.passingScore),
                    timeLimit: parseInt(quizForm.timeLimit) * 60, // Convert to seconds
                });
                quizId = editingQuiz._id;
                toast.success("Prova atualizada com sucesso!");
            } else {
                // Create new quiz
                quizId = await createQuiz({
                    courseId: quizForm.courseId as Id<"courses">,
                    lessonId: quizForm.lessonId ? quizForm.lessonId as Id<"lessons"> : undefined,
                    title: quizForm.title,
                    passingScore: parseInt(quizForm.passingScore),
                    timeLimit: parseInt(quizForm.timeLimit) * 60, // Convert to seconds
                });

                // Add all questions to the quiz
                for (const question of questions) {
                    await addQuestionMutation({
                        quizId,
                        type: question.type,
                        question: question.text,
                        options: question.options?.map(o => o.text).filter(t => t.length > 0),
                        correctAnswer: question.type === "true_false"
                            ? question.correctAnswer
                            : question.options?.find(o => o.isCorrect)?.text,
                        correctAnswers: question.type === "multiple_choice"
                            ? question.options?.filter(o => o.isCorrect).map(o => o.text)
                            : undefined,
                        matchPairs: question.matchPairs?.filter(p => p.prompt && p.answer),
                        correctOrder: question.correctOrder?.filter(o => o.length > 0),
                        blankAnswers: question.blankAnswers?.filter(b => b.length > 0),
                        mediaUrl: question.mediaUrl || undefined,
                        mediaType: question.mediaType || undefined,
                        explanation: question.explanation || undefined,
                        points: question.points,
                    });
                }
                toast.success("Prova criada com sucesso!");
            }

            setIsCreating(false);
            setEditingQuiz(null);
            setQuestions([]);
        } catch (error) {
            console.error("Erro ao salvar prova:", error);
            toast.error("Erro ao salvar prova");
        } finally {
            setIsSaving(false);
        }
    };

    // Quiz Editor View
    if (isCreating) {
        return (
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-6"
            >
                {/* Header */}
                <motion.div variants={item} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setIsCreating(false)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">
                                {editingQuiz ? "Editar Prova" : "Nova Prova"}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {questions.length} questões adicionadas
                            </p>
                        </div>
                    </div>
                    <Button
                        className="gap-2 gradient-bg border-0"
                        onClick={handleSaveQuiz}
                        disabled={isSaving || !quizForm.title || questions.length === 0}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Salvar Prova
                            </>
                        )}
                    </Button>
                </motion.div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Quiz Config */}
                    <motion.div variants={item}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Configurações</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Título da Prova</Label>
                                    <Input
                                        placeholder="Ex: Fundamentos de JavaScript"
                                        value={quizForm.title}
                                        onChange={(e) =>
                                            setQuizForm((prev) => ({ ...prev, title: e.target.value }))
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Curso *</Label>
                                    <Select
                                        value={quizForm.courseId}
                                        onValueChange={(value) => setQuizForm((prev) => ({ ...prev, courseId: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o curso" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(courses || []).length === 0 ? (
                                                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                                                    Nenhum curso encontrado
                                                </div>
                                            ) : (
                                                (courses || []).map((course) => (
                                                    <SelectItem key={course._id} value={course._id}>
                                                        {course.title}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Tempo (min)</Label>
                                        <Input
                                            type="number"
                                            value={quizForm.timeLimit}
                                            onChange={(e) =>
                                                setQuizForm((prev) => ({ ...prev, timeLimit: e.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nota Mínima (%)</Label>
                                        <Input
                                            type="number"
                                            value={quizForm.passingScore}
                                            onChange={(e) =>
                                                setQuizForm((prev) => ({ ...prev, passingScore: e.target.value }))
                                            }
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Questions */}
                    <motion.div variants={item} className="lg:col-span-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">Questões</CardTitle>
                                    <CardDescription>
                                        Adicione as perguntas da prova
                                    </CardDescription>
                                </div>
                                <Button onClick={openAddQuestion} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Adicionar
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {questions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="font-medium mb-2">Nenhuma questão ainda</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Adicione a primeira questão da prova
                                        </p>
                                        <Button onClick={openAddQuestion} variant="outline" className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Adicionar Questão
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {questions.map((question, index) => (
                                            <div
                                                key={question.id}
                                                className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                                            >
                                                <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5 cursor-grab" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant="outline" className="shrink-0">
                                                            Q{index + 1}
                                                        </Badge>
                                                        <Badge variant="secondary" className="shrink-0 text-xs">
                                                            {questionTypes.find(qt => qt.type === question.type)?.icon || "○"} {getQuestionTypeLabel(question.type)}
                                                        </Badge>
                                                        <span className="font-medium line-clamp-1">
                                                            {question.text}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {question.points} pts
                                                        {question.type === "single_choice" || question.type === "multiple_choice"
                                                            ? ` • ${question.options?.length || 0} opções`
                                                            : question.type === "match_following"
                                                                ? ` • ${question.matchPairs?.length || 0} pares`
                                                                : question.type === "sortable"
                                                                    ? ` • ${question.correctOrder?.length || 0} itens`
                                                                    : question.type === "fill_blanks"
                                                                        ? ` • ${question.blankAnswers?.length || 0} lacunas`
                                                                        : ""}
                                                    </p>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditQuestion(question)}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => deleteQuestion(question.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Question Dialog */}
                <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
                    <DialogContent className="max-w-3xl max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingQuestion ? "Editar Questão" : "Nova Questão"}
                            </DialogTitle>
                            <DialogDescription>
                                Escolha o tipo de questão e preencha os campos
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                            {/* Seletor de Tipo de Questão */}
                            <div className="space-y-2">
                                <Label>Tipo de Questão</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {questionTypes.map(({ type, icon, label }) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => {
                                                setSelectedQuestionType(type);
                                                // Reset options based on type
                                                if (type === "single_choice" || type === "multiple_choice") {
                                                    setQuestionForm(prev => ({
                                                        ...prev,
                                                        type,
                                                        options: prev.options.length < 2
                                                            ? [
                                                                { id: "a", text: "", isCorrect: true },
                                                                { id: "b", text: "", isCorrect: false },
                                                                { id: "c", text: "", isCorrect: false },
                                                                { id: "d", text: "", isCorrect: false },
                                                            ]
                                                            : prev.options
                                                    }));
                                                } else {
                                                    setQuestionForm(prev => ({ ...prev, type }));
                                                }
                                            }}
                                            className={cn(
                                                "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-sm",
                                                selectedQuestionType === type
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border hover:border-primary/50"
                                            )}
                                        >
                                            <span className="text-lg">{icon}</span>
                                            <span className="text-xs font-medium text-center">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Campo de Pergunta */}
                            <div className="space-y-2">
                                <Label>Pergunta *</Label>
                                <Textarea
                                    placeholder="Digite a pergunta..."
                                    value={questionForm.text}
                                    onChange={(e) =>
                                        setQuestionForm((prev) => ({ ...prev, text: e.target.value }))
                                    }
                                    rows={2}
                                />
                            </div>

                            {/* Editor específico por tipo */}
                            {/* Verdadeiro/Falso */}
                            {selectedQuestionType === "true_false" && (
                                <div className="space-y-2">
                                    <Label>Resposta Correta</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setQuestionForm(prev => ({ ...prev, correctAnswer: "true" }))}
                                            className={cn(
                                                "p-4 rounded-lg border-2 transition-all font-medium",
                                                questionForm.correctAnswer === "true"
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                    : "border-border hover:border-emerald-300"
                                            )}
                                        >
                                            ✓ Verdadeiro
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuestionForm(prev => ({ ...prev, correctAnswer: "false" }))}
                                            className={cn(
                                                "p-4 rounded-lg border-2 transition-all font-medium",
                                                questionForm.correctAnswer === "false"
                                                    ? "border-red-500 bg-red-50 text-red-700"
                                                    : "border-border hover:border-red-300"
                                            )}
                                        >
                                            ✗ Falso
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Múltipla Escolha / Múltiplas Respostas */}
                            {(selectedQuestionType === "single_choice" || selectedQuestionType === "multiple_choice") && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Opções de Resposta</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const newId = String.fromCharCode(97 + questionForm.options.length);
                                                setQuestionForm(prev => ({
                                                    ...prev,
                                                    options: [...prev.options, { id: newId, text: "", isCorrect: false }]
                                                }));
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Adicionar
                                        </Button>
                                    </div>
                                    {questionForm.options.map((option, index) => (
                                        <div key={option.id} className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant={option.isCorrect ? "default" : "outline"}
                                                size="icon"
                                                className={cn(
                                                    "shrink-0",
                                                    option.isCorrect && "bg-emerald-500 hover:bg-emerald-600"
                                                )}
                                                onClick={() => {
                                                    if (selectedQuestionType === "multiple_choice") {
                                                        // Toggle para múltiplas respostas
                                                        setQuestionForm(prev => ({
                                                            ...prev,
                                                            options: prev.options.map(o =>
                                                                o.id === option.id ? { ...o, isCorrect: !o.isCorrect } : o
                                                            )
                                                        }));
                                                    } else {
                                                        // Single choice
                                                        setCorrectOption(option.id);
                                                    }
                                                }}
                                            >
                                                {option.isCorrect ? (
                                                    <CheckCircle2 className="h-4 w-4" />
                                                ) : (
                                                    <span className="font-medium">{option.id.toUpperCase()}</span>
                                                )}
                                            </Button>
                                            <Input
                                                placeholder={`Opção ${option.id.toUpperCase()}`}
                                                value={option.text}
                                                onChange={(e) =>
                                                    setQuestionForm((prev) => ({
                                                        ...prev,
                                                        options: prev.options.map((o) =>
                                                            o.id === option.id ? { ...o, text: e.target.value } : o
                                                        ),
                                                    }))
                                                }
                                            />
                                            {questionForm.options.length > 2 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => {
                                                        setQuestionForm(prev => ({
                                                            ...prev,
                                                            options: prev.options.filter(o => o.id !== option.id)
                                                        }));
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <p className="text-xs text-muted-foreground">
                                        {selectedQuestionType === "multiple_choice"
                                            ? "Clique para marcar/desmarcar as respostas corretas (múltiplas permitidas)"
                                            : "Clique no botão para marcar a resposta correta (apenas uma)"}
                                    </p>
                                </div>
                            )}

                            {/* Resposta Curta ou Dissertativa */}
                            {(selectedQuestionType === "short_answer" || selectedQuestionType === "text_answer") && (
                                <div className="space-y-2">
                                    <Label>
                                        {selectedQuestionType === "short_answer" ? "Resposta Esperada (opcional)" : "Orientações para Correção (opcional)"}
                                    </Label>
                                    <Input
                                        placeholder={selectedQuestionType === "short_answer" ? "Ex: 42" : "Critérios de avaliação..."}
                                        value={questionForm.correctAnswer || ""}
                                        onChange={(e) =>
                                            setQuestionForm(prev => ({ ...prev, correctAnswer: e.target.value }))
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {selectedQuestionType === "text_answer"
                                            ? "Questões dissertativas requerem correção manual pelo professor"
                                            : "Deixe em branco para aceitar qualquer resposta"}
                                    </p>
                                </div>
                            )}

                            {/* Associar */}
                            {selectedQuestionType === "match_following" && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Pares de Correspondência</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setQuestionForm(prev => ({
                                                    ...prev,
                                                    matchPairs: [...prev.matchPairs, { prompt: "", answer: "" }]
                                                }));
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Adicionar Par
                                        </Button>
                                    </div>
                                    {questionForm.matchPairs.map((pair, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input
                                                placeholder="Item"
                                                value={pair.prompt}
                                                onChange={(e) => {
                                                    const newPairs = [...questionForm.matchPairs];
                                                    newPairs[index] = { ...newPairs[index], prompt: e.target.value };
                                                    setQuestionForm(prev => ({ ...prev, matchPairs: newPairs }));
                                                }}
                                            />
                                            <span className="text-muted-foreground">→</span>
                                            <Input
                                                placeholder="Correspondência"
                                                value={pair.answer}
                                                onChange={(e) => {
                                                    const newPairs = [...questionForm.matchPairs];
                                                    newPairs[index] = { ...newPairs[index], answer: e.target.value };
                                                    setQuestionForm(prev => ({ ...prev, matchPairs: newPairs }));
                                                }}
                                            />
                                            {questionForm.matchPairs.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => {
                                                        setQuestionForm(prev => ({
                                                            ...prev,
                                                            matchPairs: prev.matchPairs.filter((_, i) => i !== index)
                                                        }));
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Ordenar */}
                            {selectedQuestionType === "sortable" && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Itens para Ordenar (na ordem correta)</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setQuestionForm(prev => ({
                                                    ...prev,
                                                    correctOrder: [...prev.correctOrder, ""]
                                                }));
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Adicionar Item
                                        </Button>
                                    </div>
                                    {questionForm.correctOrder.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
                                            <Input
                                                placeholder={`Item ${index + 1}`}
                                                value={item}
                                                onChange={(e) => {
                                                    const newOrder = [...questionForm.correctOrder];
                                                    newOrder[index] = e.target.value;
                                                    setQuestionForm(prev => ({ ...prev, correctOrder: newOrder }));
                                                }}
                                            />
                                            {questionForm.correctOrder.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => {
                                                        setQuestionForm(prev => ({
                                                            ...prev,
                                                            correctOrder: prev.correctOrder.filter((_, i) => i !== index)
                                                        }));
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <p className="text-xs text-muted-foreground">
                                        Digite os itens na ordem correta. O aluno verá os itens embaralhados.
                                    </p>
                                </div>
                            )}

                            {/* Preencher Lacunas */}
                            {selectedQuestionType === "fill_blanks" && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Respostas das Lacunas</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setQuestionForm(prev => ({
                                                    ...prev,
                                                    blankAnswers: [...prev.blankAnswers, ""]
                                                }));
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Adicionar Lacuna
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Use [BLANK] na pergunta para marcar onde as lacunas devem aparecer
                                    </p>
                                    {questionForm.blankAnswers.map((answer, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-muted-foreground">Lacuna {index + 1}:</span>
                                            <Input
                                                placeholder="Resposta correta"
                                                value={answer}
                                                onChange={(e) => {
                                                    const newAnswers = [...questionForm.blankAnswers];
                                                    newAnswers[index] = e.target.value;
                                                    setQuestionForm(prev => ({ ...prev, blankAnswers: newAnswers }));
                                                }}
                                            />
                                            {questionForm.blankAnswers.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => {
                                                        setQuestionForm(prev => ({
                                                            ...prev,
                                                            blankAnswers: prev.blankAnswers.filter((_, i) => i !== index)
                                                        }));
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Áudio/Vídeo */}
                            {selectedQuestionType === "audio_video" && (
                                <div className="space-y-3">
                                    <Label>Mídia</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setQuestionForm(prev => ({ ...prev, mediaType: "video" }))}
                                            className={cn(
                                                "p-3 rounded-lg border-2 transition-all text-sm font-medium",
                                                questionForm.mediaType === "video"
                                                    ? "border-primary bg-primary/10"
                                                    : "border-border"
                                            )}
                                        >
                                            🎬 Vídeo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuestionForm(prev => ({ ...prev, mediaType: "audio" }))}
                                            className={cn(
                                                "p-3 rounded-lg border-2 transition-all text-sm font-medium",
                                                questionForm.mediaType === "audio"
                                                    ? "border-primary bg-primary/10"
                                                    : "border-border"
                                            )}
                                        >
                                            🎵 Áudio
                                        </button>
                                    </div>
                                    <Input
                                        placeholder="URL do vídeo ou áudio..."
                                        value={questionForm.mediaUrl}
                                        onChange={(e) => setQuestionForm(prev => ({ ...prev, mediaUrl: e.target.value }))}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Cole a URL do YouTube, Vimeo ou arquivo de áudio
                                    </p>
                                </div>
                            )}

                            {/* Pontuação e Explicação */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label>Pontos</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={questionForm.points}
                                        onChange={(e) => setQuestionForm(prev => ({ ...prev, points: Number(e.target.value) }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Explicação (opcional)</Label>
                                    <Input
                                        placeholder="Explique a resposta..."
                                        value={questionForm.explanation}
                                        onChange={(e) =>
                                            setQuestionForm((prev) => ({ ...prev, explanation: e.target.value }))
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={saveQuestion} disabled={!questionForm.text}>
                                {editingQuestion ? "Salvar" : "Adicionar"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </motion.div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Quizzes List View
    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Provas</h1>
                    <p className="text-muted-foreground">
                        Crie e gerencie provas para seus cursos
                    </p>
                </div>
                <Button className="gap-2 gradient-bg border-0" onClick={openNewQuiz}>
                    <Plus className="h-4 w-4" />
                    Criar Prova
                </Button>
            </motion.div>

            {/* Search */}
            <motion.div variants={item}>
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar provas..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </motion.div>

            {/* Quizzes */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredQuizzes.map((quiz) => (
                    <Card key={quiz._id} className="hover:shadow-lg transition-all duration-300">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-base line-clamp-1">{quiz.title}</CardTitle>
                                    <CardDescription className="line-clamp-1">
                                        {quiz.courseName}
                                    </CardDescription>
                                </div>
                                <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                                    {quiz.isPublished ? "Publicado" : "Rascunho"}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <HelpCircle className="h-3.5 w-3.5" />
                                    {quiz.questionCount} questões
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {quiz.timeLimit} min
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" />
                                    {quiz.attemptCount} tentativas
                                </div>
                            </div>

                            {quiz.attemptCount > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Média de pontuação</span>
                                    <span className={cn(
                                        "font-medium",
                                        quiz.avgScore >= quiz.passingScore ? "text-emerald-500" : "text-amber-500"
                                    )}>
                                        {quiz.avgScore}%
                                    </span>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 gap-1"
                                    onClick={() => openEditQuiz(quiz)}
                                >
                                    <Edit className="h-3.5 w-3.5" />
                                    Editar
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <MoreVertical className="h-3.5 w-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <Copy className="h-4 w-4 mr-2" />
                                            Duplicar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </motion.div>

            {/* Empty */}
            {filteredQuizzes.length === 0 && (
                <motion.div variants={item} className="text-center py-12">
                    <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhuma prova encontrada</h3>
                    <p className="text-muted-foreground mb-4">
                        Crie sua primeira prova para testar seus alunos
                    </p>
                    <Button className="gap-2" onClick={openNewQuiz}>
                        <Plus className="h-4 w-4" />
                        Criar Prova
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
}
