"use client";

import { useState } from "react";
import { Play, Pause, Volume2, VolumeX, Check, Clock } from "lucide-react";

interface AudioVideoQuestionProps {
    question: string;
    mediaUrl: string;
    mediaType: "audio" | "video";
    userAnswer?: string;
    onAnswer?: (answer: string) => void;
    disabled?: boolean;
    showCorrection?: boolean;
    maxLength?: number;
}

export function AudioVideoQuestion({
    question,
    mediaUrl,
    mediaType,
    userAnswer = "",
    onAnswer,
    disabled = false,
    showCorrection = false,
    maxLength = 1000,
}: AudioVideoQuestionProps) {
    const [answer, setAnswer] = useState(userAnswer);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    const handleChange = (value: string) => {
        if (disabled) return;
        setAnswer(value);
        onAnswer?.(value);
    };

    const togglePlay = () => {
        const mediaElement = document.getElementById("quiz-media") as HTMLMediaElement;
        if (mediaElement) {
            if (isPlaying) {
                mediaElement.pause();
            } else {
                mediaElement.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        const mediaElement = document.getElementById("quiz-media") as HTMLMediaElement;
        if (mediaElement) {
            mediaElement.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-gray-900 font-medium">{question}</p>

            {/* Media Player */}
            <div className="bg-gray-900 rounded-xl overflow-hidden">
                {mediaType === "video" ? (
                    <div className="relative">
                        <video
                            id="quiz-media"
                            src={mediaUrl}
                            className="w-full aspect-video"
                            onEnded={() => setIsPlaying(false)}
                            controls={false}
                        />
                        {/* Custom Controls Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={togglePlay}
                                    className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                                >
                                    {isPlaying ? (
                                        <Pause className="w-6 h-6 text-white" />
                                    ) : (
                                        <Play className="w-6 h-6 text-white" />
                                    )}
                                </button>
                                <button
                                    onClick={toggleMute}
                                    className="p-2 text-white hover:text-white/80 transition-colors"
                                >
                                    {isMuted ? (
                                        <VolumeX className="w-5 h-5" />
                                    ) : (
                                        <Volume2 className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 flex items-center gap-4">
                        <button
                            onClick={togglePlay}
                            className="p-4 bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors"
                        >
                            {isPlaying ? (
                                <Pause className="w-8 h-8 text-white" />
                            ) : (
                                <Play className="w-8 h-8 text-white" />
                            )}
                        </button>
                        <div className="flex-1">
                            <audio
                                id="quiz-media"
                                src={mediaUrl}
                                onEnded={() => setIsPlaying(false)}
                                className="w-full"
                            />
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-700 rounded-full h-1">
                                    <div className="bg-indigo-500 h-1 rounded-full w-0" />
                                </div>
                                <button
                                    onClick={toggleMute}
                                    className="p-1 text-gray-400 hover:text-white transition-colors"
                                >
                                    {isMuted ? (
                                        <VolumeX className="w-4 h-4" />
                                    ) : (
                                        <Volume2 className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Área de Resposta */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sua Resposta
                </label>
                <textarea
                    value={answer}
                    onChange={(e) => handleChange(e.target.value)}
                    disabled={disabled}
                    maxLength={maxLength}
                    rows={5}
                    placeholder="Assista/ouça o conteúdo e escreva sua resposta..."
                    className={`
            w-full px-4 py-3 rounded-lg border-2 transition-all resize-none
            ${disabled ? "cursor-not-allowed bg-gray-50" : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"}
          `}
                />
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Resposta dissertativa</span>
                    <span>{answer.length}/{maxLength}</span>
                </div>
            </div>

            {/* Indicador de correção manual */}
            {showCorrection && (
                <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                    <div className="flex items-start gap-3">
                        <div className="p-1 bg-orange-100 rounded">
                            <Clock className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-orange-900">
                                Aguardando Correção Manual
                            </p>
                            <p className="text-xs text-orange-700 mt-1">
                                Esta questão será corrigida pelo professor
                            </p>
                        </div>
                    </div>
                    {answer && (
                        <div className="mt-3 p-3 bg-white rounded border border-orange-100">
                            <p className="text-xs font-medium text-gray-600 mb-1">Sua Resposta:</p>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">{answer}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
