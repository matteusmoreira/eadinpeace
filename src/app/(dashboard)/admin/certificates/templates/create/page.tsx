"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { CertificateBuilder } from "@/components/certificate-builder";
import { CertificateElement } from "@/components/certificate-builder/types";
import { Loader2 } from "lucide-react";

export default function CreateTemplatePage() {
    const { user } = useUser();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    // Get current user
    const currentUser = useQuery(
        api.users.getByClerkId,
        user?.id ? { clerkId: user.id } : "skip"
    );

    // Create mutation
    const createTemplate = useMutation(api.certificateTemplates.create);

    const handleSave = async (data: {
        name: string;
        elements: CertificateElement[];
        width: number;
        height: number;
        backgroundColor: string;
        backgroundImage?: string;
    }) => {
        if (!currentUser?.organizationId) return;

        setIsSaving(true);
        try {
            const templateId = await createTemplate({
                organizationId: currentUser.organizationId,
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

    if (!currentUser) {
        return (
            <div className="h-[calc(100vh-80px)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Default elements for a new template
    const defaultElements: CertificateElement[] = [
        {
            id: "title-1",
            type: "text",
            x: 378,
            y: 50,
            width: 300,
            height: 50,
            content: "CERTIFICADO DE CONCLUSÃO",
            fontSize: 28,
            fontFamily: "Inter",
            fontWeight: "bold",
            textAlign: "center",
            color: "#7c3aed",
        },
        {
            id: "desc-1",
            type: "text",
            x: 328,
            y: 150,
            width: 400,
            height: 30,
            content: "Certificamos que",
            fontSize: 16,
            fontFamily: "Inter",
            fontWeight: "normal",
            textAlign: "center",
            color: "#64748b",
        },
        {
            id: "student-name",
            type: "text",
            x: 228,
            y: 200,
            width: 600,
            height: 60,
            content: "{{studentName}}",
            fontSize: 36,
            fontFamily: "Inter",
            fontWeight: "bold",
            textAlign: "center",
            color: "#1e293b",
        },
        {
            id: "desc-2",
            type: "text",
            x: 328,
            y: 280,
            width: 400,
            height: 30,
            content: "concluiu com sucesso o curso",
            fontSize: 16,
            fontFamily: "Inter",
            fontWeight: "normal",
            textAlign: "center",
            color: "#64748b",
        },
        {
            id: "course-name",
            type: "text",
            x: 228,
            y: 320,
            width: 600,
            height: 50,
            content: "{{courseName}}",
            fontSize: 28,
            fontFamily: "Inter",
            fontWeight: "semibold",
            textAlign: "center",
            color: "#1e293b",
        },
        {
            id: "date",
            type: "text",
            x: 328,
            y: 420,
            width: 400,
            height: 30,
            content: "{{issueDate}}",
            fontSize: 14,
            fontFamily: "Inter",
            fontWeight: "normal",
            textAlign: "center",
            color: "#64748b",
        },
        {
            id: "code",
            type: "text",
            x: 378,
            y: 700,
            width: 300,
            height: 25,
            content: "Código: {{certificateCode}}",
            fontSize: 12,
            fontFamily: "Inter",
            fontWeight: "normal",
            textAlign: "center",
            color: "#94a3b8",
        },
    ];

    return (
        <CertificateBuilder
            templateName="Novo Modelo"
            initialElements={defaultElements}
            onSave={handleSave}
            isSaving={isSaving}
        />
    );
}
