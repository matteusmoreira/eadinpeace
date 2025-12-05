"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Save,
    Loader2,
    User,
    Mail,
    Building2,
    Shield,
    UserCog,
    GraduationCap,
    Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";

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

const roleConfig = {
    superadmin: {
        label: "Super Admin",
        color: "gradient-bg text-white border-0",
        icon: Shield,
        description: "Acesso total ao sistema",
    },
    admin: {
        label: "Administrador",
        color: "bg-primary/10 text-primary",
        icon: UserCog,
        description: "Gerencia uma organização",
    },
    professor: {
        label: "Professor",
        color: "bg-amber-500/10 text-amber-600",
        icon: GraduationCap,
        description: "Cria e gerencia cursos",
    },
    student: {
        label: "Aluno",
        color: "bg-slate-100 text-slate-700",
        icon: Users,
        description: "Acessa e estuda cursos",
    },
};

type UserRole = "superadmin" | "admin" | "professor" | "student";

export default function EditUserPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as Id<"users">;

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        role: "student" as UserRole,
        organizationId: "" as string,
        isActive: true,
    });

    // Queries
    const user = useQuery(api.users.getById, { userId });
    const organizations = useQuery(api.organizations.getAll);
    const updateUser = useMutation(api.users.update);

    // Populate form when user data loads
    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                role: user.role as UserRole,
                organizationId: user.organizationId || "",
                isActive: user.isActive ?? true,
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            toast.error("Nome e sobrenome são obrigatórios");
            return;
        }

        setIsLoading(true);

        try {
            await updateUser({
                userId,
                firstName: formData.firstName,
                lastName: formData.lastName,
                role: formData.role,
                organizationId: formData.organizationId
                    ? (formData.organizationId as Id<"organizations">)
                    : undefined,
                isActive: formData.isActive,
            });

            toast.success("Usuário atualizado com sucesso!");
            router.push("/superadmin/users");
        } catch (error: any) {
            console.error("Error updating user:", error);
            toast.error(error.message || "Erro ao atualizar usuário");
        } finally {
            setIsLoading(false);
        }
    };

    if (user === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (user === null) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <User className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Usuário não encontrado</h2>
                <Link href="/superadmin/users">
                    <Button variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={item} className="flex items-center gap-4">
                <Link href="/superadmin/users">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Editar Usuário</h1>
                    <p className="text-muted-foreground">
                        Atualize as informações de {user.firstName} {user.lastName}
                    </p>
                </div>
            </motion.div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 md:grid-cols-2">
                    {/* User Info Card */}
                    <motion.div variants={item}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Informações Pessoais
                                </CardTitle>
                                <CardDescription>
                                    Dados básicos do usuário
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">Nome</Label>
                                        <Input
                                            id="firstName"
                                            value={formData.firstName}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    firstName: e.target.value,
                                                }))
                                            }
                                            placeholder="Nome"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Sobrenome</Label>
                                        <Input
                                            id="lastName"
                                            value={formData.lastName}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    lastName: e.target.value,
                                                }))
                                            }
                                            placeholder="Sobrenome"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            value={user.email}
                                            disabled
                                            className="pl-9 bg-muted"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        O email não pode ser alterado
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="isActive">Usuário Ativo</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Usuários inativos não podem acessar o sistema
                                        </p>
                                    </div>
                                    <Switch
                                        id="isActive"
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                isActive: checked,
                                            }))
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Role & Organization Card */}
                    <motion.div variants={item}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Função e Organização
                                </CardTitle>
                                <CardDescription>
                                    Permissões e vínculo organizacional
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="role">Função</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(value: UserRole) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                role: value,
                                                // Clear organization if superadmin
                                                organizationId:
                                                    value === "superadmin" ? "" : prev.organizationId,
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a função" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(roleConfig).map(([key, config]) => (
                                                <SelectItem key={key} value={key}>
                                                    <div className="flex items-center gap-2">
                                                        <config.icon className="h-4 w-4" />
                                                        {config.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        {roleConfig[formData.role].description}
                                    </p>
                                </div>

                                {formData.role !== "superadmin" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="organization">Organização</Label>
                                        <Select
                                            value={formData.organizationId}
                                            onValueChange={(value) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    organizationId: value,
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a organização" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {organizations?.map((org) => (
                                                    <SelectItem key={org._id} value={org._id}>
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-4 w-4" />
                                                            {org.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Organização à qual o usuário pertence
                                        </p>
                                    </div>
                                )}

                                {formData.role === "superadmin" && (
                                    <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                        <p className="text-sm text-amber-600 dark:text-amber-400">
                                            <strong>Atenção:</strong> Super Admins têm acesso total ao sistema
                                            e não pertencem a nenhuma organização específica.
                                        </p>
                                    </div>
                                )}

                                {/* Current Status */}
                                <div className="pt-4 border-t space-y-3">
                                    <Label>Status Atual</Label>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge className={roleConfig[user.role as UserRole].color}>
                                            {roleConfig[user.role as UserRole].label}
                                        </Badge>
                                        <Badge variant={user.isActive ? "default" : "secondary"}>
                                            {user.isActive ? "Ativo" : "Inativo"}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Membro desde{" "}
                                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Actions */}
                <motion.div variants={item} className="flex justify-end gap-3 mt-6">
                    <Link href="/superadmin/users">
                        <Button variant="outline" type="button">
                            Cancelar
                        </Button>
                    </Link>
                    <Button type="submit" disabled={isLoading} className="gap-2">
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Salvar Alterações
                            </>
                        )}
                    </Button>
                </motion.div>
            </form>
        </motion.div>
    );
}
