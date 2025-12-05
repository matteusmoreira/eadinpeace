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
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";

type QuizState = "intro" | "inProgress" | "finished";

interface Answer {
    questionId: Id<"quizQuestions">;
    answer: string;
    isCorrect: boolean;
}

export default function QuizPage() {
    const params = useParams();
    const quizId = params.quizId as Id<"quizzes">;
    const { user } = useUser();

    const [state, setState] = useState<QuizState>("intro");
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [startTime, setStartTime] = useState<number>(0);
    const [result, setResult] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get Convex user and quiz data
    const convexUser = useQuery(api.users.getByClerkId, {
        clerkId: user?.id || ""
    });

    const quiz = useQuery(api.quizzes.getByLesson, { lessonId: quizId as any });

    // If quiz not found by lesson, try direct query (quizId might be a quiz Id)
    const directQuiz = useQuery(api.quizzes.getByCourse, { courseId: quizId as any });

    const submitAttempt = useMutation(api.quizzes.submitAttempt);

    // Use the quiz data that's available
    const quizData = quiz || (directQuiz && directQuiz[0]);
    const questions = quizData?.questions || [];
    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

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
    };

    const submitAnswer = () => {
        if (!selectedOption || !currentQuestion) return;

        const isCorrect = selectedOption === currentQuestion.correctAnswer;
        const answer: Answer = {
            questionId: currentQuestion._id,
            answer: selectedOption,
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
                })),
                timeSpent,
            });

            setResult(submissionResult);
            setState("finished");

            if (submissionResult.passed) {
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
        setSelectedOption(null);
        setAnswers([]);
        setShowFeedback(false);
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

    const correctAnswers = result?.results?.filter((r: any) => r.isCorrect).length ||
        answers.filter(a => a.isCorrect).length;
    const score = result?.score ||
        (questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0);
    const passed = result?.passed || score >= (quizData.passingScore || 70);

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
                                        {questions.length - correctAnswers}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Incorretas</p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted">
                                    <p className="text-xl font-bold">{questions.length}</p>
                                    <p className="text-xs text-muted-foreground">Total</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1 gap-2" onClick={restartQuiz}>
                                    <RefreshCw className="h-4 w-4" />
                                    Tentar Novamente
                                </Button>
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

    // Quiz In Progress
    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
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
                                <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <RadioGroup
                                    value={selectedOption || ""}
                                    onValueChange={setSelectedOption}
                                    disabled={showFeedback}
                                >
                                    {currentQuestion.options?.map((option, index) => {
                                        const optionId = String.fromCharCode(97 + index); // a, b, c, d...
                                        const isSelected = selectedOption === option;
                                        const isCorrect = option === currentQuestion.correctAnswer;
                                        const showCorrect = showFeedback && isCorrect;
                                        const showWrong = showFeedback && isSelected && !isCorrect;

                                        return (
                                            <motion.div
                                                key={optionId}
                                                whileHover={!showFeedback ? { scale: 1.01 } : {}}
                                                whileTap={!showFeedback ? { scale: 0.99 } : {}}
                                            >
                                                <Label
                                                    htmlFor={optionId}
                                                    className={cn(
                                                        "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                                        !showFeedback && isSelected && "border-primary bg-primary/5",
                                                        !showFeedback && !isSelected && "border-transparent bg-muted hover:border-muted-foreground/20",
                                                        showCorrect && "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
                                                        showWrong && "border-destructive bg-red-50 dark:bg-red-500/10"
                                                    )}
                                                >
                                                    <RadioGroupItem value={option} id={optionId} />
                                                    <span className="flex-1">{option}</span>
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
            )}

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
                    <Button onClick={nextQuestion} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        {isLastQuestion ? "Ver Resultado" : "Próxima"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                )}
            </div>
        </div>
    );
}
