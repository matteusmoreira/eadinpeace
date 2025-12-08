"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
    Trophy,
    BookOpen,
    Target,
    TrendingUp,
    CheckCircle2,
    Clock,
    Award,
} from "lucide-react";
import Link from "next/link";

export default function StudentGradebookPage() {
    const params = useParams();
    const courseId = params.courseId as string;
    const { user } = useUser();

    const convexUser = useQuery(api.users.getByClerkId, {
        clerkId: user?.id || "",
    });

    const gradebook = useQuery(
        api.courseGrades.getStudentGradebook,
        convexUser?._id && courseId
            ? { userId: convexUser._id, courseId: courseId as any }
            : "skip"
    );

    const course = useQuery(api.courses.getById, { courseId: courseId as any });

    if (!gradebook || !course) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case "A":
                return "text-green-600 bg-green-100";
            case "B":
                return "text-blue-600 bg-blue-100";
            case "C":
                return "text-yellow-600 bg-yellow-100";
            case "D":
                return "text-orange-600 bg-orange-100";
            case "F":
                return "text-red-600 bg-red-100";
            default:
                return "text-gray-600 bg-gray-100";
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "graded":
                return (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Corrigido
                    </span>
                );
            case "pending":
                return (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pendente
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        Automático
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/student/courses"
                        className="text-indigo-600 hover:text-indigo-700 text-sm mb-4 inline-block"
                    >
                        ← Voltar para Cursos
                    </Link>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">{course.title}</h1>
                    <p className="text-gray-600">Seu boletim e notas do curso</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {/* Nota Final */}
                    <div className="bg-white rounded-xl shadow-sm p-6 col-span-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Nota Final</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-5xl font-bold text-gray-900">
                                        {gradebook.finalGrade != null ? gradebook.finalGrade.toFixed(1) : "—"}
                                    </span>
                                    <span
                                        className={`px-4 py-2 rounded-lg text-2xl font-bold ${getGradeColor(
                                            gradebook.letterGrade || "—"
                                        )}`}
                                    >
                                        {gradebook.letterGrade || "—"}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-full">
                                <Trophy className="w-10 h-10 text-indigo-600" />
                            </div>
                        </div>
                    </div>

                    {/* Quizzes */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                            <span className="text-sm text-gray-500">
                                {gradebook.quizzes?.length || 0} avaliações
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {gradebook.quizzes?.length > 0
                                ? (
                                    gradebook.quizzes.reduce(
                                        (acc: number, q: any) => acc + (q.score || 0),
                                        0
                                    ) / gradebook.quizzes.length
                                ).toFixed(1)
                                : "—"}
                        </p>
                        <p className="text-sm text-gray-600">Média Quizzes</p>
                    </div>

                    {/* Progresso */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Target className="w-6 h-6 text-green-600" />
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {gradebook.quizzes?.filter((q: any) => q.status === "passed").length || 0}/
                            {gradebook.quizzes?.length || 0}
                        </p>
                        <p className="text-sm text-gray-600">Aprovações</p>
                    </div>
                </div>

                {/* Quizzes List */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-bold text-gray-900">Avaliações</h2>
                    </div>

                    {gradebook.quizzes?.length === 0 ? (
                        <div className="p-12 text-center">
                            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Nenhuma avaliação realizada
                            </h3>
                            <p className="text-gray-600">
                                Complete as avaliações do curso para ver suas notas
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {gradebook.quizzes?.map((quiz: any, index: number) => (
                                <div
                                    key={quiz.id || index}
                                    className="p-6 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-medium text-gray-900">
                                                    {quiz.title || `Avaliação ${index + 1}`}
                                                </h3>
                                                {getStatusBadge(quiz.status)}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                {quiz.lastAttemptDate && (
                                                    <span>
                                                        {new Date(quiz.lastAttemptDate).toLocaleDateString("pt-BR")}
                                                    </span>
                                                )}
                                                {quiz.weight && (
                                                    <span className="text-indigo-600">Peso: {quiz.weight}x</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {/* Nota */}
                                            <div className="text-right">
                                                <span
                                                    className={`text-2xl font-bold ${quiz.status === "passed" ? "text-green-600" : "text-red-600"
                                                        }`}
                                                >
                                                    {quiz.score?.toFixed(0) || "?"}%
                                                </span>
                                                <p className="text-xs text-gray-500">
                                                    {quiz.status === "passed" ? "Aprovado" : "Reprovado"}
                                                </p>
                                            </div>

                                            {/* Link para detalhes */}
                                            <Link
                                                href={`/student/quiz/${quiz.id}`}
                                                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-sm font-medium"
                                            >
                                                Ver Detalhes
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Grade Scale */}
                <div className="mt-8 p-6 bg-white rounded-xl shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4">Escala de Notas</h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-700 rounded font-bold">
                                A
                            </span>
                            <span className="text-sm text-gray-600">90-100%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded font-bold">
                                B
                            </span>
                            <span className="text-sm text-gray-600">80-89%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-8 flex items-center justify-center bg-yellow-100 text-yellow-700 rounded font-bold">
                                C
                            </span>
                            <span className="text-sm text-gray-600">70-79%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-700 rounded font-bold">
                                D
                            </span>
                            <span className="text-sm text-gray-600">60-69%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-700 rounded font-bold">
                                F
                            </span>
                            <span className="text-sm text-gray-600">&lt;60%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
