"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ArrowLeft,
    Save,
    Loader2,
    Upload,
    User,
    Shield,
    UserCog,
    GraduationCap,
    Users,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
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

const roles = [
    {
        value: "superadmin",
        label: "Super Admin",
        description: "Acesso total à plataforma",
        icon: Shield,
        color: "gradient-bg text-white",
    },
    {
        value: "admin",
        label: "Admin",
        description: "Gerencia uma organização",
        icon: UserCog,
        color: "bg-primary/10 text-primary",
    },
    {
        value: "professor",
        label: "Professor",
        description: "Cria e ministra cursos",
        icon: GraduationCap,
        color: "bg-amber-500/10 text-amber-500",
    },
    {
        value: "student",
        label: "Aluno",
        description: "Acessa cursos matriculados",
        icon: Users,
        color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    },
];

export default function NewUserPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        role: "student" as "superadmin" | "admin" | "professor" | "student",
        organizationId: "",
        imageUrl: "",
        sendInvite: true,
        isActive: true,
    });

    // Convex
    const organizations = useQuery(api.organizations.getAll);
    const createUser = useMutation(api.users.create);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await createUser({
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                role: formData.role,
                organizationId: formData.organizationId
                    ? formData.organizationId as Id<"organizations">
                    : undefined,
                imageUrl: formData.imageUrl || undefined,
            });

            toast.success("Usuário criado com sucesso!");
            router.push("/superadmin/users");
        } catch (error: any) {
            toast.error(error.message || "Erro ao criar usuário");
        } finally {
            setIsLoading(false);
        }
    };

    const needsOrganization = formData.role === "admin" || formData.role === "professor" || formData.role === "student";

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-3xl mx-auto space-y-6"
        >
            {/* Header */}
            <motion.div variants={item} className="flex items-center gap-4">
                <Link href="/superadmin/users">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Novo Usuário</h1>
                    <p className="text-muted-foreground">
                        Adicione um novo usuário à plataforma
                    </p>
                </div>
            </motion.div>

            <form onSubmit={handleSubmit}>
                <motion.div variants={item} className="space-y-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Básicas</CardTitle>
                            <CardDescription>
                                Dados pessoais do usuário
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Avatar */}
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={formData.imageUrl || undefined} />
                                    <AvatarFallback className="text-2xl">
                                        {formData.firstName?.[0] || formData.lastName?.[0] || <User className="h-8 w-8" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-2">
                                    <Label htmlFor="imageUrl">URL da Foto (opcional)</Label>
                                    <Input
                                        id="imageUrl"
                                        placeholder="https://..."
                                        value={formData.imageUrl}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Nome *</Label>
                                    <Input
                                        id="firstName"
                                        placeholder="Nome"
                                        value={formData.firstName}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Sobrenome *</Label>
                                    <Input
                                        id="lastName"
                                        placeholder="Sobrenome"
                                        value={formData.lastName}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@exemplo.com"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                                    }
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Role */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Função</CardTitle>
                            <CardDescription>
                                Defina o nível de acesso do usuário
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 md:grid-cols-2">
                                {roles.map((role) => (
                                    <div
                                        key={role.value}
                                        className={cn(
                                            "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
                                            formData.role === role.value
                                                ? "border-primary bg-primary/5"
                                                : "border-muted hover:border-muted-foreground/50"
                                        )}
                                        onClick={() =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                role: role.value as typeof formData.role,
                                                organizationId: role.value === "superadmin" ? "" : prev.organizationId
                                            }))
                                        }
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", role.color)}>
                                                <role.icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium">{role.label}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {role.description}
                                                </div>
                                            </div>
                                        </div>
                                        {formData.role === role.value && (
                                            <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                                                <div className="h-2 w-2 rounded-full bg-white" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Organization */}
                    {needsOrganization && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Organização</CardTitle>
                                <CardDescription>
                                    Vincule o usuário a uma organização
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Select
                                    value={formData.organizationId}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({ ...prev, organizationId: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma organização" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {organizations?.map((org) => (
                                            <SelectItem key={org._id} value={org._id}>
                                                {org.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {organizations?.length === 0 && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Nenhuma organização cadastrada.{" "}
                                        <Link href="/superadmin/organizations/new" className="text-primary hover:underline">
                                            Criar organização
                                        </Link>
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Options */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Opções</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Enviar Convite por Email</Label>
                                    <p className="text-sm text-muted-foreground">
                                        O usuário receberá um email para criar sua senha
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.sendInvite}
                                    onCheckedChange={(checked) =>
                                        setFormData((prev) => ({ ...prev, sendInvite: checked }))
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Link href="/superadmin/users">
                            <Button type="button" variant="outline">
                                Cancelar
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            className="gap-2 gradient-bg border-0"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Criar Usuário
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </form>
        </motion.div>
    );
}
