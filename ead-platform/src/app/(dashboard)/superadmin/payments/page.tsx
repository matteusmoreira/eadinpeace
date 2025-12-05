"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    CreditCard,
    DollarSign,
    TrendingUp,
    Building2,
    Plus,
    Edit2,
    Trash2,
    Check,
    X,
    Loader2,
    Receipt,
    Sparkles,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function PaymentsPage() {
    const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
    const [newPlan, setNewPlan] = useState({
        name: "",
        description: "",
        price: 0,
        interval: "monthly" as "monthly" | "yearly",
        maxUsers: 10,
        maxCourses: 5,
        features: "",
        isActive: true,
    });

    // Queries
    const plans = useQuery(api.payments.getPlans);
    const transactions = useQuery(api.payments.getAllTransactions, { limit: 20 });
    const financialSummary = useQuery(api.payments.getFinancialSummary);

    // Mutations
    const createPlan = useMutation(api.payments.createPlan);

    const isLoading = plans === undefined || transactions === undefined || financialSummary === undefined;

    const handleCreatePlan = async () => {
        try {
            await createPlan({
                name: newPlan.name,
                description: newPlan.description,
                price: newPlan.price * 100, // Converter para centavos
                interval: newPlan.interval,
                maxUsers: newPlan.maxUsers,
                maxCourses: newPlan.maxCourses,
                features: newPlan.features.split("\n").filter(f => f.trim()),
                isActive: newPlan.isActive,
            });
            setIsCreatePlanOpen(false);
            setNewPlan({
                name: "",
                description: "",
                price: 0,
                interval: "monthly",
                maxUsers: 10,
                maxCourses: 5,
                features: "",
                isActive: true,
            });
        } catch (error) {
            console.error("Error creating plan:", error);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(amount / 100);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                        <CreditCard className="h-8 w-8 text-primary" />
                        Pagamentos
                    </h1>
                    <p className="text-muted-foreground">
                        Gerencie planos de assinatura e transações
                    </p>
                </div>
                <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
                    <DialogTrigger asChild>
                        <Button className="gradient-bg border-0">
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Plano
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Criar Novo Plano</DialogTitle>
                            <DialogDescription>
                                Configure os detalhes do plano de assinatura
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Plano</Label>
                                <Input
                                    id="name"
                                    placeholder="Ex: Professional"
                                    value={newPlan.name}
                                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Descreva os benefícios do plano"
                                    value={newPlan.description}
                                    onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Preço (R$)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={newPlan.price}
                                        onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="interval">Intervalo</Label>
                                    <select
                                        id="interval"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={newPlan.interval}
                                        onChange={(e) => setNewPlan({ ...newPlan, interval: e.target.value as "monthly" | "yearly" })}
                                    >
                                        <option value="monthly">Mensal</option>
                                        <option value="yearly">Anual</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="maxUsers">Máx. Usuários</Label>
                                    <Input
                                        id="maxUsers"
                                        type="number"
                                        min="1"
                                        value={newPlan.maxUsers}
                                        onChange={(e) => setNewPlan({ ...newPlan, maxUsers: parseInt(e.target.value) || 1 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxCourses">Máx. Cursos</Label>
                                    <Input
                                        id="maxCourses"
                                        type="number"
                                        min="1"
                                        value={newPlan.maxCourses}
                                        onChange={(e) => setNewPlan({ ...newPlan, maxCourses: parseInt(e.target.value) || 1 })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="features">Funcionalidades (uma por linha)</Label>
                                <Textarea
                                    id="features"
                                    placeholder="Cursos ilimitados&#10;Suporte prioritário&#10;Relatórios avançados"
                                    value={newPlan.features}
                                    onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
                                    rows={4}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="isActive">Plano ativo</Label>
                                <Switch
                                    id="isActive"
                                    checked={newPlan.isActive}
                                    onCheckedChange={(checked) => setNewPlan({ ...newPlan, isActive: checked })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreatePlanOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleCreatePlan} disabled={!newPlan.name || newPlan.price <= 0}>
                                Criar Plano
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </motion.div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Receita Total</p>
                                        <p className="text-3xl font-bold text-emerald-500">
                                            {formatCurrency(financialSummary?.totalRevenue || 0)}
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                        <DollarSign className="h-6 w-6 text-emerald-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
                                        <p className="text-3xl font-bold">
                                            {formatCurrency(financialSummary?.recentRevenue || 0)}
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                        <TrendingUp className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
                                        <p className="text-3xl font-bold">{financialSummary?.activeSubscriptions || 0}</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                                        <Building2 className="h-6 w-6 text-violet-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Total Transações</p>
                                        <p className="text-3xl font-bold">{financialSummary?.totalTransactions || 0}</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                        <Receipt className="h-6 w-6 text-amber-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <Tabs defaultValue="plans" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
                            <TabsTrigger value="plans">Planos</TabsTrigger>
                            <TabsTrigger value="transactions">Transações</TabsTrigger>
                        </TabsList>

                        {/* Planos */}
                        <TabsContent value="plans" className="space-y-6">
                            <motion.div variants={item} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {plans && plans.length > 0 ? (
                                    plans.map((plan) => (
                                        <Card key={plan._id} className={`relative overflow-hidden ${!plan.isActive ? 'opacity-60' : ''}`}>
                                            {plan.isActive && (
                                                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/20 to-transparent" />
                                            )}
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <CardTitle className="flex items-center gap-2">
                                                            {plan.name}
                                                            {plan.isActive ? (
                                                                <Badge className="bg-emerald-500">Ativo</Badge>
                                                            ) : (
                                                                <Badge variant="secondary">Inativo</Badge>
                                                            )}
                                                        </CardTitle>
                                                        <CardDescription className="mt-1">
                                                            {plan.description}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div>
                                                    <span className="text-3xl font-bold">
                                                        {formatCurrency(plan.price)}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        /{plan.interval === "monthly" ? "mês" : "ano"}
                                                    </span>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Check className="h-4 w-4 text-emerald-500" />
                                                        <span>Até {plan.maxUsers} usuários</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Check className="h-4 w-4 text-emerald-500" />
                                                        <span>Até {plan.maxCourses} cursos</span>
                                                    </div>
                                                    {plan.features.map((feature, index) => (
                                                        <div key={index} className="flex items-center gap-2">
                                                            <Check className="h-4 w-4 text-emerald-500" />
                                                            <span>{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2 pt-4">
                                                    <Button variant="outline" size="sm" className="flex-1">
                                                        <Edit2 className="h-4 w-4 mr-1" />
                                                        Editar
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <Card className="col-span-full">
                                        <CardContent className="text-center py-12">
                                            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                            <p className="text-lg font-medium">Nenhum plano criado</p>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Crie seu primeiro plano de assinatura
                                            </p>
                                            <Button onClick={() => setIsCreatePlanOpen(true)}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Criar Plano
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}
                            </motion.div>
                        </TabsContent>

                        {/* Transações */}
                        <TabsContent value="transactions" className="space-y-6">
                            <motion.div variants={item}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Histórico de Transações</CardTitle>
                                        <CardDescription>Últimas transações realizadas</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {transactions && transactions.length > 0 ? (
                                            <div className="rounded-lg border overflow-hidden">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="bg-muted/50">
                                                                <th className="text-left p-4 font-medium">Organização</th>
                                                                <th className="text-left p-4 font-medium">Descrição</th>
                                                                <th className="text-left p-4 font-medium">Valor</th>
                                                                <th className="text-left p-4 font-medium">Status</th>
                                                                <th className="text-left p-4 font-medium">Data</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y">
                                                            {transactions.map((transaction) => (
                                                                <tr key={transaction._id} className="hover:bg-muted/30">
                                                                    <td className="p-4">
                                                                        <span className="font-medium">{transaction.organizationName}</span>
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <span className="text-sm text-muted-foreground">
                                                                            {transaction.description}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <span className={`font-medium ${transaction.type === "refund" ? "text-red-500" : "text-emerald-500"}`}>
                                                                            {transaction.type === "refund" ? "-" : "+"}{formatCurrency(transaction.amount)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-4">
                                                                        {transaction.status === "completed" ? (
                                                                            <Badge className="bg-emerald-500">Concluído</Badge>
                                                                        ) : transaction.status === "pending" ? (
                                                                            <Badge variant="secondary">Pendente</Badge>
                                                                        ) : (
                                                                            <Badge variant="destructive">Falhou</Badge>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <span className="text-sm text-muted-foreground">
                                                                            {formatDate(transaction.createdAt)}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-muted-foreground">
                                                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                <p className="text-lg font-medium">Nenhuma transação</p>
                                                <p className="text-sm">As transações aparecerão aqui</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Revenue Trend Chart */}
                            {financialSummary?.revenueTrend && financialSummary.revenueTrend.length > 0 && (
                                <motion.div variants={item}>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Tendência de Receita</CardTitle>
                                            <CardDescription>Últimos 6 meses</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-end gap-2 h-40">
                                                {financialSummary.revenueTrend.map((item) => {
                                                    const maxAmount = Math.max(...financialSummary.revenueTrend.map(i => i.amount));
                                                    const height = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                                                    return (
                                                        <div
                                                            key={item.month}
                                                            className="flex-1 flex flex-col items-center gap-1"
                                                        >
                                                            <span className="text-xs font-medium">
                                                                {formatCurrency(item.amount)}
                                                            </span>
                                                            <div
                                                                className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-md transition-all duration-500"
                                                                style={{ height: `${Math.max(height, 5)}%` }}
                                                            />
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(item.month + "-01").toLocaleDateString("pt-BR", { month: "short" })}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </motion.div>
    );
}
