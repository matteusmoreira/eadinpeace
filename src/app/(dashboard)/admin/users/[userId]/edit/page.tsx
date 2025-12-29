"use client";

import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    User,
    Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
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

const roleOptions = [
    { value: "student", label: "Aluno" },
    { value: "professor", label: "Professor" },
    { value: "admin", label: "Administrador" },
];

export default function EditUserPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as Id<"users">;

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [role, setRole] = useState("student");
    const [isActive, setIsActive] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Get user data
    const user = useQuery(api.users.getById, { userId });

    // Update mutation
    const updateUser = useMutation(api.users.update);

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || "");
            setLastName(user.lastName || "");
            setRole(user.role || "student");
            setIsActive(user.isActive ?? true);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!firstName.trim() || !lastName.trim()) {
            toast.error("Nome e sobrenome são obrigatórios");
            return;
        }

        setIsSaving(true);
        try {
            await updateUser({
                userId,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                role: role as "admin" | "professor" | "student",
                isActive,
            });
            toast.success("Usuário atualizado com sucesso!");
            router.push(`/admin/users/${userId}`);
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error("Erro ao atualizar usuário");
        } finally {
            setIsSaving(false);
        }
    };

    if (user === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (user === null) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <User className="h-16 w-16 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Usuário não encontrado</h2>
                <p className="text-muted-foreground">O usuário solicitado não existe ou você não tem permissão para editá-lo.</p>
                <Button onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>
            </div>
        );
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6 max-w-2xl mx-auto"
        >
            {/* Header with back button */}
            <motion.div variants={item} className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Editar Usuário</h1>
                    <p className="text-muted-foreground">
                        Atualize as informações do usuário
                    </p>
                </div>
            </motion.div>

            {/* Edit Form */}
            <motion.div variants={item}>
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={user.imageUrl || undefined} />
                                <AvatarFallback className="text-xl">
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle>{user.firstName} {user.lastName}</CardTitle>
                                <CardDescription>{user.email}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Nome</Label>
                                    <Input
                                        id="firstName"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="Nome"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Sobrenome</Label>
                                    <Input
                                        id="lastName"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Sobrenome"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email (read-only) */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    value={user.email}
                                    disabled
                                    className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">
                                    O email não pode ser alterado
                                </p>
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <Label htmlFor="role">Função</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma função" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roleOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label htmlFor="isActive" className="text-base">
                                        Usuário Ativo
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Desative para impedir o acesso à plataforma
                                    </p>
                                </div>
                                <Switch
                                    id="isActive"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                />
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => router.back()}
                                    disabled={isSaving}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 gradient-bg border-0"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Salvar Alterações
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
