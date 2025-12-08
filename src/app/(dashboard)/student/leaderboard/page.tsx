"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Trophy,
    Medal,
    Flame,
    Star,
    Crown,
    Award,
    TrendingUp,
    Target,
    Loader2,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
};

const rankColors = [
    "bg-gradient-to-r from-amber-400 to-amber-500",
    "bg-gradient-to-r from-slate-300 to-slate-400",
    "bg-gradient-to-r from-amber-600 to-amber-700",
];

const rankIcons = [Crown, Medal, Award];

export default function LeaderboardPage() {
    const { user } = useUser();

    // Get Convex user
    const convexUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Get leaderboard
    const leaderboard = useQuery(
        api.gamification.getLeaderboard,
        convexUser?.organizationId
            ? { organizationId: convexUser.organizationId, limit: 20 }
            : { limit: 20 }
    );

    // Get user rank
    const userRank = useQuery(
        api.gamification.getUserRank,
        convexUser?._id ? { userId: convexUser._id } : "skip"
    );

    // Get user achievements
    const userAchievements = useQuery(
        api.gamification.getUserAchievements,
        convexUser?._id ? { userId: convexUser._id } : "skip"
    );

    // Get all achievements
    const allAchievements = useQuery(api.gamification.getAll);

    // Initialize achievements on first load
    const initAchievements = useMutation(api.gamification.initializeDefaults);

    useEffect(() => {
        if (allAchievements && allAchievements.length === 0) {
            initAchievements();
        }
    }, [allAchievements, initAchievements]);

    const isLoading = leaderboard === undefined;

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item}>
                <h1 className="text-2xl md:text-3xl font-bold">Ranking</h1>
                <p className="text-muted-foreground">Veja sua posição e conquistas</p>
            </motion.div>

            {/* User Stats */}
            {userRank && (
                <motion.div variants={item} className="grid gap-4 md:grid-cols-4">
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                    <Trophy className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">#{userRank.rank}</p>
                                    <p className="text-sm text-muted-foreground">Sua Posição</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <Star className="h-6 w-6 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{userRank.points}</p>
                                    <p className="text-sm text-muted-foreground">Pontos</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                    <Award className="h-6 w-6 text-violet-500" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{userAchievements?.length || 0}</p>
                                    <p className="text-sm text-muted-foreground">Conquistas</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">
                                        Top {Math.round((userRank.rank / userRank.totalUsers) * 100)}%
                                    </p>
                                    <p className="text-sm text-muted-foreground">Percentil</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            <Tabs defaultValue="ranking" className="w-full">
                <TabsList className="w-full md:w-auto">
                    <TabsTrigger value="ranking" className="flex-1 md:flex-none">
                        <Trophy className="h-4 w-4 mr-2" />
                        Ranking
                    </TabsTrigger>
                    <TabsTrigger value="achievements" className="flex-1 md:flex-none">
                        <Award className="h-4 w-4 mr-2" />
                        Conquistas
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ranking" className="mt-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <motion.div variants={item}>
                            <Card>
                                <CardContent className="p-0">
                                    <div className="divide-y">
                                        {leaderboard?.map((entry, index) => {
                                            const isCurrentUser = entry.user._id === convexUser?._id;
                                            const RankIcon = rankIcons[index] || null;

                                            return (
                                                <div
                                                    key={entry.user._id}
                                                    className={cn(
                                                        "flex items-center gap-4 p-4",
                                                        isCurrentUser && "bg-primary/5",
                                                        index < 3 && "py-5"
                                                    )}
                                                >
                                                    {/* Rank */}
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-full flex items-center justify-center font-bold shrink-0",
                                                        index < 3 ? rankColors[index] : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {index < 3 ? (
                                                            RankIcon && <RankIcon className="h-5 w-5 text-white" />
                                                        ) : (
                                                            index + 1
                                                        )}
                                                    </div>

                                                    {/* User */}
                                                    <Avatar className={cn(index < 3 && "h-12 w-12")}>
                                                        <AvatarImage src={entry.user.imageUrl || undefined} />
                                                        <AvatarFallback>
                                                            {entry.user.firstName?.[0]}{entry.user.lastName?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className={cn("font-medium", index < 3 && "text-lg")}>
                                                                {entry.user.firstName} {entry.user.lastName}
                                                            </p>
                                                            {isCurrentUser && (
                                                                <Badge variant="secondary" className="text-xs">Você</Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Trophy className="h-3 w-3" />
                                                                {entry.completedCourses} cursos
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Flame className="h-3 w-3" />
                                                                {entry.currentStreak} dias
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Award className="h-3 w-3" />
                                                                {entry.achievementCount}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Points */}
                                                    <div className="text-right shrink-0">
                                                        <p className={cn("font-bold", index < 3 && "text-xl")}>
                                                            {entry.totalPoints}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">pontos</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </TabsContent>

                <TabsContent value="achievements" className="mt-6">
                    <motion.div variants={item}>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {allAchievements?.map((achievement) => {
                                const unlocked = userAchievements?.some(
                                    ua => ua.achievementId === achievement._id
                                );
                                const userAchievement = userAchievements?.find(
                                    ua => ua.achievementId === achievement._id
                                );

                                return (
                                    <Card
                                        key={achievement._id}
                                        className={cn(
                                            "transition-all",
                                            unlocked ? "bg-gradient-to-br from-primary/5 to-primary/10" : "opacity-60"
                                        )}
                                    >
                                        <CardContent className="pt-6">
                                            <div className="flex items-start gap-4">
                                                <div className={cn(
                                                    "h-14 w-14 rounded-xl flex items-center justify-center shrink-0",
                                                    unlocked
                                                        ? "bg-gradient-to-br from-primary to-primary/60"
                                                        : "bg-muted"
                                                )}>
                                                    {achievement.icon === "trophy" && <Trophy className={cn("h-7 w-7", unlocked ? "text-white" : "text-muted-foreground")} />}
                                                    {achievement.icon === "star" && <Star className={cn("h-7 w-7", unlocked ? "text-white" : "text-muted-foreground")} />}
                                                    {achievement.icon === "crown" && <Crown className={cn("h-7 w-7", unlocked ? "text-white" : "text-muted-foreground")} />}
                                                    {achievement.icon === "flame" && <Flame className={cn("h-7 w-7", unlocked ? "text-white" : "text-muted-foreground")} />}
                                                    {achievement.icon === "fire" && <Flame className={cn("h-7 w-7", unlocked ? "text-white" : "text-muted-foreground")} />}
                                                    {achievement.icon === "play" && <Target className={cn("h-7 w-7", unlocked ? "text-white" : "text-muted-foreground")} />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-semibold">{achievement.name}</h3>
                                                        <Badge variant={unlocked ? "default" : "outline"}>
                                                            {achievement.points} pts
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {achievement.description}
                                                    </p>
                                                    {unlocked && userAchievement && (
                                                        <p className="text-xs text-primary mt-2">
                                                            Desbloqueado em {new Date(userAchievement.unlockedAt).toLocaleDateString("pt-BR")}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </motion.div>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}
