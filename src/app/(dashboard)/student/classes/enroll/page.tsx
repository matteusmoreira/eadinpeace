"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    BookOpen,
    Calendar,
    Users,
    CheckCircle,
    XCircle,
    ArrowRight,
    Clock,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

function EnrollPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tokenFromUrl = searchParams.get("token");

    const [token, setToken] = useState(tokenFromUrl || "");
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [enrollmentResult, setEnrollmentResult] = useState<{
        success: boolean;
        status?: "active" | "pending";
        classId?: string;
        error?: string;
    } | null>(null);

    // Verify token
    const tokenInfo = useQuery(
        api.classes.verifyEnrollmentToken,
        token.length >= 8 ? { token } : "skip"
    );

    const enrollWithToken = useMutation(api.classes.enrollWithToken);

    const handleEnroll = async () => {
        if (!token) {
            toast.error("Insira o código de matrícula");
            return;
        }

        setIsEnrolling(true);
        try {
            const result = await enrollWithToken({ token });
            setEnrollmentResult({
                success: true,
                status: result.status as "active" | "pending",
                classId: result.classId,
            });
            toast.success(
                result.status === "pending"
                    ? "Solicitação enviada! Aguarde aprovação."
                    : "Inscrição realizada com sucesso!"
            );
        } catch (error: any) {
            setEnrollmentResult({
                success: false,
                error: error.message || "Erro ao realizar inscrição",
            });
            toast.error(error.message || "Erro ao realizar inscrição");
        } finally {
            setIsEnrolling(false);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    // Show success/error state
    if (enrollmentResult) {
        return (
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="min-h-[60vh] flex items-center justify-center"
            >
                <motion.div variants={item}>
                    <Card className="max-w-md mx-auto text-center">
                        <CardContent className="pt-8 pb-6 px-6">
                            {enrollmentResult.success ? (
                                <>
                                    {enrollmentResult.status === "pending" ? (
                                        <>
                                            <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                                                <Clock className="h-8 w-8 text-amber-500" />
                                            </div>
                                            <h2 className="text-xl font-bold mb-2">Solicitação Enviada!</h2>
                                            <p className="text-muted-foreground mb-6">
                                                Sua solicitação de matrícula foi enviada. Aguarde a aprovação do professor.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle className="h-8 w-8 text-emerald-500" />
                                            </div>
                                            <h2 className="text-xl font-bold mb-2">Inscrição Confirmada!</h2>
                                            <p className="text-muted-foreground mb-6">
                                                Você foi inscrito com sucesso na turma. Comece seus estudos agora!
                                            </p>
                                        </>
                                    )}
                                    <div className="flex flex-col gap-2">
                                        {enrollmentResult.status === "active" && enrollmentResult.classId && (
                                            <Link href={`/student/classes/${enrollmentResult.classId}/learn`}>
                                                <Button className="w-full gap-2 gradient-bg border-0">
                                                    Começar Estudos
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        )}
                                        <Link href="/student/classes">
                                            <Button variant="outline" className="w-full">
                                                Ver Minhas Turmas
                                            </Button>
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                                        <XCircle className="h-8 w-8 text-destructive" />
                                    </div>
                                    <h2 className="text-xl font-bold mb-2">Erro na Inscrição</h2>
                                    <p className="text-muted-foreground mb-6">{enrollmentResult.error}</p>
                                    <Button onClick={() => setEnrollmentResult(null)} className="w-full">
                                        Tentar Novamente
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-2xl mx-auto space-y-6"
        >
            <motion.div variants={item} className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold">Inscrição em Turma</h1>
                <p className="text-muted-foreground mt-2">
                    Use o código de matrícula fornecido pelo professor
                </p>
            </motion.div>

            {/* Token Input */}
            <motion.div variants={item}>
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="token">Código de Matrícula</Label>
                                <Input
                                    id="token"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                                    placeholder="Digite o código (ex: ABC123XYZ456)"
                                    className="text-center text-lg tracking-widest font-mono"
                                    maxLength={20}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Token Info */}
            {token.length >= 8 && (
                <motion.div variants={item}>
                    {tokenInfo === undefined ? (
                        <Card>
                            <CardContent className="py-8 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <span className="ml-2">Verificando código...</span>
                            </CardContent>
                        </Card>
                    ) : !tokenInfo.valid ? (
                        <Card className="border-destructive/50">
                            <CardContent className="py-6">
                                <div className="flex items-center gap-3 text-destructive">
                                    <XCircle className="h-5 w-5 shrink-0" />
                                    <span>{tokenInfo.error}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-primary/50">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                                    <CardTitle className="text-lg">Código Válido</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Class Info */}
                                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                                    <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        {tokenInfo.course?.thumbnail ? (
                                            <img
                                                src={tokenInfo.course.thumbnail}
                                                alt=""
                                                className="h-full w-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <BookOpen className="h-8 w-8 text-primary" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{tokenInfo.class?.name}</h3>
                                        <p className="text-sm text-muted-foreground">{tokenInfo.course?.title}</p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                Início: {tokenInfo.class?.startDate && formatDate(tokenInfo.class.startDate)}
                                            </span>
                                            {tokenInfo.class?.endDate && (
                                                <span>Término: {formatDate(tokenInfo.class.endDate)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                {tokenInfo.class?.description && (
                                    <p className="text-sm text-muted-foreground">{tokenInfo.class.description}</p>
                                )}

                                {/* Approval Notice */}
                                {tokenInfo.requiresApproval && (
                                    <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg text-sm">
                                        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                                        <span>Esta turma requer aprovação do professor. Após se inscrever, aguarde a confirmação.</span>
                                    </div>
                                )}

                                {/* Enroll Button */}
                                <Button
                                    onClick={handleEnroll}
                                    disabled={isEnrolling}
                                    className="w-full gap-2 gradient-bg border-0"
                                    size="lg"
                                >
                                    {isEnrolling ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Inscrevendo...
                                        </>
                                    ) : (
                                        <>
                                            <Users className="h-4 w-4" />
                                            {tokenInfo.requiresApproval ? "Solicitar Inscrição" : "Confirmar Inscrição"}
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </motion.div>
            )}

            {/* Help */}
            <motion.div variants={item} className="text-center text-sm text-muted-foreground">
                <p>
                    Não tem um código? Entre em contato com seu professor ou{" "}
                    <Link href="/student/courses" className="text-primary hover:underline">
                        explore os cursos disponíveis
                    </Link>
                </p>
            </motion.div>
        </motion.div>
    );
}

export default function EnrollPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <EnrollPageContent />
        </Suspense>
    );
}
