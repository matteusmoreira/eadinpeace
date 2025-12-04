"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, BookOpen, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function AdminReportsPage() {
    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item} className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Relatórios</h1>
                    <p className="text-muted-foreground">Análise de dados da organização</p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar
                </Button>
            </motion.div>

            <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Matrículas este mês", value: "156", icon: Users, color: "text-primary" },
                    { label: "Cursos concluídos", value: "89", icon: BookOpen, color: "text-emerald-500" },
                    { label: "Taxa de engajamento", value: "78%", icon: TrendingUp, color: "text-amber-500" },
                    { label: "Certificados emitidos", value: "45", icon: BarChart3, color: "text-violet-500" },
                ].map((stat, index) => (
                    <Card key={index}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </motion.div>

            <motion.div variants={item}>
                <Card>
                    <CardHeader>
                        <CardTitle>Matrículas por Mês</CardTitle>
                        <CardDescription>Últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                        [Gráfico de barras será implementado com Recharts]
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
