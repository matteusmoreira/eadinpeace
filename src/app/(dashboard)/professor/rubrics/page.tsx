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
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

interface Criterion {
    name: string;
    description: string;
    maxPoints: number;
    levels: {
        label: string;
        points: number;
        description: string;
    }[];
}

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
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        criteria: [
            {
                name: "",
                description: "",
                maxPoints: 10,
                levels: [
                    { label: "Excelente", points: 100, description: "" },
                    { label: "Bom", points: 75, description: "" },
                    { label: "Regular", points: 50, description: "" },
                    { label: "Insuficiente", points: 25, description: "" },
                ],
            },
        ] as Criterion[],
    });

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            criteria: [
                {
                    name: "",
                    description: "",
                    maxPoints: 10,
                    levels: [
                        { label: "Excelente", points: 100, description: "" },
                        { label: "Bom", points: 75, description: "" },
                        { label: "Regular", points: 50, description: "" },
                        { label: "Insuficiente", points: 25, description: "" },
                    ],
                },
            ],
        });
        setIsCreating(false);
        setEditingId(null);
    };

    const handleSave = async () => {
        if (!currentUser?.organizationId) return;
        if (!formData.name.trim()) {
            toast.error("Digite o nome da rubrica");
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
    };

    const handleDelete = async (rubricId: string) => {
        if (!confirm("Tem certeza que deseja excluir esta rubrica?")) return;
        try {
            await removeRubric({ rubricId: rubricId as any });
            toast.success("Rubrica excluída!");
        } catch (error) {
            toast.error("Erro ao excluir rubrica");
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
        setFormData({
            ...formData,
            criteria: [
                ...formData.criteria,
                {
                    name: "",
                    description: "",
                    maxPoints: 10,
                    levels: [
                        { label: "Excelente", points: 100, description: "" },
                        { label: "Bom", points: 75, description: "" },
                        { label: "Regular", points: 50, description: "" },
                        { label: "Insuficiente", points: 25, description: "" },
                    ],
                },
            ],
        });
    };

    const removeCriterion = (index: number) => {
        const newCriteria = formData.criteria.filter((_, i) => i !== index);
        setFormData({ ...formData, criteria: newCriteria });
    };

    const updateCriterion = (index: number, updates: Partial<Criterion>) => {
        const newCriteria = [...formData.criteria];
        newCriteria[index] = { ...newCriteria[index], ...updates };
        setFormData({ ...formData, criteria: newCriteria });
    };

    if (!currentUser || !rubrics) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            Rubricas de Avaliação
                        </h1>
                        <p className="text-gray-600">
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
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {editingId ? "Editar Rubrica" : "Nova Rubrica"}
                        </h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nome *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Avaliação de Texto Dissertativo"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Descrição
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Descrição opcional"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Criteria */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">Critérios</label>
                                    <button
                                        onClick={addCriterion}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Adicionar Critério
                                    </button>
                                </div>

                                {formData.criteria.map((criterion, index) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-lg mb-3">
                                        <div className="flex items-center justify-between mb-3">
                                            <input
                                                type="text"
                                                value={criterion.name}
                                                onChange={(e) => updateCriterion(index, { name: e.target.value })}
                                                placeholder="Nome do critério"
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg mr-2"
                                            />
                                            {formData.criteria.length > 1 && (
                                                <button
                                                    onClick={() => removeCriterion(index)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {criterion.levels.map((level, levelIndex) => (
                                                <div key={levelIndex} className="p-2 bg-white rounded border">
                                                    <p className="text-xs font-medium text-gray-700">{level.label}</p>
                                                    <p className="text-lg font-bold text-indigo-600">{level.points}%</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                            <button
                                onClick={resetForm}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
                        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Nenhuma rubrica criada
                            </h3>
                            <p className="text-gray-600 mb-6">
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
                                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-bold text-gray-900">{rubric.name}</h3>
                                            {rubric.isDefault && (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium flex items-center gap-1">
                                                    <Star className="w-3 h-3" />
                                                    Padrão
                                                </span>
                                            )}
                                        </div>
                                        {rubric.description && (
                                            <p className="text-gray-600 text-sm mb-3">{rubric.description}</p>
                                        )}
                                        <div className="flex gap-2">
                                            {rubric.criteria.map((c: any, i: number) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                                >
                                                    {c.name || `Critério ${i + 1}`}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!rubric.isDefault && (
                                            <button
                                                onClick={() => handleSetDefault(rubric._id)}
                                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                                                title="Definir como padrão"
                                            >
                                                <Star className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEdit(rubric)}
                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(rubric._id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
