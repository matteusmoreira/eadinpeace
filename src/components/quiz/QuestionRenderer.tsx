"use client";

import { SingleChoiceQuestion } from "./SingleChoiceQuestion";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { TrueFalseQuestion } from "./TrueFalseQuestion";
import { TextAnswerQuestion } from "./TextAnswerQuestion";
import { MatchFollowingQuestion } from "./MatchFollowingQuestion";
import { SortableQuestion } from "./SortableQuestion";
import { FillBlanksQuestion } from "./FillBlanksQuestion";
import { AudioVideoQuestion } from "./AudioVideoQuestion";

export type QuestionType =
    | "true_false"
    | "single_choice"
    | "multiple_choice"
    | "short_answer"
    | "text_answer"
    | "match_following"
    | "sortable"
    | "fill_blanks"
    | "audio_video";

interface QuestionData {
    type: QuestionType;
    question: string;
    options?: string[];
    correctAnswer?: string;
    correctAnswers?: string[];
    matchPairs?: { prompt: string; promptImage?: string; answer: string; answerImage?: string }[];
    correctOrder?: string[];
    blankAnswers?: string[];
    mediaUrl?: string;
    mediaType?: "audio" | "video";
    userAnswer?: string;
    userAnswers?: string[];
    userMatches?: { prompt: string; answer: string }[];
    userOrder?: string[];
    userBlanks?: string[];
    points?: number;
    explanation?: string;
}

interface QuestionRendererProps {
    question: QuestionData;
    onAnswer?: (answer: any) => void;
    disabled?: boolean;
    showCorrection?: boolean;
    index?: number;
}

export function QuestionRenderer({
    question,
    onAnswer,
    disabled = false,
    showCorrection = false,
    index,
}: QuestionRendererProps) {
    // Renderizar baseado no tipo
    switch (question.type) {
        case "true_false":
            return (
                <TrueFalseQuestion
                    question={question.question}
                    correctAnswer={question.correctAnswer === "true"}
                    userAnswer={question.userAnswer === "true" ? true : question.userAnswer === "false" ? false : undefined}
                    onAnswer={(answer) => onAnswer?.(answer.toString())}
                    disabled={disabled}
                    showCorrection={showCorrection}
                />
            );

        case "single_choice":
            return (
                <SingleChoiceQuestion
                    question={question.question}
                    options={question.options || []}
                    correctAnswer={question.correctAnswer}
                    userAnswer={question.userAnswer}
                    onAnswer={onAnswer}
                    disabled={disabled}
                    showCorrection={showCorrection}
                />
            );

        case "multiple_choice":
            return (
                <MultipleChoiceQuestion
                    question={question.question}
                    options={question.options || []}
                    correctAnswers={question.correctAnswers || []}
                    userAnswers={question.userAnswers || []}
                    onAnswer={onAnswer}
                    disabled={disabled}
                    showCorrection={showCorrection}
                />
            );

        case "short_answer":
            return (
                <TextAnswerQuestion
                    question={question.question}
                    correctAnswer={question.correctAnswer}
                    userAnswer={question.userAnswer}
                    onAnswer={onAnswer}
                    disabled={disabled}
                    showCorrection={showCorrection}
                    maxLength={200}
                    placeholder="Digite uma resposta curta..."
                />
            );

        case "text_answer":
            return (
                <TextAnswerQuestion
                    question={question.question}
                    correctAnswer={question.correctAnswer}
                    userAnswer={question.userAnswer}
                    onAnswer={onAnswer}
                    disabled={disabled}
                    showCorrection={showCorrection}
                    maxLength={1000}
                    placeholder="Digite sua resposta dissertativa..."
                />
            );

        case "match_following":
            return (
                <MatchFollowingQuestion
                    question={question.question}
                    matchPairs={question.matchPairs || []}
                    userMatches={question.userMatches}
                    onAnswer={onAnswer}
                    disabled={disabled}
                    showCorrection={showCorrection}
                />
            );

        case "sortable":
            return (
                <SortableQuestion
                    question={question.question}
                    items={question.correctOrder || []}
                    userOrder={question.userOrder}
                    onAnswer={onAnswer}
                    disabled={disabled}
                    showCorrection={showCorrection}
                />
            );

        case "fill_blanks":
            return (
                <FillBlanksQuestion
                    question={question.question}
                    blankAnswers={question.blankAnswers || []}
                    userBlanks={question.userBlanks}
                    onAnswer={onAnswer}
                    disabled={disabled}
                    showCorrection={showCorrection}
                />
            );

        case "audio_video":
            return (
                <AudioVideoQuestion
                    question={question.question}
                    mediaUrl={question.mediaUrl || ""}
                    mediaType={question.mediaType || "video"}
                    userAnswer={question.userAnswer}
                    onAnswer={onAnswer}
                    disabled={disabled}
                    showCorrection={showCorrection}
                />
            );

        default:
            return (
                <div className="p-6 bg-red-50 rounded-lg border-2 border-red-200">
                    <p className="text-red-600 text-center">
                        Tipo de questão desconhecido
                    </p>
                </div>
            );
    }
}

// Helper para obter label do tipo
export function getQuestionTypeLabel(type: QuestionType): string {
    const labels: Record<QuestionType, string> = {
        true_false: "Verdadeiro/Falso",
        single_choice: "Múltipla Escolha",
        multiple_choice: "Múltiplas Respostas",
        short_answer: "Resposta Curta",
        text_answer: "Dissertativa",
        match_following: "Associar",
        sortable: "Ordenar",
        fill_blanks: "Preencher Lacunas",
        audio_video: "Áudio/Vídeo",
    };
    return labels[type] || type;
}

// Helper para verificar se requer correção manual
export function requiresManualGrading(type: QuestionType): boolean {
    return ["text_answer", "match_following", "sortable", "fill_blanks", "audio_video"].includes(type);
}
