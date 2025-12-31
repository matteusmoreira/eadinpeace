"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    FileText,
    Plus,
    MoreVertical,
    Edit,
    Copy,
    Trash2,
    Star,
    Loader2,
    ArrowLeft,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Id } from "@convex/_generated/dataModel";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function CertificateTemplatesPage() {
    const { user } = useUser();
    const router = useRouter();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<Id<"certificateTemplates"> | null>(null);

    // Get current user
    const currentUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Check if user has an organization
    const hasOrganization = currentUser?.organizationId !== undefined && currentUser?.organizationId !== null;

    // Get templates - only if user has an organization
    const templates = useQuery(
        api.certificateTemplates.getByOrganization,
        hasOrganization
            ? { organizationId: currentUser.organizationId! }
            : "skip"
    );

    // Mutations
    const duplicateTemplate = useMutation(api.certificateTemplates.duplicate);
    const setAsDefault = useMutation(api.certificateTemplates.setAsDefault);
    const deleteTemplate = useMutation(api.certificateTemplates.remove);

    const handleDuplicate = async (templateId: Id<"certificateTemplates">) => {
        try {
            await duplicateTemplate({ templateId });
            toast.success("Template duplicado com sucesso!");
        } catch (error) {
            toast.error("Erro ao duplicar template");
        }
    };

    const handleSetAsDefault = async (templateId: Id<"certificateTemplates">) => {
        try {
            await setAsDefault({ templateId });
            toast.success("Template definido como padrão!");
        } catch (error) {
            toast.error("Erro ao definir template como padrão");
        }
    };

    const handleDelete = async () => {
        if (!templateToDelete) return;
        try {
            await deleteTemplate({ templateId: templateToDelete });
            toast.success("Template excluído com sucesso!");
            setDeleteDialogOpen(false);
            setTemplateToDelete(null);
        } catch (error) {
            toast.error("Erro ao excluir template");
        }
    };

    const isLoading = currentUser === undefined || (hasOrganization && templates === undefined);

    // Show message if superadmin without organization
    if (currentUser && !hasOrganization) {
        return (
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-6"
            >
                <motion.div variants={item} className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/certificates">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Modelos de Certificado</h1>
                        <p className="text-muted-foreground">
                            Crie e gerencie modelos personalizados de certificado
                        </p>
                    </div>
                </motion.div>

                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Organização não encontrada</h3>
                        <p className="text-muted-foreground">
                            Você precisa estar vinculado a uma organização para gerenciar modelos de certificado.
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
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
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/certificates">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Modelos de Certificado</h1>
                        <p className="text-muted-foreground">
                            Crie e gerencie modelos personalizados de certificado
                        </p>
                    </div>
                </div>
                <Button asChild className="gap-2">
                    <Link href="/admin/certificates/templates/create">
                        <Plus className="h-4 w-4" />
                        Novo Modelo
                    </Link>
                </Button>
            </motion.div>

            {/* Templates Grid */}
            <motion.div variants={item}>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : !templates || templates.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-12 text-center">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">Nenhum modelo criado</h3>
                            <p className="text-muted-foreground mb-4">
                                Crie seu primeiro modelo de certificado personalizado
                            </p>
                            <Button asChild>
                                <Link href="/admin/certificates/templates/create">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Criar Modelo
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {templates.map((template) => (
                            <Card key={template._id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                                {/* Preview */}
                                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                                    <div
                                        className="absolute inset-4 rounded shadow-inner flex items-center justify-center"
                                        style={{ backgroundColor: template.backgroundColor }}
                                    >
                                        <div className="text-center">
                                            <FileText className="h-8 w-8 mx-auto text-primary/50 mb-2" />
                                            <p className="text-xs text-muted-foreground">
                                                {template.elements.length} elementos
                                            </p>
                                        </div>
                                    </div>

                                    {template.isDefault && (
                                        <Badge className="absolute top-2 right-2 gap-1">
                                            <Star className="h-3 w-3 fill-current" />
                                            Padrão
                                        </Badge>
                                    )}
                                </div>

                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold truncate">{template.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Editado em {new Date(template.updatedAt).toLocaleDateString("pt-BR")}
                                            </p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/certificates/templates/${template._id}/edit`}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Editar
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDuplicate(template._id)}>
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Duplicar
                                                </DropdownMenuItem>
                                                {!template.isDefault && (
                                                    <DropdownMenuItem onClick={() => handleSetAsDefault(template._id)}>
                                                        <Star className="h-4 w-4 mr-2" />
                                                        Definir como Padrão
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => {
                                                        setTemplateToDelete(template._id);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Modelo</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este modelo de certificado?
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
}
