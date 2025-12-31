"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { CertificateBuilder } from "@/components/certificate-builder";
import { CertificateElement } from "@/components/certificate-builder/types";
import { Id } from "@convex/_generated/dataModel";
import { Loader2 } from "lucide-react";

export default function EditTemplatePage() {
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const templateId = params.id as Id<"certificateTemplates">;
    const [isSaving, setIsSaving] = useState(false);

    // Get template
    const template = useQuery(
        api.certificateTemplates.getById,
        templateId ? { templateId } : "skip"
    );

    // Update mutation
    const updateTemplate = useMutation(api.certificateTemplates.update);

    const handleSave = async (data: {
        name: string;
        elements: CertificateElement[];
        width: number;
        height: number;
        backgroundColor: string;
        backgroundImage?: string;
    }) => {
        if (!templateId) return;

        setIsSaving(true);
        try {
            await updateTemplate({
                templateId,
                name: data.name,
                width: data.width,
                height: data.height,
                backgroundColor: data.backgroundColor,
                backgroundImage: data.backgroundImage,
                elements: data.elements,
            });
            router.push("/admin/certificates/templates");
        } finally {
            setIsSaving(false);
        }
    };

    if (template === undefined) {
        return (
            <div className="h-[calc(100vh-80px)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (template === null) {
        return (
            <div className="h-[calc(100vh-80px)] flex items-center justify-center">
                <p className="text-muted-foreground">Template não encontrado</p>
            </div>
        );
    }

    return (
        <CertificateBuilder
            templateId={templateId}
            templateName={template.name}
            initialElements={template.elements as CertificateElement[]}
            initialWidth={template.width}
            initialHeight={template.height}
            initialBackgroundColor={template.backgroundColor}
            initialBackgroundImage={template.backgroundImage}
            onSave={handleSave}
            isSaving={isSaving}
        />
    );
}
