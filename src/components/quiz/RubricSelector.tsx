"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { FileText, Star, ChevronDown, X } from "lucide-react";

interface CriterionLevel {
    name: string;
    points: number;
    description: string;
}

interface Criterion {
    name: string;
    description: string;
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
    const defaultRubric = rubrics?.find((r) => r.isDefault);

    const handleSelect = (rubricId: string | undefined) => {
        onSelect(rubricId);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Rubrica de Avaliação
            </label>

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
          w-full flex items-center justify-between px-4 py-3 border rounded-lg text-left
          ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white hover:border-indigo-300 cursor-pointer"}
          ${isOpen ? "border-indigo-500 ring-2 ring-indigo-200" : "border-gray-300"}
        `}
            >
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                        {selectedRubric ? (
                            <>
                                <p className="text-gray-900 font-medium">{selectedRubric.name}</p>
                                <p className="text-xs text-gray-500">
                                    {selectedRubric.criteria.length} critério(s)
                                </p>
                            </>
                        ) : (
                            <p className="text-gray-500">Selecionar rubrica (opcional)</p>
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
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    )}
                    <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""
                            }`}
                    />
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 max-h-60 overflow-y-auto">
                    {!rubrics || rubrics.length === 0 ? (
                        <div className="px-4 py-3 text-center text-gray-500 text-sm">
                            Nenhuma rubrica disponível
                        </div>
                    ) : (
                        <>
                            {/* Opção sem rubrica */}
                            <button
                                onClick={() => handleSelect(undefined)}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${!selectedRubricId ? "bg-indigo-50" : ""
                                    }`}
                            >
                                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                    {!selectedRubricId && (
                                        <div className="w-3 h-3 rounded-full bg-indigo-600" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-gray-700 font-medium">Sem rubrica</p>
                                    <p className="text-xs text-gray-500">Correção livre</p>
                                </div>
                            </button>

                            <div className="border-t my-1" />

                            {/* Lista de rubricas */}
                            {rubrics.map((rubric) => (
                                <button
                                    key={rubric._id}
                                    onClick={() => handleSelect(rubric._id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${selectedRubricId === rubric._id ? "bg-indigo-50" : ""
                                        }`}
                                >
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                        {selectedRubricId === rubric._id && (
                                            <div className="w-3 h-3 rounded-full bg-indigo-600" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-gray-900 font-medium">{rubric.name}</p>
                                            {rubric.isDefault && (
                                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                                                    <Star className="w-3 h-3" />
                                                    Padrão
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {rubric.criteria.map((c: any) => c.name || "Critério").join(", ")}
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
                <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-2">Critérios:</p>
                    <div className="space-y-2">
                        {selectedRubric.criteria.map((criterion: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{criterion.name || `Critério ${index + 1}`}</span>
                                <div className="flex gap-1">
                                    {criterion.levels.map((level: any, levelIndex: number) => (
                                        <span
                                            key={levelIndex}
                                            className="px-1.5 py-0.5 bg-white rounded text-xs text-gray-500 border"
                                        >
                                            {level.points}%
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
