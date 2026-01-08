"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { FileText, Star, ChevronDown, X, Check } from "lucide-react";

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

interface RubricSelectorProps {
    organizationId: string;
    selectedRubricId?: string;
    onSelect: (rubricId: string | undefined) => void;
    disabled?: boolean;
}

export function RubricSelector({
    organizationId,
    selectedRubricId,
    onSelect,
    disabled = false,
}: RubricSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const rubrics = useQuery(
        api.gradingRubrics.getByOrganization,
        organizationId ? { organizationId: organizationId as any } : "skip"
    );

    const selectedRubric = rubrics?.find((r) => r._id === selectedRubricId);

    const handleSelect = (rubricId: string | undefined) => {
        onSelect(rubricId);
        setIsOpen(false);
    };

    // Calcular total de pontos máximos
    const getTotalMaxPoints = (criteria: Criterion[]) => {
        return criteria.reduce((sum, c) => sum + c.maxPoints, 0);
    };

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rubrica de Avaliação
            </label>

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between px-4 py-3 border rounded-lg text-left transition-all
                    ${disabled
                        ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                        : "bg-white dark:bg-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 cursor-pointer"
                    }
                    ${isOpen
                        ? "border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800"
                        : "border-gray-300 dark:border-gray-600"
                    }
                `}
            >
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                        {selectedRubric ? (
                            <>
                                <p className="text-gray-900 dark:text-white font-medium">{selectedRubric.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {selectedRubric.criteria.length} critério(s) • {getTotalMaxPoints(selectedRubric.criteria as Criterion[])} pts total
                                </p>
                            </>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">Selecionar rubrica (opcional)</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {selectedRubricId && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(undefined);
                            }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    )}
                    <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 max-h-80 overflow-y-auto">
                    {!rubrics || rubrics.length === 0 ? (
                        <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                            Nenhuma rubrica disponível
                        </div>
                    ) : (
                        <>
                            {/* Opção sem rubrica */}
                            <button
                                onClick={() => handleSelect(undefined)}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${!selectedRubricId ? "bg-indigo-50 dark:bg-indigo-900/30" : ""
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!selectedRubricId
                                        ? "border-indigo-600 bg-indigo-600"
                                        : "border-gray-300 dark:border-gray-600"
                                    }`}>
                                    {!selectedRubricId && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300 font-medium">Sem rubrica</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Correção livre</p>
                                </div>
                            </button>

                            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                            {/* Lista de rubricas */}
                            {rubrics.map((rubric) => (
                                <button
                                    key={rubric._id}
                                    onClick={() => handleSelect(rubric._id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${selectedRubricId === rubric._id ? "bg-indigo-50 dark:bg-indigo-900/30" : ""
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedRubricId === rubric._id
                                            ? "border-indigo-600 bg-indigo-600"
                                            : "border-gray-300 dark:border-gray-600"
                                        }`}>
                                        {selectedRubricId === rubric._id && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-gray-900 dark:text-white font-medium">{rubric.name}</p>
                                            {rubric.isDefault && (
                                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-xs">
                                                    <Star className="w-3 h-3" />
                                                    Padrão
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {(rubric.criteria as Criterion[]).map((c) => c.name || "Critério").join(", ")}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </>
                    )}
                </div>
            )}

            {/* Preview da rubrica selecionada */}
            {selectedRubric && (
                <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Critérios:</p>
                    <div className="space-y-3">
                        {(selectedRubric.criteria as Criterion[]).map((criterion, index) => (
                            <div key={index} className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {criterion.name || `Critério ${index + 1}`}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        máx. {criterion.maxPoints} pts
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {criterion.levels.map((level, levelIndex) => (
                                        <span
                                            key={levelIndex}
                                            className="px-2 py-1 bg-white dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                                            title={level.description}
                                        >
                                            {level.label}: {Math.round((level.points / 100) * criterion.maxPoints)} pts
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Componente auxiliar para exibir critérios durante correção
interface RubricGradingHelperProps {
    rubric: Rubric;
    criterionIndex: number;
    currentPoints: number;
    maxPoints: number;
    onSelectLevel: (points: number) => void;
}

export function RubricGradingHelper({
    rubric,
    criterionIndex,
    currentPoints,
    maxPoints,
    onSelectLevel,
}: RubricGradingHelperProps) {
    const criterion = rubric.criteria[criterionIndex];
    if (!criterion) return null;

    return (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                    {criterion.name}
                </h4>
                <span className="text-xs text-indigo-600 dark:text-indigo-400">
                    {criterion.maxPoints} pts máx.
                </span>
            </div>
            {criterion.description && (
                <p className="text-xs text-indigo-700 dark:text-indigo-400 mb-3">{criterion.description}</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {criterion.levels.map((level, levelIndex) => {
                    const levelPoints = Math.round((level.points / 100) * criterion.maxPoints);
                    const isSelected = currentPoints === levelPoints;

                    return (
                        <button
                            key={levelIndex}
                            onClick={() => onSelectLevel(levelPoints)}
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
    );
}
