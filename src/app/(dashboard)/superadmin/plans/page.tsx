"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CreditCard,
    Check,
    Users,
    BookOpen,
    Building2,
    Sparkles,
    Crown,
    Zap,
    Edit,
    Plus,
    Trash2,
    Loader2,
    X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

const planIcons: Record<string, typeof Zap> = {
    Starter: Zap,
    Professional: Sparkles,
    Enterprise: Crown,
};

const planColors: Record<string, { text: string; bg: string }> = {
    Starter: { text: "text-blue-500", bg: "bg-blue-500/10" },
    Professional: { text: "text-violet-500", bg: "bg-violet-500/10" },
    Enterprise: { text: "text-amber-500", bg: "bg-amber-500/10" },
};

interface PlanFormData {
    name: string;
    description: string;
    price: number;
    interval: "monthly" | "yearly";
    maxUsers: number;
    maxCourses: number;
    features: string[];
    isActive: boolean;
}

const defaultFormData: PlanFormData = {
    name: "",
    description: "",
    price: 0,
    interval: "monthly",
    maxUsers: 50,
    maxCourses: 10,
    features: [],
    isActive: true,
};

export default function SuperadminPlansPage() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Id<"subscriptionPlans"> | null>(null);
    const [deletingPlan, setDeletingPlan] = useState<Id<"subscriptionPlans"> | null>(null);
    const [formData, setFormData] = useState<PlanFormData>(defaultFormData);
    const [newFeature, setNewFeature] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Queries
    const plans = useQuery(api.plans.getAll);
    const organizations = useQuery(api.organizations.getAll);

    // Mutations
    const createPlan = useMutation(api.plans.create);
    const updatePlan = useMutation(api.plans.update);
    const removePlan = useMutation(api.plans.remove);
    const initializePlans = useMutation(api.plans.initializeDefaults);

    // Calculate stats
    const planDistribution = plans?.reduce((acc, plan) => {
        const orgsWithPlan = organizations?.filter(o => {
            // Match by name since organizations use plan name directly
            return o.plan?.toLowerCase() === plan.name.toLowerCase();
        }).length || 0;
        acc[plan._id] = orgsWithPlan;
        return acc;
    }, {} as Record<string, number>) || {};

    const totalRevenue = plans?.reduce((sum, plan) => {
        const count = planDistribution[plan._id] || 0;
        return sum + (plan.price / 100) * count;
    }, 0) || 0;

    const handleOpenCreate = () => {
        setEditingPlan(null);
        setFormData(defaultFormData);
        setDialogOpen(true);
    };

    const handleOpenEdit = (planId: Id<"subscriptionPlans">) => {
        const plan = plans?.find(p => p._id === planId);
        if (plan) {
            setEditingPlan(planId);
            setFormData({
                name: plan.name,
                description: plan.description,
                price: plan.price / 100, // Convert from cents
                interval: plan.interval,
                maxUsers: plan.maxUsers,
                maxCourses: plan.maxCourses,
                features: plan.features,
                isActive: plan.isActive,
            });
            setDialogOpen(true);
        }
    };

    const handleOpenDelete = (planId: Id<"subscriptionPlans">) => {
        setDeletingPlan(planId);
        setDeleteDialogOpen(true);
    };

    const handleAddFeature = () => {
        if (newFeature.trim()) {
            setFormData(prev => ({
                ...prev,
                features: [...prev.features, newFeature.trim()],
            }));
            setNewFeature("");
        }
    };

    const handleRemoveFeature = (index: number) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.description.trim()) {
            toast.error("Nome e descrição são obrigatórios");
            return;
        }

        setIsLoading(true);

        try {
            if (editingPlan) {
                await updatePlan({
                    planId: editingPlan,
                    name: formData.name,
                    description: formData.description,
                    price: Math.round(formData.price * 100), // Convert to cents
                    interval: formData.interval,
                    maxUsers: formData.maxUsers,
                    maxCourses: formData.maxCourses,
                    features: formData.features,
                    isActive: formData.isActive,
                });
                toast.success("Plano atualizado com sucesso!");
            } else {
                await createPlan({
                    name: formData.name,
                    description: formData.description,
                    price: Math.round(formData.price * 100), // Convert to cents
                    interval: formData.interval,
                    maxUsers: formData.maxUsers,
                    maxCourses: formData.maxCourses,
                    features: formData.features,
                    isActive: formData.isActive,
                });
                toast.success("Plano criado com sucesso!");
            }
            setDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Erro ao salvar plano");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingPlan) return;

        setIsLoading(true);
        try {
            await removePlan({ planId: deletingPlan });
            toast.success("Plano excluído com sucesso!");
            setDeleteDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Erro ao excluir plano");
        } finally {
            setIsLoading(false);
            setDeletingPlan(null);
        }
    };

    const handleInitialize = async () => {
        setIsLoading(true);
        try {
            const result = await initializePlans({});
            toast.success(result.message);
        } catch (error: any) {
            toast.error(error.message || "Erro ao inicializar planos");
        } finally {
            setIsLoading(false);
        }
    };

    const getPlanIcon = (name: string) => {
        return planIcons[name] || CreditCard;
    };

    const getPlanColors = (name: string) => {
        return planColors[name] || { text: "text-primary", bg: "bg-primary/10" };
    };

    if (plans === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Planos</h1>
                    <p className="text-muted-foreground">Gerencie os planos disponíveis para organizações</p>
                </div>
                <div className="flex gap-2">
                    {plans.length === 0 && (
                        <Button variant="outline" onClick={handleInitialize} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Inicializar Padrão
                        </Button>
                    )}
                    <Button onClick={handleOpenCreate} className="gap-2 gradient-bg border-0">
                        <Plus className="h-4 w-4" />
                        Novo Plano
                    </Button>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <CreditCard className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{plans.length}</p>
                                <p className="text-sm text-muted-foreground">Planos Ativos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{organizations?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Organizações</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">
                                    {plans.reduce((sum, p) => sum + (planDistribution[p._id] || 0), 0)}
                                </p>
                                <p className="text-sm text-muted-foreground">Total Assinantes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <CreditCard className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">R$ {totalRevenue.toLocaleString("pt-BR")}</p>
                                <p className="text-sm text-muted-foreground">Receita Mensal</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Plans Grid */}
            {plans.length === 0 ? (
                <motion.div variants={item}>
                    <Card>
                        <CardContent className="py-12 text-center">
                            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">Nenhum plano cadastrado</h3>
                            <p className="text-muted-foreground mb-4">
                                Clique em &quot;Inicializar Padrão&quot; para criar os planos básicos ou crie um novo plano.
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <motion.div variants={item} className="grid gap-6 md:grid-cols-3">
                    {plans.map((plan) => {
                        const Icon = getPlanIcon(plan.name);
                        const colors = getPlanColors(plan.name);

                        return (
                            <Card
                                key={plan._id}
                                className={`relative overflow-hidden hover:shadow-lg transition-all ${!plan.isActive ? "opacity-60" : ""
                                    }`}
                            >
                                {!plan.isActive && (
                                    <div className="absolute top-0 right-0">
                                        <Badge variant="secondary" className="rounded-none rounded-bl-lg">
                                            Inativo
                                        </Badge>
                                    </div>
                                )}

                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-12 w-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                                                <Icon className={`h-6 w-6 ${colors.text}`} />
                                            </div>
                                            <div>
                                                <CardTitle>{plan.name}</CardTitle>
                                                <CardDescription>{plan.description}</CardDescription>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold">
                                            R$ {(plan.price / 100).toLocaleString("pt-BR")}
                                        </span>
                                        <span className="text-muted-foreground">
                                            /{plan.interval === "monthly" ? "mês" : "ano"}
                                        </span>
                                    </div>

                                    <Separator />

                                    <div className="space-y-3">
                                        {plan.features.map((feature, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <div className="h-5 w-5 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-500">
                                                    <Check className="h-3 w-3" />
                                                </div>
                                                <span className="text-sm">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Separator />

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Organizações ativas</span>
                                            <Badge variant="secondary">{planDistribution[plan._id] || 0}</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Limite de usuários</span>
                                            <span>{plan.maxUsers >= 9999 ? "Ilimitado" : plan.maxUsers}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Limite de cursos</span>
                                            <span>{plan.maxCourses >= 9999 ? "Ilimitado" : plan.maxCourses}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 gap-2"
                                            onClick={() => handleOpenEdit(plan._id)}
                                        >
                                            <Edit className="h-4 w-4" />
                                            Editar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => handleOpenDelete(plan._id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </motion.div>
            )}

            {/* Organizations by Plan */}
            {plans.length > 0 && organizations && organizations.length > 0 && (
                <motion.div variants={item}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Organizações por Plano</CardTitle>
                            <CardDescription>Lista de organizações agrupadas por plano</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {plans.map((plan) => {
                                    const orgsInPlan = organizations?.filter(
                                        o => o.plan?.toLowerCase() === plan.name.toLowerCase()
                                    ) || [];
                                    const Icon = getPlanIcon(plan.name);
                                    const colors = getPlanColors(plan.name);

                                    return (
                                        <div key={plan._id}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Icon className={`h-5 w-5 ${colors.text}`} />
                                                <h3 className="font-medium">{plan.name}</h3>
                                                <Badge variant="secondary">{orgsInPlan.length}</Badge>
                                            </div>

                                            {orgsInPlan.length === 0 ? (
                                                <p className="text-sm text-muted-foreground pl-7">
                                                    Nenhuma organização neste plano
                                                </p>
                                            ) : (
                                                <div className="grid gap-2 pl-7">
                                                    {orgsInPlan.slice(0, 5).map((org) => (
                                                        <div
                                                            key={org._id}
                                                            className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                                <span className="text-sm">{org.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Users className="h-3 w-3" />
                                                                    {org.maxUsers}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <BookOpen className="h-3 w-3" />
                                                                    {org.maxCourses}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {orgsInPlan.length > 5 && (
                                                        <p className="text-sm text-muted-foreground">
                                                            +{orgsInPlan.length - 5} outras organizações
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            <Separator className="mt-4" />
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingPlan ? "Editar Plano" : "Novo Plano"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingPlan
                                ? "Atualize as informações do plano"
                                : "Preencha as informações para criar um novo plano"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Plano</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Ex: Professional"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="interval">Intervalo</Label>
                                <Select
                                    value={formData.interval}
                                    onValueChange={(value: "monthly" | "yearly") =>
                                        setFormData(prev => ({ ...prev, interval: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">Mensal</SelectItem>
                                        <SelectItem value="yearly">Anual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Descrição breve do plano..."
                                rows={2}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="price">Preço (R$)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxUsers">Máx. Usuários</Label>
                                <Input
                                    id="maxUsers"
                                    type="number"
                                    min="1"
                                    value={formData.maxUsers}
                                    onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: parseInt(e.target.value) || 1 }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxCourses">Máx. Cursos</Label>
                                <Input
                                    id="maxCourses"
                                    type="number"
                                    min="1"
                                    value={formData.maxCourses}
                                    onChange={(e) => setFormData(prev => ({ ...prev, maxCourses: parseInt(e.target.value) || 1 }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Recursos do Plano</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={newFeature}
                                    onChange={(e) => setNewFeature(e.target.value)}
                                    placeholder="Ex: Suporte 24/7"
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFeature())}
                                />
                                <Button type="button" onClick={handleAddFeature} variant="outline">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {formData.features.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.features.map((feature, index) => (
                                        <Badge key={index} variant="secondary" className="gap-1 pr-1">
                                            {feature}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFeature(index)}
                                                className="ml-1 hover:bg-muted rounded-full p-0.5"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="space-y-0.5">
                                <Label htmlFor="isActive">Plano Ativo</Label>
                                <p className="text-xs text-muted-foreground">
                                    Planos inativos não ficam disponíveis para novas assinaturas
                                </p>
                            </div>
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {editingPlan ? "Salvar" : "Criar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Plano</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.
                            Se houver organizações utilizando este plano, a exclusão não será permitida.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
}
