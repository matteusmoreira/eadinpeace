"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { MessageSquare, Users, ThumbsUp, Search, Plus } from "lucide-react";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

const discussions = [
    { id: "1", title: "Dúvida sobre Promises no JavaScript", author: "João Silva", replies: 12, likes: 5, course: "JavaScript", time: "Há 2 horas" },
    { id: "2", title: "Como usar hooks personalizados?", author: "Maria Santos", replies: 8, likes: 15, course: "React", time: "Há 5 horas" },
    { id: "3", title: "Boas práticas em APIs REST", author: "Pedro Costa", replies: 23, likes: 42, course: "Node.js", time: "Há 1 dia" },
];

export default function StudentCommunityPage() {
    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Comunidade</h1>
                    <p className="text-muted-foreground">Conecte-se com outros alunos</p>
                </div>
                <Button className="gap-2 gradient-bg border-0">
                    <Plus className="h-4 w-4" />
                    Nova Discussão
                </Button>
            </motion.div>

            <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">2,847</p>
                                <p className="text-sm text-muted-foreground">Membros</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <MessageSquare className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">456</p>
                                <p className="text-sm text-muted-foreground">Discussões</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <ThumbsUp className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">1.2k</p>
                                <p className="text-sm text-muted-foreground">Respostas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={item}>
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar discussões..." className="pl-9" />
                </div>
            </motion.div>

            <motion.div variants={item}>
                <Card>
                    <CardHeader>
                        <CardTitle>Discussões Recentes</CardTitle>
                        <CardDescription>Últimas conversas da comunidade</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {discussions.map((discussion) => (
                            <div key={discussion.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                <Avatar>
                                    <AvatarFallback>{discussion.author.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium hover:text-primary transition-colors">{discussion.title}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                        <span>{discussion.author}</span>
                                        <Badge variant="outline">{discussion.course}</Badge>
                                        <span>{discussion.time}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="h-4 w-4" />
                                        {discussion.replies}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <ThumbsUp className="h-4 w-4" />
                                        {discussion.likes}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
