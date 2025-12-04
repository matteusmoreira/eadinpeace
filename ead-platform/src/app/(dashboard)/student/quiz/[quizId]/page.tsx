"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
    CheckCircle2,
    XCircle,
    Clock,
    ArrowRight,
    ArrowLeft,
    Trophy,
    RefreshCw,
    Home,
    Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Question {
    id: string;
    text: string;
    options: { id: string; text: string }[];
    correctOptionId: string;
    explanation?: string;
}

interface Quiz {
    id: string;
    title: string;
    description: string;
    courseId: string;
    courseName: string;
    lessonId?: string;
    lessonName?: string;
    passingScore: number; // percentage
    timeLimit?: number; // minutes
    questions: Question[];
}

// Mock quiz data
const mockQuiz: Quiz = {
    id: "quiz1",
    title: "Fundamentos de JavaScript",
    description: "Teste seus conhecimentos sobre os fundamentos do JavaScript",
    courseId: "1",
    courseName: "JavaScript do Zero",
    lessonName: "Variáveis e Tipos de Dados",
    passingScore: 70,
    timeLimit: 10,
    questions: [
        {
            id: "q1",
            text: "Qual keyword é usada para declarar uma variável que não pode ser reatribuída em JavaScript?",
            options: [
                { id: "a", text: "var" },
                { id: "b", text: "let" },
                { id: "c", text: "const" },
                { id: "d", text: "static" },
            ],
            correctOptionId: "c",
            explanation: "const é usada para declarar constantes - valores que não podem ser reatribuídos após a inicialização.",
        },
        {
            id: "q2",
            text: "O que o operador === faz em JavaScript?",
            options: [
                { id: "a", text: "Atribuição de valor" },
                { id: "b", text: "Comparação de valor apenas" },
                { id: "c", text: "Comparação de valor e tipo" },
                { id: "d", text: "Negação" },
            ],
            correctOptionId: "c",
            explanation: "O operador === (igualdade estrita) compara tanto o valor quanto o tipo dos operandos.",
        },
        {
            id: "q3",
            text: "Qual é o resultado de typeof null em JavaScript?",
            options: [
                { id: "a", text: '"null"' },
                { id: "b", text: '"undefined"' },
                { id: "c", text: '"object"' },
                { id: "d", text: '"boolean"' },
            ],
            correctOptionId: "c",
            explanation: "Por razões históricas, typeof null retorna 'object'. Este é um bug conhecido do JavaScript.",
        },
        {
            id: "q4",
            text: "Como você declara uma função arrow em JavaScript?",
            options: [
                { id: "a", text: "function => {}" },
                { id: "b", text: "() => {}" },
                { id: "c", text: "=> function {}" },
                { id: "d", text: "arrow() {}" },
            ],
            correctOptionId: "b",
            explanation: "Arrow functions são declaradas usando a sintaxe () => {}.",
        },
        {
            id: "q5",
            text: "Qual método é usado para adicionar um elemento ao final de um array?",
            options: [
                { id: "a", text: "append()" },
                { id: "b", text: "push()" },
                { id: "c", text: "add()" },
                { id: "d", text: "insert()" },
            ],
            correctOptionId: "b",
            explanation: "O método push() adiciona um ou mais elementos ao final de um array.",
        },
    ],
};

type QuizState = "intro" | "inProgress" | "finished";

interface Answer {
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
}

export default function QuizPage({ params }: { params: { quizId: string } }) {
    const [quiz] = useState<Quiz>(mockQuiz);
    const [state, setState] = useState<QuizState>("intro");
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [timeLeft, setTimeLeft] = useState(quiz.timeLimit ? quiz.timeLimit * 60 : 0);

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

    // Timer
    useEffect(() => {
        if (state !== "inProgress" || !quiz.timeLimit) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    finishQuiz();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [state, quiz.timeLimit]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const startQuiz = () => {
        setState("inProgress");
        setTimeLeft(quiz.timeLimit ? quiz.timeLimit * 60 : 0);
    };

    const submitAnswer = () => {
        if (!selectedOption) return;

        const isCorrect = selectedOption === currentQuestion.correctOptionId;
        const answer: Answer = {
            questionId: currentQuestion.id,
            selectedOptionId: selectedOption,
            isCorrect,
        };

        setAnswers((prev) => [...prev, answer]);
        setShowFeedback(true);
    };

    const nextQuestion = () => {
        if (isLastQuestion) {
            finishQuiz();
        } else {
            setCurrentQuestionIndex((prev) => prev + 1);
            setSelectedOption(null);
            setShowFeedback(false);
        }
    };

    const finishQuiz = () => {
        setState("finished");
    };

    const restartQuiz = () => {
        setState("intro");
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setAnswers([]);
        setShowFeedback(false);
    };

    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    // Intro Screen
    if (state === "intro") {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-lg"
                >
                    <Card className="overflow-hidden">
                        <div className="h-2 gradient-bg" />
                        <CardHeader className="text-center">
                            <div className="h-16 w-16 mx-auto rounded-2xl gradient-bg flex items-center justify-center mb-4">
                                <Trophy className="h-8 w-8 text-white" />
                            </div>
                            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
                            <CardDescription>{quiz.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="p-4 rounded-lg bg-muted">
                                    <p className="text-2xl font-bold">{quiz.questions.length}</p>
                                    <p className="text-sm text-muted-foreground">Questões</p>
                                </div>
                                <div className="p-4 rounded-lg bg-muted">
                                    <p className="text-2xl font-bold">{quiz.timeLimit || "∞"}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {quiz.timeLimit ? "Minutos" : "Sem limite"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Nota mínima para aprovação</span>
                                    <span className="font-medium">{quiz.passingScore}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Curso</span>
                                    <span className="font-medium">{quiz.courseName}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full gap-2 gradient-bg border-0"
                                size="lg"
                                onClick={startQuiz}
                            >
                                Iniciar Quiz
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    // Results Screen
    if (state === "finished") {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-lg"
                >
                    <Card className="overflow-hidden">
                        <div className={cn("h-2", passed ? "bg-emerald-500" : "bg-destructive")} />
                        <CardHeader className="text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className={cn(
                                    "h-20 w-20 mx-auto rounded-full flex items-center justify-center mb-4",
                                    passed ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-red-100 dark:bg-red-500/20"
                                )}
                            >
                                {passed ? (
                                    <Trophy className="h-10 w-10 text-emerald-500" />
                                ) : (
                                    <XCircle className="h-10 w-10 text-destructive" />
                                )}
                            </motion.div>
                            <CardTitle className="text-2xl">
                                {passed ? "Parabéns! 🎉" : "Não foi dessa vez 😕"}
                            </CardTitle>
                            <CardDescription>
                                {passed
                                    ? "Você passou no quiz com sucesso!"
                                    : "Continue estudando e tente novamente."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Score Circle */}
                            <div className="flex justify-center">
                                <div className="relative">
                                    <svg className="w-32 h-32">
                                        <circle
                                            className="text-muted"
                                            strokeWidth="8"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="56"
                                            cx="64"
                                            cy="64"
                                        />
                                        <motion.circle
                                            className={passed ? "text-emerald-500" : "text-destructive"}
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="56"
                                            cx="64"
                                            cy="64"
                                            initial={{ strokeDasharray: "0 352" }}
                                            animate={{ strokeDasharray: `${(score / 100) * 352} 352` }}
                                            transition={{ duration: 1, delay: 0.5 }}
                                            style={{
                                                transformOrigin: "center",
                                                transform: "rotate(-90deg)",
                                            }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <motion.span
                                            className="text-3xl font-bold"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.8 }}
                                        >
                                            {score}%
                                        </motion.span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-3 rounded-lg bg-muted">
                                    <p className="text-xl font-bold text-emerald-500">{correctAnswers}</p>
                                    <p className="text-xs text-muted-foreground">Corretas</p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted">
                                    <p className="text-xl font-bold text-destructive">
                                        {quiz.questions.length - correctAnswers}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Incorretas</p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted">
                                    <p className="text-xl font-bold">{quiz.questions.length}</p>
                                    <p className="text-xs text-muted-foreground">Total</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1 gap-2" onClick={restartQuiz}>
                                    <RefreshCw className="h-4 w-4" />
                                    Tentar Novamente
                                </Button>
                                <Link href="/dashboard" className="flex-1">
                                    <Button className="w-full gap-2">
                                        <Home className="h-4 w-4" />
                                        Voltar
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    // Quiz In Progress
    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-semibold">{quiz.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        Questão {currentQuestionIndex + 1} de {quiz.questions.length}
                    </p>
                </div>
                {quiz.timeLimit && (
                    <Badge
                        variant={timeLeft < 60 ? "destructive" : "secondary"}
                        className="gap-1 text-base px-3 py-1"
                    >
                        <Clock className="h-4 w-4" />
                        {formatTime(timeLeft)}
                    </Badge>
                )}
            </div>

            {/* Progress */}
            <Progress value={progress} className="h-2" />

            {/* Question Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{currentQuestion.text}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <RadioGroup
                                value={selectedOption || ""}
                                onValueChange={setSelectedOption}
                                disabled={showFeedback}
                            >
                                {currentQuestion.options.map((option) => {
                                    const isSelected = selectedOption === option.id;
                                    const isCorrect = option.id === currentQuestion.correctOptionId;
                                    const showCorrect = showFeedback && isCorrect;
                                    const showWrong = showFeedback && isSelected && !isCorrect;

                                    return (
                                        <motion.div
                                            key={option.id}
                                            whileHover={!showFeedback ? { scale: 1.01 } : {}}
                                            whileTap={!showFeedback ? { scale: 0.99 } : {}}
                                        >
                                            <Label
                                                htmlFor={option.id}
                                                className={cn(
                                                    "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                                    !showFeedback && isSelected && "border-primary bg-primary/5",
                                                    !showFeedback && !isSelected && "border-transparent bg-muted hover:border-muted-foreground/20",
                                                    showCorrect && "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
                                                    showWrong && "border-destructive bg-red-50 dark:bg-red-500/10"
                                                )}
                                            >
                                                <RadioGroupItem value={option.id} id={option.id} />
                                                <span className="flex-1">{option.text}</span>
                                                {showCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                                                {showWrong && <XCircle className="h-5 w-5 text-destructive" />}
                                            </Label>
                                        </motion.div>
                                    );
                                })}
                            </RadioGroup>

                            {/* Feedback */}
                            {showFeedback && currentQuestion.explanation && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-lg bg-muted"
                                >
                                    <p className="text-sm font-medium mb-1">Explicação:</p>
                                    <p className="text-sm text-muted-foreground">
                                        {currentQuestion.explanation}
                                    </p>
                                </motion.div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </AnimatePresence>

            {/* Actions */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    disabled={currentQuestionIndex === 0 || showFeedback}
                    onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Anterior
                </Button>

                {!showFeedback ? (
                    <Button
                        className="gradient-bg border-0"
                        disabled={!selectedOption}
                        onClick={submitAnswer}
                    >
                        Confirmar
                        <CheckCircle2 className="h-4 w-4 ml-2" />
                    </Button>
                ) : (
                    <Button onClick={nextQuestion}>
                        {isLastQuestion ? "Ver Resultado" : "Próxima"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                )}
            </div>
        </div>
    );
}
