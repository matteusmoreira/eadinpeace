"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Play,
    X,
    SkipForward,
    Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AutoplayCountdownProps {
    /** Título da próxima lição */
    nextLessonTitle: string;
    /** Thumbnail da próxima lição (opcional) */
    nextLessonThumbnail?: string;
    /** Duração do countdown em segundos (default: 5) */
    countdownDuration?: number;
    /** Callback quando countdown termina */
    onCountdownComplete: () => void;
    /** Callback quando usuário cancela */
    onCancel: () => void;
    /** Se o modal está visível */
    isOpen: boolean;
}

export function AutoplayCountdown({
    nextLessonTitle,
    nextLessonThumbnail,
    countdownDuration = 5,
    onCountdownComplete,
    onCancel,
    isOpen,
}: AutoplayCountdownProps) {
    const [secondsRemaining, setSecondsRemaining] = useState(countdownDuration);
    const [isPaused, setIsPaused] = useState(false);

    // Reset countdown quando modal abre
    useEffect(() => {
        if (isOpen) {
            setSecondsRemaining(countdownDuration);
            setIsPaused(false);
        }
    }, [isOpen, countdownDuration]);

    // Countdown timer
    useEffect(() => {
        if (!isOpen || isPaused) return;

        if (secondsRemaining <= 0) {
            onCountdownComplete();
            return;
        }

        const timer = setTimeout(() => {
            setSecondsRemaining((prev) => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [isOpen, isPaused, secondsRemaining, onCountdownComplete]);

    const progress = ((countdownDuration - secondsRemaining) / countdownDuration) * 100;

    const handleTogglePause = () => {
        setIsPaused((prev) => !prev);
    };

    const handleSkip = () => {
        onCountdownComplete();
    };

    const handleCancel = () => {
        setIsPaused(true);
        onCancel();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-full max-w-md mx-4 bg-card rounded-xl shadow-2xl overflow-hidden"
                    >
                        {/* Header com botão de fechar */}
                        <div className="absolute top-3 right-3 z-10">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancel}
                                className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Thumbnail ou placeholder */}
                        <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5">
                            {nextLessonThumbnail ? (
                                <img
                                    src={nextLessonThumbnail}
                                    alt={nextLessonTitle}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative">
                                        {/* Círculo de progresso */}
                                        <svg className="w-24 h-24 -rotate-90">
                                            <circle
                                                cx="48"
                                                cy="48"
                                                r="44"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                className="text-muted/30"
                                            />
                                            <circle
                                                cx="48"
                                                cy="48"
                                                r="44"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                strokeDasharray={276.46}
                                                strokeDashoffset={276.46 - (276.46 * progress) / 100}
                                                className="text-primary transition-all duration-1000"
                                            />
                                        </svg>
                                        {/* Número do countdown */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-3xl font-bold text-primary">
                                                {secondsRemaining}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Overlay com play animado */}
                            {nextLessonThumbnail && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="w-16 h-16 rounded-full bg-primary flex items-center justify-center"
                                    >
                                        <Play className="h-8 w-8 text-primary-foreground ml-1" fill="currentColor" />
                                    </motion.div>
                                </div>
                            )}
                        </div>

                        {/* Conteúdo */}
                        <div className="p-4 space-y-4">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">
                                    Próxima aula em {secondsRemaining} segundos
                                </p>
                                <h3 className="font-semibold text-lg line-clamp-2">
                                    {nextLessonTitle}
                                </h3>
                            </div>

                            {/* Barra de progresso */}
                            <Progress value={progress} className="h-1" />

                            {/* Botões de ação */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleTogglePause}
                                >
                                    {isPaused ? (
                                        <>
                                            <Play className="h-4 w-4 mr-2" />
                                            Continuar
                                        </>
                                    ) : (
                                        <>
                                            <Pause className="h-4 w-4 mr-2" />
                                            Pausar
                                        </>
                                    )}
                                </Button>
                                <Button
                                    className="flex-1 gradient-bg border-0"
                                    onClick={handleSkip}
                                >
                                    <SkipForward className="h-4 w-4 mr-2" />
                                    Ir Agora
                                </Button>
                            </div>

                            <Button
                                variant="ghost"
                                className="w-full text-muted-foreground"
                                onClick={handleCancel}
                            >
                                Não, ficar aqui
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default AutoplayCountdown;
