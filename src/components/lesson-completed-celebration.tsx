"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Star, Trophy, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface LessonCompletedCelebrationProps {
    isOpen: boolean;
    onClose: () => void;
    lessonTitle: string;
    nextLessonTitle?: string;
    onNextLesson?: () => void;
    courseProgress?: number;
}

// Componente de partícula para o efeito de confete
const Particle = ({ delay, x, color }: { delay: number; x: number; color: string }) => (
    <motion.div
        className="absolute"
        initial={{ y: -20, x, opacity: 1, scale: 1 }}
        animate={{
            y: 400,
            x: x + (Math.random() - 0.5) * 100,
            opacity: 0,
            scale: 0.5,
            rotate: Math.random() * 720 - 360,
        }}
        transition={{
            duration: 2 + Math.random(),
            delay,
            ease: "easeOut",
        }}
    >
        <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: color }}
        />
    </motion.div>
);

// Componente de estrela animada
const AnimatedStar = ({ delay, size, x, y }: { delay: number; size: number; x: number; y: number }) => (
    <motion.div
        className="absolute text-yellow-400"
        style={{ left: `${x}%`, top: `${y}%` }}
        initial={{ scale: 0, rotate: 0, opacity: 0 }}
        animate={{
            scale: [0, 1.2, 1],
            rotate: [0, 15, -15, 0],
            opacity: [0, 1, 1, 0],
        }}
        transition={{
            duration: 1.5,
            delay,
            times: [0, 0.3, 0.7, 1],
        }}
    >
        <Star className="fill-current" style={{ width: size, height: size }} />
    </motion.div>
);

export function LessonCompletedCelebration({
    isOpen,
    onClose,
    lessonTitle,
    nextLessonTitle,
    onNextLesson,
    courseProgress = 0,
}: LessonCompletedCelebrationProps) {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowConfetti(true);
            // Auto-close após 4 segundos se não houver próxima aula
            if (!nextLessonTitle) {
                const timer = setTimeout(() => {
                    onClose();
                }, 4000);
                return () => clearTimeout(timer);
            }
        } else {
            setShowConfetti(false);
        }
    }, [isOpen, nextLessonTitle, onClose]);

    const confettiColors = [
        "#10b981", // emerald-500
        "#3b82f6", // blue-500
        "#8b5cf6", // violet-500
        "#f59e0b", // amber-500
        "#ec4899", // pink-500
        "#06b6d4", // cyan-500
    ];

    const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        delay: Math.random() * 0.5,
        x: Math.random() * window.innerWidth,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    }));

    const stars = [
        { delay: 0.2, size: 24, x: 15, y: 20 },
        { delay: 0.4, size: 16, x: 80, y: 15 },
        { delay: 0.3, size: 20, x: 25, y: 70 },
        { delay: 0.5, size: 18, x: 75, y: 65 },
        { delay: 0.1, size: 14, x: 10, y: 45 },
        { delay: 0.6, size: 22, x: 85, y: 40 },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Confetti */}
                    {showConfetti && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {particles.map((particle) => (
                                <Particle
                                    key={particle.id}
                                    delay={particle.delay}
                                    x={particle.x}
                                    color={particle.color}
                                />
                            ))}
                        </div>
                    )}

                    {/* Stars */}
                    <div className="absolute inset-0 pointer-events-none">
                        {stars.map((star, i) => (
                            <AnimatedStar key={i} {...star} />
                        ))}
                    </div>

                    {/* Modal Content */}
                    <motion.div
                        className="relative z-10 bg-card border-2 border-emerald-500/50 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 overflow-hidden"
                        initial={{ scale: 0.5, y: 50, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Glow effect */}
                        <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
                        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />

                        {/* Badge/Icon */}
                        <motion.div
                            className="relative flex justify-center mb-6"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", damping: 10, stiffness: 200 }}
                        >
                            <div className="relative">
                                {/* Outer ring */}
                                <motion.div
                                    className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        opacity: [0.5, 0.2, 0.5],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    style={{ width: 120, height: 120 }}
                                />
                                
                                {/* Main badge */}
                                <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ delay: 0.5, duration: 0.5 }}
                                    >
                                        <CheckCircle2 className="h-12 w-12 text-white" />
                                    </motion.div>
                                </div>

                                {/* Sparkle effects */}
                                <motion.div
                                    className="absolute -top-2 -right-2"
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <Sparkles className="h-6 w-6 text-yellow-400" />
                                </motion.div>
                                <motion.div
                                    className="absolute -bottom-1 -left-1"
                                    initial={{ scale: 0, rotate: 45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <Sparkles className="h-5 w-5 text-yellow-400" />
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Title */}
                        <motion.div
                            className="text-center mb-6"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent mb-2">
                                Aula Concluída! 🎉
                            </h2>
                            <p className="text-muted-foreground">
                                Você completou:
                            </p>
                            <p className="font-semibold text-foreground mt-1 line-clamp-2">
                                {lessonTitle}
                            </p>
                        </motion.div>

                        {/* Progress indicator */}
                        {courseProgress > 0 && (
                            <motion.div
                                className="mb-6"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">Progresso do curso</span>
                                    <span className="font-semibold text-emerald-500">{Math.round(courseProgress)}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${courseProgress}%` }}
                                        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Actions */}
                        <motion.div
                            className="flex flex-col gap-3"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            {nextLessonTitle && onNextLesson && (
                                <Button
                                    onClick={() => {
                                        onNextLesson();
                                        onClose();
                                    }}
                                    className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0"
                                    size="lg"
                                >
                                    <Trophy className="h-4 w-4" />
                                    Próxima Aula
                                </Button>
                            )}
                            
                            {nextLessonTitle && (
                                <p className="text-center text-xs text-muted-foreground">
                                    Próxima: {nextLessonTitle}
                                </p>
                            )}

                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="w-full"
                            >
                                Continuar Explorando
                            </Button>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
