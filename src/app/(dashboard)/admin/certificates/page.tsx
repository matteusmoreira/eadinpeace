"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Award,
    Search,
    MoreVertical,
    Download,
    Eye,
    Loader2,
    FileText,
    User,
    BookOpen,
    Calendar,
    CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";

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

export default function AdminCertificatesPage() {
    const { user } = useUser();
    const [searchQuery, setSearchQuery] = useState("");
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [selectedCertificate, setSelectedCertificate] = useState<any>(null);

    // Get current user to find their organization
    const currentUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get certificates from organization
    const certificates = useQuery(api.certificates.getByOrganization,
        currentUser?.organizationId
            ? { organizationId: currentUser.organizationId }
            : "skip"
    );

    // Get organization certificate stats
    const certStats = useQuery(api.certificates.getOrganizationStats,
        currentUser?.organizationId
            ? { organizationId: currentUser.organizationId }
            : "skip"
    );

    // Get courses count
    const courses = useQuery(api.courses.getByOrganization,
        currentUser?.organizationId
            ? { organizationId: currentUser.organizationId }
            : "skip"
    );

    const filteredCertificates = (certificates || []).filter((cert) => {
        const searchStr = `${cert.userName} ${cert.courseName} ${cert.code}`.toLowerCase();
        return searchStr.includes(searchQuery.toLowerCase());
    });

    const handlePreview = (cert: any) => {
        setSelectedCertificate(cert);
        setPreviewDialogOpen(true);
    };

    const isLoading = certificates === undefined;

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
                    <h1 className="text-2xl md:text-3xl font-bold">Certificados</h1>
                    <p className="text-muted-foreground">
                        Gerencie os certificados emitidos pela organização
                    </p>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Award className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{certStats?.total || 0}</p>
                                <p className="text-sm text-muted-foreground">Total Emitidos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{certStats?.thisMonth || 0}</p>
                                <p className="text-sm text-muted-foreground">Este Mês</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{certStats?.coursesWithCertificates || 0}</p>
                                <p className="text-sm text-muted-foreground">Cursos com Certificado</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                <Download className="h-5 w-5 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{certStats?.downloads || 0}</p>
                                <p className="text-sm text-muted-foreground">Downloads</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Search */}
            <motion.div variants={item} className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por aluno, curso ou código..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </motion.div>

            {/* Table */}
            <motion.div variants={item}>
                <Card>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : filteredCertificates.length === 0 ? (
                            <div className="text-center py-12">
                                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium">Nenhum certificado encontrado</h3>
                                <p className="text-muted-foreground">
                                    Os certificados serão exibidos aqui quando alunos completarem cursos
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Aluno</TableHead>
                                        <TableHead>Curso</TableHead>
                                        <TableHead>Código</TableHead>
                                        <TableHead>Data de Emissão</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCertificates.map((cert) => (
                                        <TableRow key={cert._id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    {cert.userName}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                    {cert.courseName}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-mono">
                                                    {cert.code}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(cert.issuedAt).toLocaleDateString("pt-BR")}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handlePreview(cert)}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            Visualizar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Download PDF
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Preview Dialog */}
            <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Visualizar Certificado</DialogTitle>
                        <DialogDescription>
                            Certificado de conclusão do curso
                        </DialogDescription>
                    </DialogHeader>

                    {selectedCertificate && (
                        <div className="border rounded-lg p-8 bg-gradient-to-br from-primary/5 to-primary/10 text-center space-y-4">
                            <Award className="h-16 w-16 mx-auto text-primary" />
                            <h2 className="text-2xl font-bold">Certificado de Conclusão</h2>
                            <p className="text-lg">Certificamos que</p>
                            <p className="text-3xl font-bold gradient-text">{selectedCertificate.userName}</p>
                            <p className="text-lg">concluiu com sucesso o curso</p>
                            <p className="text-xl font-semibold">{selectedCertificate.courseName}</p>
                            <div className="pt-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    Código de verificação: <span className="font-mono">{selectedCertificate.code}</span>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Emitido em: {new Date(selectedCertificate.issuedAt).toLocaleDateString("pt-BR")}
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
                            Fechar
                        </Button>
                        <Button className="gap-2">
                            <Download className="h-4 w-4" />
                            Download PDF
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
