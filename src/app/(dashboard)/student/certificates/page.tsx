"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Award,
    Download,
    Share2,
    Eye,
    Clock,
    Calendar,
    ExternalLink,
    Loader2,
    CheckCircle,
    GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { generateCertificatePDF } from "@/lib/certificate-pdf";
import { toast } from "sonner";
import { Id } from "@convex/_generated/dataModel";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function StudentCertificatesPage() {
    const { user } = useUser();
    const [downloadingId, setDownloadingId] = useState<Id<"certificates"> | null>(null);

    // Get Convex user
    const convexUser = useQuery(api.users.getByClerkId, {
        clerkId: user?.id || ""
    });

    // Get user's certificates
    const certificates = useQuery(
        api.certificates.getByUser,
        convexUser?._id ? { userId: convexUser._id } : "skip"
    );

    const isLoading = certificates === undefined;

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        if (hours === 0) return "< 1h";
        return `${hours}h`;
    };

    const handleDownload = async (cert: NonNullable<typeof certificates>[number]) => {
        if (!user) return;

        setDownloadingId(cert._id);
        try {
            await generateCertificatePDF({
                code: cert.code,
                userName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
                courseTitle: cert.course?.title || "Curso",
                instructorName: cert.instructor
                    ? `${cert.instructor.firstName} ${cert.instructor.lastName}`
                    : undefined,
                issuedAt: cert.issuedAt,
                courseDuration: cert.course?.duration,
            });
            toast.success("Certificado baixado com sucesso!");
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            toast.error("Erro ao gerar o certificado. Tente novamente.");
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item}>
                <h1 className="text-2xl md:text-3xl font-bold">Meus Certificados</h1>
                <p className="text-muted-foreground">Certificados conquistados ao concluir cursos</p>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Award className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{certificates?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Total de Certificados</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{certificates?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Cursos Concluídos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">
                                    {certificates?.reduce((acc, c) => acc + (c.course?.duration || 0), 0)
                                        ? formatDuration(certificates.reduce((acc, c) => acc + (c.course?.duration || 0), 0))
                                        : "0h"}
                                </p>
                                <p className="text-sm text-muted-foreground">Horas de Estudo</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Certificates List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : certificates?.length === 0 ? (
                <motion.div variants={item} className="text-center py-12">
                    <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum certificado ainda</h3>
                    <p className="text-muted-foreground mb-4">
                        Complete cursos para ganhar certificados
                    </p>
                    <Link href="/student/courses">
                        <Button className="gap-2">
                            <GraduationCap className="h-4 w-4" />
                            Ver Cursos
                        </Button>
                    </Link>
                </motion.div>
            ) : (
                <motion.div variants={item} className="grid gap-6 md:grid-cols-2">
                    {certificates.map((cert) => (
                        <Card key={cert._id} className="overflow-hidden hover:shadow-lg transition-all">
                            {/* Certificate Preview */}
                            <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 relative p-6 flex flex-col items-center justify-center text-center border-b">
                                <div className="absolute top-4 right-4">
                                    <Badge className="bg-emerald-500">Verificado</Badge>
                                </div>

                                {/* Certificate Design */}
                                <div className="w-full max-w-sm p-6 bg-white dark:bg-slate-900 rounded-lg shadow-lg border-2 border-primary/20">
                                    <Award className="h-10 w-10 mx-auto text-primary mb-3" />
                                    <p className="text-xs text-muted-foreground mb-1">CERTIFICADO DE CONCLUSÃO</p>
                                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{cert.course?.title}</h3>
                                    <Separator className="my-3" />
                                    <p className="text-sm text-muted-foreground">
                                        {user?.firstName} {user?.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {formatDate(cert.issuedAt)}
                                    </p>
                                </div>
                            </div>

                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h4 className="font-medium">{cert.course?.title}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {cert.instructor?.firstName} {cert.instructor?.lastName}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                    <Calendar className="h-4 w-4" />
                                    <span>Emitido em {formatDate(cert.issuedAt)}</span>
                                </div>

                                <div className="flex gap-2">
                                    <Link href={`/certificate/${cert.code}`} className="flex-1">
                                        <Button variant="outline" className="w-full gap-2">
                                            <Eye className="h-4 w-4" />
                                            Visualizar
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleDownload(cert)}
                                        disabled={downloadingId === cert._id}
                                    >
                                        {downloadingId === cert._id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button variant="outline" size="icon">
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <p className="text-xs text-center text-muted-foreground mt-3">
                                    Código: <code className="bg-muted px-1 rounded">{cert.code}</code>
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
}
