"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
    AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { QuestionRenderer, getQuestionTypeLabel, requiresManualGrading } from "@/components/quiz/QuestionRenderer";

type QuizState = "intro" | "inProgress" | "finished";

// Interface expandida para suportar todos os tipos
interface Answer {
    questionId: Id<"quizQuestions">;
    answer?: string;
    answers?: string[];
    matches?: { prompt: string; answer: string }[];
    order?: string[];
    blanks?: string[];
}

export default function QuizPage() {
    const params = useParams();
    const quizId = params.quizId as Id<"quizzes">;
    const { user } = useUser();

    const [state, setState] = useState<QuizState>("intro");
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [startTime, setStartTime] = useState<number>(0);
    const [result, setResult] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get Convex user and quiz data
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    const quiz = useQuery(api.quizzes.getByLesson, { lessonId: quizId as any });
    const directQuiz = useQuery(api.quizzes.getByCourse, { courseId: quizId as any });

    const submitAttempt = useMutation(api.quizzes.submitAttempt);

    // Use the quiz data that's available
    const quizData: any = quiz || (directQuiz && directQuiz[0]);
    const questions = quizData?.questions || [];
    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

    // Verificar se o quiz tem questões que requerem correção manual
    const hasManualGradingQuestions = questions.some((q: any) =>
        requiresManualGrading(q.type) || q.requiresManualGrading
    );

    // Timer
    useEffect(() => {
        if (state !== "inProgress" || !quizData?.timeLimit) return;

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
    }, [state, quizData?.timeLimit]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const startQuiz = () => {
        setState("inProgress");
        setStartTime(Date.now());
        setTimeLeft(quizData?.timeLimit ? quizData.timeLimit * 60 : 0);
        // Inicializar respostas vazias
        setAnswers(questions.map((q: any) => ({ questionId: q._id })));
    };

    // Atualizar resposta para a questão atual
    const updateCurrentAnswer = (value: any) => {
        if (!currentQuestion) return;

        const newAnswers = [...answers];
        const answerIndex = newAnswers.findIndex(a => a.questionId === currentQuestion._id);

        if (answerIndex >= 0) {
            // Determinar qual campo atualizar baseado no tipo
            switch (currentQuestion.type) {
                case "multiple_choice":
                    newAnswers[answerIndex] = { ...newAnswers[answerIndex], answers: value };
                    break;
                case "match_following":
                    newAnswers[answerIndex] = { ...newAnswers[answerIndex], matches: value };
                    break;
                case "sortable":
                    newAnswers[answerIndex] = { ...newAnswers[answerIndex], order: value };
                    break;
                case "fill_blanks":
                    newAnswers[answerIndex] = { ...newAnswers[answerIndex], blanks: value };
                    break;
                default:
                    newAnswers[answerIndex] = { ...newAnswers[answerIndex], answer: value };
            }
            setAnswers(newAnswers);
        }
    };

    const getCurrentAnswer = () => {
        if (!currentQuestion) return undefined;
        const answer = answers.find(a => a.questionId === currentQuestion._id);

        switch (currentQuestion.type) {
            case "multiple_choice":
                return answer?.answers;
            case "match_following":
                return answer?.matches;
            case "sortable":
                return answer?.order;
            case "fill_blanks":
                return answer?.blanks;
            default:
                return answer?.answer;
        }
    };

    const nextQuestion = () => {
        if (isLastQuestion) {
            finishQuiz();
        } else {
            setCurrentQuestionIndex((prev) => prev + 1);
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1);
        }
    };

    const finishQuiz = async () => {
        if (!convexUser || !quizData) {
            setState("finished");
            return;
        }

        setIsSubmitting(true);

        try {
            const timeSpent = Math.round((Date.now() - startTime) / 1000);

            const submissionResult = await submitAttempt({
                quizId: quizData._id,
                userId: convexUser._id,
                answers: answers.map(a => ({
                    questionId: a.questionId,
                    answer: a.answer,
                    answers: a.answers,
                    matches: a.matches,
                    order: a.order,
                    blanks: a.blanks,
                })),
                timeSpent,
            });

            setResult(submissionResult);
            setState("finished");

            if (submissionResult.requiresManualGrading) {
                toast.info("Quiz enviado! Algumas questões serão corrigidas pelo professor.");
            } else if (submissionResult.passed) {
                toast.success("Parabéns! Você passou no quiz! 🎉");
            } else {
                toast.info("Continue estudando e tente novamente!");
            }
        } catch (error) {
            console.error("Error submitting quiz:", error);
            toast.error("Erro ao enviar quiz");
            setState("finished");
        } finally {
            setIsSubmitting(false);
        }
    };

    const restartQuiz = () => {
        setState("intro");
        setCurrentQuestionIndex(0);
        setAnswers([]);
        setResult(null);
    };

    // Loading state
    if (!quizData) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const score = result?.score || 0;
    const passed = result?.passed || false;
    const requiresManual = result?.requiresManualGrading || hasManualGradingQuestions;

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
                            <CardTitle className="text-2xl">{quizData.title}</CardTitle>
                            <CardDescription>{quizData.description || "Teste seus conhecimentos!"}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="p-4 rounded-lg bg-muted">
                                    <p className="text-2xl font-bold">{questions.length}</p>
                                    <p className="text-sm text-muted-foreground">Questões</p>
                                </div>
                                <div className="p-4 rounded-lg bg-muted">
                                    <p className="text-2xl font-bold">{quizData.timeLimit || "∞"}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {quizData.timeLimit ? "Minutos" : "Sem limite"}
                                    </p>
                                </div>
                            </div>

                            {hasManualGradingQuestions && (
                                <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-orange-900">
                                            Correção Manual
                                        </p>
                                        <p className="text-xs text-orange-700 mt-1">
                                            Algumas questões serão corrigidas pelo professor
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Nota mínima para aprovação</span>
                                    <span className="font-medium">{quizData.passingScore || 70}%</span>
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
                        <div className={cn(
                            "h-2",
                            requiresManual ? "bg-orange-500" : passed ? "bg-emerald-500" : "bg-destructive"
                        )} />
                        <CardHeader className="text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className={cn(
                                    "h-20 w-20 mx-auto rounded-full flex items-center justify-center mb-4",
                                    requiresManual ? "bg-orange-100" : passed ? "bg-emerald-100" : "bg-red-100"
                                )}
                            >
                                {requiresManual ? (
                                    <Clock className="h-10 w-10 text-orange-500" />
                                ) : passed ? (
                                    <Trophy className="h-10 w-10 text-emerald-500" />
                                ) : (
                                    <XCircle className="h-10 w-10 text-destructive" />
                                )}
                            </motion.div>
                            <CardTitle className="text-2xl">
                                {requiresManual
                                    ? "Aguardando Correção ⏳"
                                    : passed
                                        ? "Parabéns! 🎉"
                                        : "Não foi dessa vez 😕"}
                            </CardTitle>
                            <CardDescription>
                                {requiresManual
                                    ? "Seu quiz foi enviado e será corrigido pelo professor."
                                    : passed
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
                                            className={
                                                requiresManual
                                                    ? "text-orange-500"
                                                    : passed
                                                        ? "text-emerald-500"
                                                        : "text-destructive"
                                            }
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
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <motion.span
                                            className="text-3xl font-bold"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.8 }}
                                        >
                                            {requiresManual ? "?" : `${score}%`}
                                        </motion.span>
                                        {requiresManual && (
                                            <span className="text-xs text-orange-600">Parcial</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {requiresManual && (
                                <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-orange-900">
                                                Correção em andamento
                                            </p>
                                            <p className="text-xs text-orange-700 mt-1">
                                                Você será notificado quando a correção for concluída.
                                                A nota final pode ser diferente após a correção manual.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Stats */}
                            {!requiresManual && result?.results && (
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xl font-bold text-emerald-500">
                                            {result.results.filter((r: any) => r.isCorrect).length}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Corretas</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xl font-bold text-destructive">
                                            {result.results.filter((r: any) => !r.isCorrect).length}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Incorretas</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xl font-bold">{questions.length}</p>
                                        <p className="text-xs text-muted-foreground">Total</p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                {!requiresManual && (
                                    <Button variant="outline" className="flex-1 gap-2" onClick={restartQuiz}>
                                        <RefreshCw className="h-4 w-4" />
                                        Tentar Novamente
                                    </Button>
                                )}
                                <Link href="/student" className="flex-1">
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

    // Quiz In Progress - Renderiza todos os tipos de questões
    return (
        <div className="max-w-3xl mx-auto p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-semibold">{quizData.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        Questão {currentQuestionIndex + 1} de {questions.length}
                    </p>
                </div>
                {quizData.timeLimit && (
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

            {/* Question Navigation */}
            <div className="flex gap-2 flex-wrap">
                {questions.map((_: any, index: number) => {
                    const hasAnswer = answers[index] && (
                        answers[index].answer ||
                        answers[index].answers?.length ||
                        answers[index].matches?.length ||
                        answers[index].order?.length ||
                        answers[index].blanks?.some(b => b)
                    );

                    return (
                        <button
                            key={index}
                            onClick={() => setCurrentQuestionIndex(index)}
                            className={cn(
                                "w-10 h-10 rounded-lg font-medium transition-all",
                                currentQuestionIndex === index
                                    ? "bg-indigo-600 text-white"
                                    : hasAnswer
                                        ? "bg-green-100 text-green-700 border border-green-300"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                        >
                            {index + 1}
                        </button>
                    );
                })}
            </div>

            {/* Question Card */}
            {currentQuestion && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion._id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline">
                                        {getQuestionTypeLabel(currentQuestion.type)}
                                    </Badge>
                                    <Badge variant="secondary">
                                        {currentQuestion.points} pts
                                    </Badge>
                                    {requiresManualGrading(currentQuestion.type) && (
                                        <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                                            Correção Manual
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Renderizar questão baseado no tipo */}
                                <QuestionRenderer
                                    question={{
                                        type: currentQuestion.type,
                                        question: currentQuestion.question,
                                        options: currentQuestion.options,
                                        correctAnswer: currentQuestion.correctAnswer,
                                        correctAnswers: currentQuestion.correctAnswers,
                                        matchPairs: currentQuestion.matchPairs,
                                        correctOrder: currentQuestion.correctOrder,
                                        blankAnswers: currentQuestion.blankAnswers,
                                        mediaUrl: currentQuestion.mediaUrl,
                                        mediaType: currentQuestion.mediaType,
                                        userAnswer: typeof getCurrentAnswer() === 'string' ? getCurrentAnswer() as string : undefined,
                                        userAnswers: Array.isArray(getCurrentAnswer()) && typeof getCurrentAnswer()?.[0] === 'string' ? getCurrentAnswer() as string[] : undefined,
                                        userMatches: Array.isArray(getCurrentAnswer()) && (getCurrentAnswer()?.[0] as any)?.prompt ? getCurrentAnswer() as any : undefined,
                                        userOrder: currentQuestion.type === 'sortable' ? getCurrentAnswer() as string[] : undefined,
                                        userBlanks: currentQuestion.type === 'fill_blanks' ? getCurrentAnswer() as string[] : undefined,
                                    }}
                                    onAnswer={updateCurrentAnswer}
                                    disabled={false}
                                    showCorrection={false}
                                />
                            </CardContent>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Actions */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    disabled={currentQuestionIndex === 0}
                    onClick={prevQuestion}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Anterior
                </Button>

                {isLastQuestion ? (
                    <Button
                        className="gradient-bg border-0"
                        onClick={finishQuiz}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Finalizar Quiz
                        <CheckCircle2 className="h-4 w-4 ml-2" />
                    </Button>
                ) : (
                    <Button onClick={nextQuestion}>
                        Próxima
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                )}
            </div>
        </div>
    );
}
