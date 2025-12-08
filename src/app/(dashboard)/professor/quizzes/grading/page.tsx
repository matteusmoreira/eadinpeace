"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import {
    FileCheck,
    Clock,
    CheckCircle2,
    AlertCircle,
    Search,
    Filter,
    Eye,
} from "lucide-react";
import Link from "next/link";

export default function GradingPage() {
    const { user } = useUser();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Buscar dados do usuário no Convex
    const currentUser = useQuery(api.users.getCurrentUser);

    // Buscar tentativas pendentes de correção
    const pendingAttempts = useQuery(
        api.quizzesGrading.getPendingGrading,
        currentUser?._id ? { instructorId: currentUser._id } : "skip"
    );

    // Buscar estatísticas gerais
    const stats = useQuery(
        api.quizzesGrading.getGradingStats,
        currentUser?.organizationId ? { organizationId: currentUser.organizationId } : "skip"
    );

    if (!currentUser || !pendingAttempts) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Filtrar tentativas
    const filteredAttempts = pendingAttempts.filter((attempt) => {
        const matchesSearch =
            attempt.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            attempt.quizTitle.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "pending" && attempt.gradingStatus === "pending") ||
            (statusFilter === "grading" && attempt.gradingStatus === "grading");

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Correção de Provas
                    </h1>
                    <p className="text-gray-600">
                        Corrija provas dissertativas e gerencie avaliações pendentes
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={<FileCheck className="w-6 h-6" />}
                        title="Total de Tentativas"
                        value={stats?.totalAttempts || 0}
                        color="blue"
                    />
                    <StatCard
                        icon={<Clock className="w-6 h-6" />}
                        title="Aguardando Correção"
                        value={stats?.pendingGrading || 0}
                        color="orange"
                    />
                    <StatCard
                        icon={<CheckCircle2 className="w-6 h-6" />}
                        title="Corrigidas"
                        value={stats?.graded || 0}
                        color="green"
                    />
                    <StatCard
                        icon={<AlertCircle className="w-6 h-6" />}
                        title="Média Geral"
                        value={`${stats?.avgScore || 0}%`}
                        color="purple"
                    />
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar por aluno ou prova..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="text-gray-400 w-5 h-5" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            >
                                <option value="all">Todos os Status</option>
                                <option value="pending">Pendente</option>
                                <option value="grading">Em Correção</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Attempts Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Aluno
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Prova
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Data de Envio
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Nota Automática
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredAttempts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <FileCheck className="w-16 h-16 mb-4 opacity-20" />
                                                <p className="text-lg font-medium">
                                                    Nenhuma prova aguardando correção
                                                </p>
                                                <p className="text-sm mt-1">
                                                    {searchQuery || statusFilter !== "all"
                                                        ? "Tente ajustar os filtros"
                                                        : "Todas as provas estão corrigidas!"}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAttempts.map((attempt) => (
                                        <tr
                                            key={attempt.attemptId}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {attempt.studentName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {attempt.studentEmail}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">
                                                    {attempt.quizTitle}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(attempt.completedAt).toLocaleString("pt-BR")}
                                            </td>
                                            <td className="px-6 py-4">
                                                {attempt.automaticScore !== undefined ? (
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {Math.round(attempt.automaticScore)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-400">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={attempt.gradingStatus} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/professor/quizzes/grading/${attempt.attemptId}`}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Corrigir
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary */}
                {filteredAttempts.length > 0 && (
                    <div className="mt-6 text-center text-sm text-gray-600">
                        Mostrando {filteredAttempts.length} de {pendingAttempts.length}{" "}
                        provas
                    </div>
                )}
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({
    icon,
    title,
    value,
    color,
}: {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    color: "blue" | "orange" | "green" | "purple";
}) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        orange: "bg-orange-50 text-orange-600",
        green: "bg-green-50 text-green-600",
        purple: "bg-purple-50 text-purple-600",
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
            </div>
        </div>
    );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
    const statusConfig = {
        pending: {
            label: "Pendente",
            className: "bg-orange-100 text-orange-700",
        },
        grading: {
            label: "Em Correção",
            className: "bg-blue-100 text-blue-700",
        },
        graded: {
            label: "Corrigida",
            className: "bg-green-100 text-green-700",
        },
        auto_graded: {
            label: "Auto-corrigida",
            className: "bg-gray-100 text-gray-700",
        },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
        label: status,
        className: "bg-gray-100 text-gray-700",
    };

    return (
        <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.className}`}
        >
            {config.label}
        </span>
    );
}
