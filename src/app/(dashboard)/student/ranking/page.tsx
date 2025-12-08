"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Trophy,
    Medal,
    Star,
    Flame,
    TrendingUp,
    Award,
    BookOpen,
    CheckCircle,
    Crown,
    Zap,
    Loader2,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const getRankIcon = (rank: number) => {
    switch (rank) {
        case 1:
            return <Crown className="h-6 w-6 text-amber-500" />;
        case 2:
            return <Medal className="h-5 w-5 text-slate-400" />;
        case 3:
            return <Medal className="h-5 w-5 text-amber-700" />;
        default:
            return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
};

const getRankColor = (rank: number) => {
    switch (rank) {
        case 1:
            return "from-amber-500/20 to-amber-500/5 border-amber-500/30";
        case 2:
            return "from-slate-400/20 to-slate-400/5 border-slate-400/30";
        case 3:
            return "from-amber-700/20 to-amber-700/5 border-amber-700/30";
        default:
            return "from-muted/50 to-transparent border-border";
    }
};

export default function RankingPage() {
    const { user } = useUser();

    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    const leaderboard = useQuery(
        api.leaderboard.getLeaderboard,
        convexUser?.organizationId
            ? { organizationId: convexUser.organizationId, limit: 50 }
            : "skip"
    );

    const userStats = useQuery(
        api.leaderboard.getUserStats,
        convexUser?._id ? { userId: convexUser._id } : "skip"
    );

    const weeklyLeaders = useQuery(
        api.leaderboard.getWeeklyLeaders,
        convexUser?.organizationId
            ? { organizationId: convexUser.organizationId }
            : "skip"
    );

    if (!convexUser || leaderboard === undefined || userStats === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-amber-500" />
                        Ranking
                    </h1>
                    <p className="text-muted-foreground">
                        Veja sua posição e compete com outros alunos
                    </p>
                </div>
            </div>

            {/* User Stats Card */}
            <Card className="gradient-bg border-0 text-white overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_50%)]" />
                <CardContent className="p-6 relative">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20 border-4 border-white/20">
                                <AvatarImage src={user?.imageUrl} />
                                <AvatarFallback className="text-2xl bg-white/10">
                                    {user?.firstName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-xl font-bold">{user?.fullName}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge className="bg-white/20 text-white border-0">
                                        <Trophy className="h-3 w-3 mr-1" />
                                        #{userStats.rank || "-"}
                                    </Badge>
                                    <Badge className="bg-white/20 text-white border-0">
                                        <Zap className="h-3 w-3 mr-1" />
                                        {userStats.totalPoints} pts
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
                            <div className="text-center p-3 rounded-lg bg-white/10">
                                <BookOpen className="h-5 w-5 mx-auto mb-1 opacity-80" />
                                <p className="text-2xl font-bold">{userStats.coursesCompleted}</p>
                                <p className="text-xs opacity-80">Cursos</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-white/10">
                                <CheckCircle className="h-5 w-5 mx-auto mb-1 opacity-80" />
                                <p className="text-2xl font-bold">{userStats.lessonsCompleted}</p>
                                <p className="text-xs opacity-80">Aulas</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-white/10">
                                <Award className="h-5 w-5 mx-auto mb-1 opacity-80" />
                                <p className="text-2xl font-bold">{userStats.certificatesEarned}</p>
                                <p className="text-xs opacity-80">Certificados</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-white/10">
                                <Flame className="h-5 w-5 mx-auto mb-1 opacity-80" />
                                <p className="text-2xl font-bold">{userStats.currentStreak}</p>
                                <p className="text-xs opacity-80">Streak</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Weekly Leaders & Full Ranking */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Weekly Leaders */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                            Destaques da Semana
                        </CardTitle>
                        <CardDescription>
                            Quem mais pontuou nos últimos 7 dias
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {weeklyLeaders && weeklyLeaders.length > 0 ? (
                            weeklyLeaders.map((leader: any, index: number) => (
                                <motion.div
                                    key={leader.userId}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                                >
                                    <span className="text-lg font-bold text-muted-foreground w-6">
                                        {index + 1}
                                    </span>
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={leader.user?.imageUrl} />
                                        <AvatarFallback>
                                            {leader.user?.firstName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-medium">
                                            {leader.user?.firstName} {leader.user?.lastName}
                                        </p>
                                        <div className="flex items-center gap-1 text-emerald-500 text-sm">
                                            <TrendingUp className="h-3 w-3" />
                                            +{leader.weekPoints} pts
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-muted-foreground">
                                <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Sem atividade esta semana</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Full Ranking */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Trophy className="h-5 w-5 text-amber-500" />
                            Ranking Geral
                        </CardTitle>
                        <CardDescription>
                            Classificação de todos os alunos
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {leaderboard.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Nenhum aluno no ranking ainda</p>
                                    <p className="text-sm">Complete aulas para ganhar pontos!</p>
                                </div>
                            ) : (
                                leaderboard.map((entry: any, index: number) => (
                                    <motion.div
                                        key={entry.userId}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-lg border transition-all",
                                            "bg-gradient-to-r",
                                            getRankColor(entry.rank),
                                            entry.userId === convexUser._id && "ring-2 ring-primary"
                                        )}
                                    >
                                        <div className="w-10 flex items-center justify-center">
                                            {getRankIcon(entry.rank)}
                                        </div>
                                        <Avatar className="h-12 w-12 border-2 border-background">
                                            <AvatarImage src={entry.user?.imageUrl} />
                                            <AvatarFallback>
                                                {entry.user?.firstName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium truncate">
                                                    {entry.user?.firstName} {entry.user?.lastName}
                                                </p>
                                                {entry.userId === convexUser._id && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Você
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                                <span className="flex items-center gap-1">
                                                    <BookOpen className="h-3 w-3" />
                                                    {entry.coursesCompleted} cursos
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Flame className="h-3 w-3" />
                                                    {entry.currentStreak} dias
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-lg font-bold text-primary">
                                                <Zap className="h-4 w-4" />
                                                {entry.totalPoints}
                                            </div>
                                            <p className="text-xs text-muted-foreground">pontos</p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* How to Earn Points */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Como Ganhar Pontos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="font-medium">Completar Aula</p>
                                <p className="text-sm text-primary font-bold">+10 pts</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="font-medium">Completar Curso</p>
                                <p className="text-sm text-primary font-bold">+100 pts</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <Award className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="font-medium">Certificado</p>
                                <p className="text-sm text-primary font-bold">+50 pts</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <Flame className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="font-medium">Streak Diário</p>
                                <p className="text-sm text-primary font-bold">+5 pts/dia</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
