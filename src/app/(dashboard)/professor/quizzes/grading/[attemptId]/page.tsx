"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
    ArrowLeft,
    Save,
    SendHorizonal,
    User,
    Calendar,
    Clock,
    Award,
    MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";

export default function GradeAttemptPage() {
    const params = useParams();
    const router = useRouter();
    const attemptId = params.attemptId as Id<"quizAttempts">;

    const [questionGrades, setQuestionGrades] = useState<
        Record<string, { points: number; feedback: string }>
    >({});
    const [instructorComments, setInstructorComments] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const attempt = useQuery(api.quizzesGrading.getAttemptById, { attemptId });
    const gradeAttempt = useMutation(api.quizzesGrading.gradeAttempt);

    if (!attempt) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Calcular nota total
    const calculateTotalScore = () => {
        let totalPoints = 0;
        let maxPoints = 0;

        attempt.questions.forEach((q) => {
            const grade = questionGrades[q.questionId];
            const questionData = q.questionData;

            if (questionData) {
                maxPoints += questionData.points;

                if (q.isCorrect) {
                    // Questão automática já corrigida
                    totalPoints += q.points;
                } else if (grade) {
                    // Questão manual com nota atribuída
                    totalPoints += grade.points;
                }
            }
        });

        return {
            totalPoints,
            maxPoints,
            percentage: maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0,
        };
    };

    const handleSave = async (finalize: boolean) => {
        setIsSaving(true);
        try {
            const grades = Object.entries(questionGrades).map(([questionId, data]) => ({
                questionId: questionId as Id<"quizQuestions">,
                manualPoints: data.points,
                instructorFeedback: data.feedback || undefined,
            }));

            await gradeAttempt({
                attemptId,
                questionGrades: grades,
                instructorComments: instructorComments || undefined,
            });

            toast.success(finalize ? "Prova corrigida e aluno notificado!" : "Progresso salvo!");

            if (finalize) {
                router.push("/professor/quizzes/grading");
            }
        } catch (error) {
            toast.error("Erro ao salvar correção");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const score = calculateTotalScore();
    const passedThreshold = 70; // Você pode buscar isso do quiz

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/professor/quizzes/grading"
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Correções
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Corrigindo Prova
                    </h1>
                    <p className="text-gray-600">{attempt.quizTitle}</p>
                </div>

                {/* Student Info Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-50 rounded-lg">
                                <User className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Aluno</p>
                                <p className="font-semibold text-gray-900">{attempt.studentName}</p>
                                <p className="text-xs text-gray-500">{attempt.studentEmail}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Data de Envio</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(attempt.completedAt).toLocaleDateString("pt-BR")}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {new Date(attempt.completedAt).toLocaleTimeString("pt-BR")}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-50 rounded-lg">
                                <Clock className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Tempo Gasto</p>
                                <p className="font-semibold text-gray-900">
                                    {Math.floor(attempt.timeSpent / 60)} min
                                </p>
                                <p className="text-xs text-gray-500">
                                    {attempt.timeSpent % 60} segundos
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Score Summary */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg p-6 mb-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-indigo-100 mb-1">Nota Atual</p>
                            <p className="text-4xl font-bold">{Math.round(score.percentage)}%</p>
                            <p className="text-sm text-indigo-100 mt-1">
                                {score.totalPoints} de {score.maxPoints} pontos
                            </p>
                        </div>
                        <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Award className="w-12 h-12" />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white/20 rounded-full h-2">
                                <div
                                    className="bg-white rounded-full h-2 transition-all duration-500"
                                    style={{ width: `${Math.min(score.percentage, 100)}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium">
                                {score.percentage >= passedThreshold ? "✓ Aprovado" : "✗ Reprovado"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <div className="space-y-4 mb-6">
                    {attempt.questions.map((question, index) => {
                        const questionData = question.questionData;
                        if (!questionData) return null;

                        const requiresManualGrading = questionData.requiresManualGrading;
                        const isAutoGraded = question.isCorrect !== undefined && !requiresManualGrading;

                        return (
                            <div
                                key={question.questionId}
                                className={`bg-white rounded-xl shadow-sm p-6 ${isAutoGraded
                                    ? question.isCorrect
                                        ? "border-l-4 border-green-500"
                                        : "border-l-4 border-red-500"
                                    : "border-l-4 border-orange-500"
                                    }`}
                            >
                                {/* Question Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                                                Questão {index + 1}
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                {questionData.points} pontos
                                            </span>
                                            {isAutoGraded && (
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${question.isCorrect
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                        }`}
                                                >
                                                    {question.isCorrect ? "✓ Correta" : "✗ Incorreta"}
                                                </span>
                                            )}
                                            {requiresManualGrading && (
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                                    Requer Correção Manual
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-900 font-medium">
                                            {questionData.question}
                                        </p>
                                    </div>
                                </div>

                                {/* Student Answer */}
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                        Resposta do Aluno:
                                    </p>
                                    <p className="text-gray-900">
                                        {question.userAnswer || "Não respondida"}
                                    </p>
                                </div>

                                {/* Correct Answer (for auto-graded questions) */}
                                {isAutoGraded && (
                                    <div className="bg-green-50 rounded-lg p-4 mb-4">
                                        <p className="text-sm font-medium text-green-700 mb-2">
                                            Resposta Correta:
                                        </p>
                                        <p className="text-green-900">{question.correctAnswer}</p>
                                    </div>
                                )}

                                {/* Manual Grading Section */}
                                {requiresManualGrading && (
                                    <div className="border-t border-gray-200 pt-4 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Pontuação (máx: {questionData.points})
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={questionData.points}
                                                value={
                                                    questionGrades[question.questionId]?.points || 0
                                                }
                                                onChange={(e) =>
                                                    setQuestionGrades({
                                                        ...questionGrades,
                                                        [question.questionId]: {
                                                            ...questionGrades[question.questionId],
                                                            points: Number(e.target.value),
                                                        },
                                                    })
                                                }
                                                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Feedback para o Aluno
                                            </label>
                                            <textarea
                                                value={
                                                    questionGrades[question.questionId]?.feedback || ""
                                                }
                                                onChange={(e) =>
                                                    setQuestionGrades({
                                                        ...questionGrades,
                                                        [question.questionId]: {
                                                            ...questionGrades[question.questionId],
                                                            feedback: e.target.value,
                                                        },
                                                    })
                                                }
                                                rows={3}
                                                placeholder="Adicione comentários sobre a resposta..."
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Explanation (if available) */}
                                {questionData.explanation && (
                                    <div className="bg-blue-50 rounded-lg p-4 mt-4">
                                        <p className="text-sm font-medium text-blue-700 mb-2">
                                            Explicação:
                                        </p>
                                        <p className="text-blue-900 text-sm">
                                            {questionData.explanation}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* General Comments */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            Comentários Gerais
                        </h3>
                    </div>
                    <textarea
                        value={instructorComments}
                        onChange={(e) => setInstructorComments(e.target.value)}
                        rows={4}
                        placeholder="Adicione comentários gerais sobre o desempenho do aluno..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-4 pb-6">
                    <Link
                        href="/professor/quizzes/grading"
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </Link>
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleSave(false)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            Salvar Rascunho
                        </button>
                        <button
                            onClick={() => handleSave(true)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            <SendHorizonal className="w-4 h-4" />
                            Finalizar e Notificar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
