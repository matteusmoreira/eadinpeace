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

interface Question {
    id: string;
    text: string;
    options: { id: string; text: string; isCorrect: boolean }[];
    explanation: string;
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
    const [questionForm, setQuestionForm] = useState({
        text: "",
        options: [
            { id: "a", text: "", isCorrect: true },
            { id: "b", text: "", isCorrect: false },
            { id: "c", text: "", isCorrect: false },
            { id: "d", text: "", isCorrect: false },
        ],
        explanation: "",
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
        setQuestionForm({
            text: "",
            options: [
                { id: "a", text: "", isCorrect: true },
                { id: "b", text: "", isCorrect: false },
                { id: "c", text: "", isCorrect: false },
                { id: "d", text: "", isCorrect: false },
            ],
            explanation: "",
        });
        setQuestionDialogOpen(true);
    };

    const openEditQuestion = (question: Question) => {
        setEditingQuestion(question);
        setQuestionForm({
            text: question.text,
            options: question.options,
            explanation: question.explanation,
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
                            text: questionForm.text,
                            options: questionForm.options,
                            explanation: questionForm.explanation,
                        }
                        : q
                )
            );
        } else {
            const newQuestion: Question = {
                id: `q${Date.now()}`,
                text: questionForm.text,
                options: questionForm.options,
                explanation: questionForm.explanation,
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
        setIsSaving(true);
        // TODO: Call Convex mutation
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSaving(false);
        setIsCreating(false);
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
                                {editingQuiz ? "Editar Quiz" : "Novo Quiz"}
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
                                Salvar Quiz
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
                                    <Label>Título do Quiz</Label>
                                    <Input
                                        placeholder="Ex: Fundamentos de JavaScript"
                                        value={quizForm.title}
                                        onChange={(e) =>
                                            setQuizForm((prev) => ({ ...prev, title: e.target.value }))
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Curso</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o curso" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">JavaScript do Zero</SelectItem>
                                            <SelectItem value="2">React Avançado</SelectItem>
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
                                        Adicione as perguntas do quiz
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
                                            Adicione a primeira questão do quiz
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
                                                        <span className="font-medium line-clamp-1">
                                                            {question.text}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {question.options.length} opções •{" "}
                                                        Correta: {question.options.find((o) => o.isCorrect)?.text?.substring(0, 20)}...
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
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingQuestion ? "Editar Questão" : "Nova Questão"}
                            </DialogTitle>
                            <DialogDescription>
                                Preencha a pergunta e as opções de resposta
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-2">
                                <Label>Pergunta</Label>
                                <Textarea
                                    placeholder="Digite a pergunta..."
                                    value={questionForm.text}
                                    onChange={(e) =>
                                        setQuestionForm((prev) => ({ ...prev, text: e.target.value }))
                                    }
                                />
                            </div>

                            <div className="space-y-3">
                                <Label>Opções de Resposta</Label>
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
                                            onClick={() => setCorrectOption(option.id)}
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
                                    </div>
                                ))}
                                <p className="text-xs text-muted-foreground">
                                    Clique no botão para marcar a resposta correta
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Explicação (opcional)</Label>
                                <Textarea
                                    placeholder="Explique por que essa é a resposta correta..."
                                    value={questionForm.explanation}
                                    onChange={(e) =>
                                        setQuestionForm((prev) => ({ ...prev, explanation: e.target.value }))
                                    }
                                />
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
                    <h1 className="text-2xl md:text-3xl font-bold">Avaliações</h1>
                    <p className="text-muted-foreground">
                        Crie e gerencie quizzes para seus cursos
                    </p>
                </div>
                <Button className="gap-2 gradient-bg border-0" onClick={openNewQuiz}>
                    <Plus className="h-4 w-4" />
                    Criar Quiz
                </Button>
            </motion.div>

            {/* Search */}
            <motion.div variants={item}>
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar quizzes..."
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
                    <h3 className="text-lg font-medium">Nenhum quiz encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                        Crie seu primeiro quiz para testar seus alunos
                    </p>
                    <Button className="gap-2" onClick={openNewQuiz}>
                        <Plus className="h-4 w-4" />
                        Criar Quiz
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
}
