"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Trophy,
    Lock,
    CheckCircle2,
    Star,
    Flame,
    Crown,
    Zap,
    Target,
    Medal,
    Award,
    Loader2,
    Play,
    BookOpen,
    GraduationCap,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useEffect } from "react";

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

const iconMap: Record<string, React.ElementType> = {
    play: Play,
    trophy: Trophy,
    star: Star,
    crown: Crown,
    flame: Flame,
    fire: Flame,
    zap: Zap,
    target: Target,
    medal: Medal,
    award: Award,
    book: BookOpen,
    graduation: GraduationCap,
};

const typeLabels: Record<string, string> = {
    course_complete: "Cursos",
    streak: "Sequência",
    time_spent: "Tempo",
    first_lesson: "Primeira Aula",
    top_student: "Top Aluno",
};

export default function StudentAchievementsPage() {
    const { user } = useUser();

    // Get user from Convex
    const convexUser = useQuery(api.users.getByClerkId, {
        clerkId: user?.id || ""
    });

    // Get all achievements
    const allAchievements = useQuery(api.gamification.getAll);

    // Get user achievements
    const userAchievements = useQuery(api.gamification.getUserAchievements,
        convexUser ? { userId: convexUser._id } : "skip"
    );

    // Check and award achievements
    const checkAchievements = useMutation(api.gamification.checkAndAward);
    const initializeAchievements = useMutation(api.gamification.initializeDefaults);

    // Initialize default achievements if none exist
    useEffect(() => {
        if (allAchievements && allAchievements.length === 0) {
            initializeAchievements({});
        }
    }, [allAchievements, initializeAchievements]);

    // Check for new achievements when page loads
    useEffect(() => {
        if (convexUser) {
            checkAchievements({ userId: convexUser._id });
        }
    }, [convexUser, checkAchievements]);

    const isLoading = convexUser === undefined || allAchievements === undefined;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Get user's unlocked achievement IDs
    const unlockedIds = new Set(userAchievements?.map(ua => ua.achievementId) || []);

    // Categorize achievements
    const unlockedAchievements = allAchievements?.filter(a => unlockedIds.has(a._id)) || [];
    const lockedAchievements = allAchievements?.filter(a => !unlockedIds.has(a._id)) || [];

    // Calculate total points
    const totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);
    const maxPoints = (allAchievements || []).reduce((sum, a) => sum + a.points, 0);
    const progressPercent = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

    // Group by type
    const achievementsByType = (allAchievements || []).reduce((acc, achievement) => {
        const type = achievement.type;
        if (!acc[type]) acc[type] = [];
        acc[type].push({
            ...achievement,
            unlocked: unlockedIds.has(achievement._id),
        });
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Header */}
            <motion.div variants={item}>
                <h1 className="text-2xl md:text-3xl font-bold">Conquistas</h1>
                <p className="text-muted-foreground">
                    Acompanhe seu progresso e desbloqueie conquistas
                </p>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Trophy className="h-7 w-7 text-primary" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{unlockedAchievements.length}</p>
                                <p className="text-sm text-muted-foreground">
                                    de {allAchievements?.length || 0} conquistas
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Star className="h-7 w-7 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{totalPoints}</p>
                                <p className="text-sm text-muted-foreground">pontos ganhos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Progresso Total</span>
                                <span className="font-medium">{Math.round(progressPercent)}%</span>
                            </div>
                            <Progress value={progressPercent} className="h-3" />
                            <p className="text-xs text-muted-foreground">
                                {totalPoints} de {maxPoints} pontos
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Achievements Grid */}
            <motion.div variants={item}>
                <Tabs defaultValue="all" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="all">Todas</TabsTrigger>
                        <TabsTrigger value="unlocked">Desbloqueadas</TabsTrigger>
                        <TabsTrigger value="locked">Bloqueadas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {(allAchievements || []).map((achievement) => {
                                const isUnlocked = unlockedIds.has(achievement._id);
                                const Icon = iconMap[achievement.icon] || Trophy;
                                const userAchievement = userAchievements?.find(
                                    ua => ua.achievementId === achievement._id
                                );

                                return (
                                    <Card
                                        key={achievement._id}
                                        className={`relative overflow-hidden transition-all duration-300 ${isUnlocked
                                                ? "border-primary/50 bg-primary/5"
                                                : "opacity-60"
                                            }`}
                                    >
                                        <CardContent className="pt-6">
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className={`h-16 w-16 rounded-xl flex items-center justify-center shrink-0 ${isUnlocked
                                                            ? "bg-primary/10"
                                                            : "bg-muted"
                                                        }`}
                                                >
                                                    {isUnlocked ? (
                                                        <Icon className="h-8 w-8 text-primary" />
                                                    ) : (
                                                        <Lock className="h-8 w-8 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold truncate">
                                                            {achievement.name}
                                                        </h3>
                                                        {isUnlocked && (
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {achievement.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant="secondary">
                                                            {achievement.points} pts
                                                        </Badge>
                                                        <Badge variant="outline">
                                                            {typeLabels[achievement.type] || achievement.type}
                                                        </Badge>
                                                    </div>
                                                    {isUnlocked && userAchievement && (
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            Desbloqueado em{" "}
                                                            {new Date(userAchievement.unlockedAt).toLocaleDateString("pt-BR")}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </TabsContent>

                    <TabsContent value="unlocked">
                        {unlockedAchievements.length === 0 ? (
                            <Card className="p-12 text-center">
                                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">Nenhuma conquista desbloqueada</h3>
                                <p className="text-muted-foreground">
                                    Continue estudando para desbloquear suas primeiras conquistas!
                                </p>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {unlockedAchievements.map((achievement) => {
                                    const Icon = iconMap[achievement.icon] || Trophy;
                                    const userAchievement = userAchievements?.find(
                                        ua => ua.achievementId === achievement._id
                                    );

                                    return (
                                        <Card
                                            key={achievement._id}
                                            className="border-primary/50 bg-primary/5"
                                        >
                                            <CardContent className="pt-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                        <Icon className="h-8 w-8 text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold truncate">
                                                                {achievement.name}
                                                            </h3>
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {achievement.description}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge variant="secondary">
                                                                {achievement.points} pts
                                                            </Badge>
                                                        </div>
                                                        {userAchievement && (
                                                            <p className="text-xs text-muted-foreground mt-2">
                                                                Desbloqueado em{" "}
                                                                {new Date(userAchievement.unlockedAt).toLocaleDateString("pt-BR")}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="locked">
                        {lockedAchievements.length === 0 ? (
                            <Card className="p-12 text-center">
                                <Crown className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                                <h3 className="text-lg font-medium mb-2">Parabéns!</h3>
                                <p className="text-muted-foreground">
                                    Você desbloqueou todas as conquistas disponíveis!
                                </p>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {lockedAchievements.map((achievement) => (
                                    <Card key={achievement._id} className="opacity-60">
                                        <CardContent className="pt-6">
                                            <div className="flex items-start gap-4">
                                                <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                                    <Lock className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold truncate">
                                                        {achievement.name}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {achievement.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant="secondary">
                                                            {achievement.points} pts
                                                        </Badge>
                                                        <Badge variant="outline">
                                                            {typeLabels[achievement.type] || achievement.type}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </motion.div>
        </motion.div>
    );
}
