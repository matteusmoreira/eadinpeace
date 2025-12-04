"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Award,
    Download,
    Share2,
    CheckCircle,
    Clock,
    Calendar,
    User,
    BookOpen,
    Building2,
    Loader2,
    ArrowLeft,
    ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export default function CertificateVerifyPage() {
    const params = useParams();
    const code = params.code as string;

    const certificate = useQuery(api.certificates.getByCode, { code });

    if (certificate === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (certificate === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center">
                        <div className="h-16 w-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                            <Award className="h-8 w-8 text-red-500" />
                        </div>
                        <h1 className="text-xl font-bold mb-2">Certificado não encontrado</h1>
                        <p className="text-muted-foreground mb-6">
                            O código <code className="bg-muted px-2 py-1 rounded">{code}</code> não foi encontrado em nossa base de dados.
                        </p>
                        <Link href="/">
                            <Button variant="outline" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Voltar ao Início
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        if (hours === 0) return "< 1 hora";
        return `${hours} hora${hours > 1 ? "s" : ""}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Verification Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <Badge className="bg-emerald-500 text-white gap-1 px-4 py-2 text-sm">
                        <ShieldCheck className="h-4 w-4" />
                        Certificado Verificado
                    </Badge>
                </motion.div>

                {/* Certificate */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="overflow-hidden shadow-2xl">
                        {/* Certificate Content */}
                        <div className="bg-white dark:bg-slate-900 p-8 md:p-12">
                            {/* Header */}
                            <div className="text-center mb-8">
                                {certificate.organization?.name && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {certificate.organization.name}
                                    </p>
                                )}
                                <div className="flex justify-center mb-4">
                                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                        <Award className="h-10 w-10 text-white" />
                                    </div>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
                                    CERTIFICADO DE CONCLUSÃO
                                </h1>
                                <p className="text-muted-foreground">
                                    Este certificado é concedido a
                                </p>
                            </div>

                            {/* Student Name */}
                            <div className="text-center mb-8">
                                <h2 className="text-3xl md:text-4xl font-bold mb-2">
                                    {certificate.user?.firstName} {certificate.user?.lastName}
                                </h2>
                                <Separator className="max-w-xs mx-auto" />
                            </div>

                            {/* Course Info */}
                            <div className="text-center mb-8">
                                <p className="text-muted-foreground mb-2">
                                    Por ter concluído com sucesso o curso
                                </p>
                                <h3 className="text-xl md:text-2xl font-semibold mb-4">
                                    {certificate.course?.title}
                                </h3>
                                {certificate.instructor && (
                                    <p className="text-muted-foreground">
                                        Ministrado por {certificate.instructor.firstName} {certificate.instructor.lastName}
                                    </p>
                                )}
                            </div>

                            {/* Details Grid */}
                            <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                                <div className="text-center p-4 rounded-lg bg-muted/50">
                                    <Calendar className="h-5 w-5 mx-auto text-primary mb-2" />
                                    <p className="text-sm text-muted-foreground">Data de Emissão</p>
                                    <p className="font-medium">{formatDate(certificate.issuedAt)}</p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-muted/50">
                                    <Clock className="h-5 w-5 mx-auto text-primary mb-2" />
                                    <p className="text-sm text-muted-foreground">Carga Horária</p>
                                    <p className="font-medium">
                                        {certificate.course?.duration
                                            ? formatDuration(certificate.course.duration)
                                            : "N/A"}
                                    </p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-muted/50">
                                    <CheckCircle className="h-5 w-5 mx-auto text-emerald-500 mb-2" />
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <p className="font-medium text-emerald-600">Válido</p>
                                </div>
                            </div>

                            {/* Certificate Code */}
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">
                                    Código de Verificação
                                </p>
                                <code className="text-lg font-mono bg-muted px-4 py-2 rounded-lg">
                                    {certificate.code}
                                </code>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-muted/30 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-sm text-muted-foreground text-center md:text-left">
                                Verifique a autenticidade em:{" "}
                                <span className="text-primary">{typeof window !== "undefined" ? window.location.origin : ""}/certificate/{code}</span>
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Download PDF
                                </Button>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Share2 className="h-4 w-4" />
                                    Compartilhar
                                </Button>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Back Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mt-8"
                >
                    <Link href="/">
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Voltar ao Início
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
