"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
    ArrowLeft,
    Save,
    SendHorizonal,
    User,
    Calendar,
    Clock,
    Award,
    MessageSquare,
    FileText,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

interface CriterionLevel {
    label: string;
    points: number;
    description: string;
}

interface Criterion {
    name: string;
    description: string;
    maxPoints: number;
    levels: CriterionLevel[];
}

interface Rubric {
    _id: string;
    name: string;
    description?: string;
    isDefault: boolean;
    criteria: Criterion[];
}

export default function GradeAttemptPage() {
    const params = useParams();
    const router = useRouter();
    const attemptId = params.attemptId as Id<"quizAttempts">;
    const { user } = useUser();

    const [questionGrades, setQuestionGrades] = useState<
        Record<string, { points: number; feedback: string }>
    >({});
    const [instructorComments, setInstructorComments] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [selectedRubricId, setSelectedRubricId] = useState<string | undefined>(undefined);
    const [isRubricSelectorOpen, setIsRubricSelectorOpen] = useState(false);
    const [expandedCriteria, setExpandedCriteria] = useState<Record<string, number>>({});

    const currentUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
    const attempt = useQuery(api.quizzesGrading.getAttemptById, { attemptId });
    const gradeAttempt = useMutation(api.quizzesGrading.gradeAttempt);

    // Buscar rubricas da organização
    const rubrics = useQuery(
        api.gradingRubrics.getByOrganization,
        currentUser?.organizationId
            ? { organizationId: currentUser.organizationId }
            : "skip"
    );

    // Selecionar rubrica padrão automaticamente
    useEffect(() => {
        if (rubrics && rubrics.length > 0 && !selectedRubricId) {
            const defaultRubric = rubrics.find((r) => r.isDefault);
            if (defaultRubric) {
                setSelectedRubricId(defaultRubric._id);
            }
        }
    }, [rubrics, selectedRubricId]);

    const selectedRubric = rubrics?.find((r) => r._id === selectedRubricId) as Rubric | undefined;

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

    const handleSelectLevel = (questionId: string, points: number) => {
        setQuestionGrades({
            ...questionGrades,
            [questionId]: {
                ...questionGrades[questionId],
                points,
                feedback: questionGrades[questionId]?.feedback || "",
            },
        });
    };

    const toggleCriterion = (questionId: string, criterionIndex: number) => {
        const current = expandedCriteria[questionId];
        if (current === criterionIndex) {
            const newExpanded = { ...expandedCriteria };
            delete newExpanded[questionId];
            setExpandedCriteria(newExpanded);
        } else {
            setExpandedCriteria({ ...expandedCriteria, [questionId]: criterionIndex });
        }
    };

    const score = calculateTotalScore();
    const passedThreshold = 70;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/professor/quizzes/grading"
                        className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Correções
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Corrigindo Prova
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">{attempt.quizTitle}</p>
                </div>

                {/* Student Info Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Aluno</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{attempt.studentName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">{attempt.studentEmail}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Data de Envio</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {new Date(attempt.completedAt).toLocaleDateString("pt-BR")}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {new Date(attempt.completedAt).toLocaleTimeString("pt-BR")}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Tempo Gasto</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {Math.floor(attempt.timeSpent / 60)} min
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {attempt.timeSpent % 60} segundos
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rubric Selector */}
                {rubrics && rubrics.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Rubrica de Avaliação
                            </h3>
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setIsRubricSelectorOpen(!isRubricSelectorOpen)}
                                className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-gray-400" />
                                    <div className="text-left">
                                        {selectedRubric ? (
                                            <>
                                                <p className="text-gray-900 dark:text-white font-medium">{selectedRubric.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {selectedRubric.criteria.length} critério(s)
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-gray-500 dark:text-gray-400">Selecionar rubrica (recomendado)</p>
                                        )}
                                    </div>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isRubricSelectorOpen ? "rotate-180" : ""}`} />
                            </button>

                            {isRubricSelectorOpen && (
                                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 max-h-60 overflow-y-auto">
                                    <button
                                        onClick={() => {
                                            setSelectedRubricId(undefined);
                                            setIsRubricSelectorOpen(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${!selectedRubricId ? "bg-indigo-50 dark:bg-indigo-900/30" : ""}`}
                                    >
                                        <p className="text-gray-700 dark:text-gray-300 font-medium">Sem rubrica</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Correção livre</p>
                                    </button>
                                    <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                                    {rubrics.map((rubric) => (
                                        <button
                                            key={rubric._id}
                                            onClick={() => {
                                                setSelectedRubricId(rubric._id);
                                                setIsRubricSelectorOpen(false);
                                            }}
                                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedRubricId === rubric._id ? "bg-indigo-50 dark:bg-indigo-900/30" : ""}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <p className="text-gray-900 dark:text-white font-medium">{rubric.name}</p>
                                                {rubric.isDefault && (
                                                    <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-xs">
                                                        Padrão
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {(rubric.criteria as Criterion[]).map((c) => c.name).join(", ")}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Rubric Preview */}
                        {selectedRubric && (
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Critérios disponíveis:</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedRubric.criteria.map((c, i) => (
                                        <span key={i} className="px-2 py-1 bg-white dark:bg-gray-600 rounded text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-500">
                                            {c.name} ({c.maxPoints} pts)
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

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
                        const currentGrade = questionGrades[question.questionId];
                        const expandedCriterionIndex = expandedCriteria[question.questionId];

                        return (
                            <div
                                key={question.questionId}
                                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 ${isAutoGraded
                                        ? question.isCorrect
                                            ? "border-l-4 border-l-green-500"
                                            : "border-l-4 border-l-red-500"
                                        : "border-l-4 border-l-orange-500"
                                    }`}
                            >
                                {/* Question Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Questão {index + 1}
                                            </span>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {questionData.points} pontos
                                            </span>
                                            {isAutoGraded && (
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${question.isCorrect
                                                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                                        }`}
                                                >
                                                    {question.isCorrect ? "✓ Correta" : "✗ Incorreta"}
                                                </span>
                                            )}
                                            {requiresManualGrading && (
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                                                    Requer Correção Manual
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            {questionData.question}
                                        </p>
                                    </div>
                                </div>

                                {/* Student Answer */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Resposta do Aluno:
                                    </p>
                                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                                        {question.userAnswer || "Não respondida"}
                                    </p>
                                </div>

                                {/* Correct Answer (for auto-graded questions) */}
                                {isAutoGraded && (
                                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4">
                                        <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                                            Resposta Correta:
                                        </p>
                                        <p className="text-green-900 dark:text-green-300">{question.correctAnswer}</p>
                                    </div>
                                )}

                                {/* Manual Grading Section with Rubric */}
                                {requiresManualGrading && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                                        {/* Rubric-based grading */}
                                        {selectedRubric && selectedRubric.criteria.length > 0 && (
                                            <div className="space-y-3">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Aplicar Rubrica:
                                                </p>
                                                {selectedRubric.criteria.map((criterion, criterionIndex) => (
                                                    <div key={criterionIndex} className="border border-indigo-200 dark:border-indigo-800 rounded-lg overflow-hidden">
                                                        <button
                                                            onClick={() => toggleCriterion(question.questionId, criterionIndex)}
                                                            className="w-full flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                                                                    {criterion.name}
                                                                </span>
                                                                <span className="text-xs text-indigo-600 dark:text-indigo-400">
                                                                    ({criterion.maxPoints} pts máx.)
                                                                </span>
                                                            </div>
                                                            {expandedCriterionIndex === criterionIndex ? (
                                                                <ChevronUp className="w-4 h-4 text-indigo-500" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4 text-indigo-500" />
                                                            )}
                                                        </button>

                                                        {expandedCriterionIndex === criterionIndex && (
                                                            <div className="p-3 bg-white dark:bg-gray-800">
                                                                {criterion.description && (
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                                                        {criterion.description}
                                                                    </p>
                                                                )}
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                                    {criterion.levels.map((level, levelIndex) => {
                                                                        const levelPoints = Math.round((level.points / 100) * criterion.maxPoints);
                                                                        const isSelected = currentGrade?.points === levelPoints;

                                                                        return (
                                                                            <button
                                                                                key={levelIndex}
                                                                                onClick={() => handleSelectLevel(question.questionId, levelPoints)}
                                                                                className={`p-3 rounded-lg border-2 text-left transition-all ${isSelected
                                                                                        ? "border-indigo-600 bg-indigo-100 dark:bg-indigo-800"
                                                                                        : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500"
                                                                                    }`}
                                                                            >
                                                                                <p className={`text-sm font-medium ${isSelected ? "text-indigo-900 dark:text-indigo-200" : "text-gray-900 dark:text-white"
                                                                                    }`}>
                                                                                    {level.label}
                                                                                </p>
                                                                                <p className={`text-lg font-bold ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-300"
                                                                                    }`}>
                                                                                    {levelPoints} pts
                                                                                </p>
                                                                                {level.description && (
                                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                                                                        {level.description}
                                                                                    </p>
                                                                                )}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Manual points input */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Pontuação (máx: {questionData.points})
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={questionData.points}
                                                value={currentGrade?.points || 0}
                                                onChange={(e) =>
                                                    setQuestionGrades({
                                                        ...questionGrades,
                                                        [question.questionId]: {
                                                            ...questionGrades[question.questionId],
                                                            points: Number(e.target.value),
                                                            feedback: questionGrades[question.questionId]?.feedback || "",
                                                        },
                                                    })
                                                }
                                                className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Feedback para o Aluno
                                            </label>
                                            <textarea
                                                value={currentGrade?.feedback || ""}
                                                onChange={(e) =>
                                                    setQuestionGrades({
                                                        ...questionGrades,
                                                        [question.questionId]: {
                                                            ...questionGrades[question.questionId],
                                                            points: questionGrades[question.questionId]?.points || 0,
                                                            feedback: e.target.value,
                                                        },
                                                    })
                                                }
                                                rows={3}
                                                placeholder="Adicione comentários sobre a resposta..."
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Explanation (if available) */}
                                {questionData.explanation && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-4">
                                        <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                                            Explicação:
                                        </p>
                                        <p className="text-blue-900 dark:text-blue-300 text-sm">
                                            {questionData.explanation}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* General Comments */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Comentários Gerais
                        </h3>
                    </div>
                    <textarea
                        value={instructorComments}
                        onChange={(e) => setInstructorComments(e.target.value)}
                        rows={4}
                        placeholder="Adicione comentários gerais sobre o desempenho do aluno..."
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-4 pb-6">
                    <Link
                        href="/professor/quizzes/grading"
                        className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
