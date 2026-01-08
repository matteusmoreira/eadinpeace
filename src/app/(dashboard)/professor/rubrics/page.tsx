"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import {
    Plus,
    Save,
    Trash2,
    Star,
    Edit,
    FileText,
    X,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

interface Level {
    label: string;
    points: number;
    description: string;
}

interface Criterion {
    name: string;
    description: string;
    maxPoints: number;
    levels: Level[];
}

const DEFAULT_LEVELS: Level[] = [
    { label: "Excelente", points: 100, description: "Desempenho excepcional" },
    { label: "Bom", points: 75, description: "Desempenho acima da média" },
    { label: "Regular", points: 50, description: "Desempenho na média" },
    { label: "Insuficiente", points: 25, description: "Desempenho abaixo do esperado" },
];

const createDefaultCriterion = (): Criterion => ({
    name: "",
    description: "",
    maxPoints: 10,
    levels: DEFAULT_LEVELS.map(l => ({ ...l })),
});

export default function RubricsPage() {
    const { user } = useUser();
    const currentUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
    const rubrics = useQuery(
        api.gradingRubrics.getByOrganization,
        currentUser?.organizationId
            ? { organizationId: currentUser.organizationId }
            : "skip"
    );

    const createRubric = useMutation(api.gradingRubrics.create);
    const updateRubric = useMutation(api.gradingRubrics.update);
    const removeRubric = useMutation(api.gradingRubrics.remove);
    const setDefault = useMutation(api.gradingRubrics.setAsDefault);

    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedCriteria, setExpandedCriteria] = useState<number[]>([0]);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        criteria: [createDefaultCriterion()] as Criterion[],
    });

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            criteria: [createDefaultCriterion()],
        });
        setIsCreating(false);
        setEditingId(null);
        setExpandedCriteria([0]);
    };

    const handleSave = async () => {
        if (!currentUser?.organizationId) return;
        if (!formData.name.trim()) {
            toast.error("Digite o nome da rubrica");
            return;
        }

        // Validar se todos os critérios têm nome
        const invalidCriteria = formData.criteria.find(c => !c.name.trim());
        if (invalidCriteria) {
            toast.error("Todos os critérios precisam ter um nome");
            return;
        }

        try {
            if (editingId) {
                await updateRubric({
                    rubricId: editingId as any,
                    name: formData.name,
                    description: formData.description,
                    criteria: formData.criteria,
                });
                toast.success("Rubrica atualizada!");
            } else {
                await createRubric({
                    organizationId: currentUser.organizationId,
                    name: formData.name,
                    description: formData.description,
                    criteria: formData.criteria,
                    isDefault: false,
                });
                toast.success("Rubrica criada!");
            }
            resetForm();
        } catch (error) {
            toast.error("Erro ao salvar rubrica");
            console.error(error);
        }
    };

    const handleEdit = (rubric: any) => {
        setFormData({
            name: rubric.name,
            description: rubric.description || "",
            criteria: rubric.criteria,
        });
        setEditingId(rubric._id);
        setIsCreating(true);
        setExpandedCriteria([0]);
    };

    const handleDelete = async (rubricId: string) => {
        if (!confirm("Tem certeza que deseja excluir esta rubrica?")) return;
        try {
            await removeRubric({ rubricId: rubricId as any });
            toast.success("Rubrica excluída!");
        } catch (error: any) {
            if (error?.message?.includes("padrão")) {
                toast.error("Não é possível excluir a rubrica padrão. Defina outra rubrica como padrão antes.");
            } else {
                toast.error("Erro ao excluir rubrica");
            }
        }
    };

    const handleSetDefault = async (rubricId: string) => {
        try {
            await setDefault({ rubricId: rubricId as any });
            toast.success("Rubrica definida como padrão!");
        } catch (error) {
            toast.error("Erro ao definir como padrão");
        }
    };

    const addCriterion = () => {
        const newIndex = formData.criteria.length;
        setFormData({
            ...formData,
            criteria: [...formData.criteria, createDefaultCriterion()],
        });
        setExpandedCriteria([...expandedCriteria, newIndex]);
    };

    const removeCriterion = (index: number) => {
        const newCriteria = formData.criteria.filter((_, i) => i !== index);
        setFormData({ ...formData, criteria: newCriteria });
        setExpandedCriteria(expandedCriteria.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    };

    const updateCriterion = (index: number, updates: Partial<Criterion>) => {
        const newCriteria = [...formData.criteria];
        newCriteria[index] = { ...newCriteria[index], ...updates };
        setFormData({ ...formData, criteria: newCriteria });
    };

    const updateLevel = (criterionIndex: number, levelIndex: number, updates: Partial<Level>) => {
        const newCriteria = [...formData.criteria];
        const newLevels = [...newCriteria[criterionIndex].levels];
        newLevels[levelIndex] = { ...newLevels[levelIndex], ...updates };
        newCriteria[criterionIndex] = { ...newCriteria[criterionIndex], levels: newLevels };
        setFormData({ ...formData, criteria: newCriteria });
    };

    const addLevel = (criterionIndex: number) => {
        const newCriteria = [...formData.criteria];
        newCriteria[criterionIndex].levels.push({
            label: "Novo Nível",
            points: 0,
            description: "",
        });
        setFormData({ ...formData, criteria: newCriteria });
    };

    const removeLevel = (criterionIndex: number, levelIndex: number) => {
        const newCriteria = [...formData.criteria];
        newCriteria[criterionIndex].levels = newCriteria[criterionIndex].levels.filter((_, i) => i !== levelIndex);
        setFormData({ ...formData, criteria: newCriteria });
    };

    const toggleCriterion = (index: number) => {
        if (expandedCriteria.includes(index)) {
            setExpandedCriteria(expandedCriteria.filter(i => i !== index));
        } else {
            setExpandedCriteria([...expandedCriteria, index]);
        }
    };

    if (!currentUser || !rubrics) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            Rubricas de Avaliação
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Crie critérios padronizados para correção manual
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        Nova Rubrica
                    </button>
                </div>

                {/* Form */}
                {isCreating && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingId ? "Editar Rubrica" : "Nova Rubrica"}
                            </h2>
                            <button
                                onClick={resetForm}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Nome e Descrição */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nome da Rubrica *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Avaliação de Texto Dissertativo"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Descrição
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Descrição opcional da rubrica"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                    />
                                </div>
                            </div>

                            {/* Critérios */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Critérios de Avaliação
                                    </label>
                                    <button
                                        onClick={addCriterion}
                                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Adicionar Critério
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {formData.criteria.map((criterion, criterionIndex) => (
                                        <div
                                            key={criterionIndex}
                                            className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
                                        >
                                            {/* Criterion Header */}
                                            <div
                                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer"
                                                onClick={() => toggleCriterion(criterionIndex)}
                                            >
                                                <div className="flex items-center gap-3 flex-1">
                                                    <span className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold">
                                                        {criterionIndex + 1}
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={criterion.name}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            updateCriterion(criterionIndex, { name: e.target.value });
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        placeholder="Nome do critério (ex: Clareza do Texto)"
                                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={criterion.maxPoints}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            updateCriterion(criterionIndex, { maxPoints: Number(e.target.value) });
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center focus:ring-2 focus:ring-indigo-500"
                                                        min="1"
                                                    />
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">pts</span>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    {formData.criteria.length > 1 && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeCriterion(criterionIndex);
                                                            }}
                                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {expandedCriteria.includes(criterionIndex) ? (
                                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Criterion Details */}
                                            {expandedCriteria.includes(criterionIndex) && (
                                                <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
                                                    {/* Descrição do critério */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Descrição do Critério
                                                        </label>
                                                        <textarea
                                                            value={criterion.description}
                                                            onChange={(e) => updateCriterion(criterionIndex, { description: e.target.value })}
                                                            placeholder="Descreva o que este critério avalia..."
                                                            rows={2}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 resize-none"
                                                        />
                                                    </div>

                                                    {/* Níveis */}
                                                    <div>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Níveis de Desempenho
                                                            </label>
                                                            <button
                                                                onClick={() => addLevel(criterionIndex)}
                                                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                                Adicionar Nível
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {criterion.levels.map((level, levelIndex) => (
                                                                <div
                                                                    key={levelIndex}
                                                                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                                                                >
                                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                        <input
                                                                            type="text"
                                                                            value={level.label}
                                                                            onChange={(e) => updateLevel(criterionIndex, levelIndex, { label: e.target.value })}
                                                                            placeholder="Nome (ex: Excelente)"
                                                                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                                                                        />
                                                                        <div className="flex items-center gap-2">
                                                                            <input
                                                                                type="number"
                                                                                value={level.points}
                                                                                onChange={(e) => updateLevel(criterionIndex, levelIndex, { points: Number(e.target.value) })}
                                                                                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-sm"
                                                                                min="0"
                                                                                max="100"
                                                                            />
                                                                            <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            value={level.description}
                                                                            onChange={(e) => updateLevel(criterionIndex, levelIndex, { description: e.target.value })}
                                                                            placeholder="Descrição do nível"
                                                                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                                                                        />
                                                                    </div>
                                                                    {criterion.levels.length > 2 && (
                                                                        <button
                                                                            onClick={() => removeLevel(criterionIndex, levelIndex)}
                                                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={resetForm}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                <Save className="w-4 h-4" />
                                Salvar
                            </button>
                        </div>
                    </div>
                )}

                {/* Lista de Rubricas */}
                <div className="grid gap-4">
                    {rubrics.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
                            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Nenhuma rubrica criada
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Crie sua primeira rubrica para padronizar correções
                            </p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                <Plus className="w-5 h-5" />
                                Criar Primeira Rubrica
                            </button>
                        </div>
                    ) : (
                        rubrics.map((rubric) => (
                            <div
                                key={rubric._id}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{rubric.name}</h3>
                                            {rubric.isDefault && (
                                                <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-xs font-medium flex items-center gap-1">
                                                    <Star className="w-3 h-3" />
                                                    Padrão
                                                </span>
                                            )}
                                        </div>
                                        {rubric.description && (
                                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{rubric.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            {rubric.criteria.map((c: any, i: number) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                                                >
                                                    {c.name || `Critério ${i + 1}`} ({c.maxPoints} pts)
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!rubric.isDefault && (
                                            <button
                                                onClick={() => handleSetDefault(rubric._id)}
                                                className="p-2 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg"
                                                title="Definir como padrão"
                                            >
                                                <Star className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEdit(rubric)}
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(rubric._id)}
                                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
