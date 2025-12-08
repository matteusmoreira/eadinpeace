import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

interface CertificateData {
    code: string;
    userName: string;
    courseTitle: string;
    instructorName?: string;
    organizationName?: string;
    issuedAt: number;
    courseDuration?: number;
}

export async function generateCertificatePDF(data: CertificateData): Promise<void> {
    // Create a temporary container for the certificate
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "1056px"; // A4 landscape width at 96dpi
    container.style.backgroundColor = "#ffffff";

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        if (hours === 0) return "< 1 hora";
        return `${hours} hora${hours > 1 ? "s" : ""}`;
    };

    // Certificate HTML template
    container.innerHTML = `
        <div style="
            width: 1056px;
            height: 816px;
            padding: 48px;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            position: relative;
            box-sizing: border-box;
        ">
            <!-- Decorative border -->
            <div style="
                position: absolute;
                top: 16px;
                left: 16px;
                right: 16px;
                bottom: 16px;
                border: 3px solid #7c3aed;
                border-radius: 8px;
                pointer-events: none;
            "></div>
            
            <!-- Corner decorations -->
            <div style="position: absolute; top: 24px; left: 24px; width: 60px; height: 60px; border-top: 4px solid #7c3aed; border-left: 4px solid #7c3aed;"></div>
            <div style="position: absolute; top: 24px; right: 24px; width: 60px; height: 60px; border-top: 4px solid #7c3aed; border-right: 4px solid #7c3aed;"></div>
            <div style="position: absolute; bottom: 24px; left: 24px; width: 60px; height: 60px; border-bottom: 4px solid #7c3aed; border-left: 4px solid #7c3aed;"></div>
            <div style="position: absolute; bottom: 24px; right: 24px; width: 60px; height: 60px; border-bottom: 4px solid #7c3aed; border-right: 4px solid #7c3aed;"></div>
            
            <!-- Content -->
            <div style="
                position: relative;
                z-index: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                text-align: center;
            ">
                <!-- Organization -->
                ${data.organizationName ? `
                    <p style="
                        font-size: 14px;
                        color: #64748b;
                        margin: 0 0 8px 0;
                        letter-spacing: 2px;
                        text-transform: uppercase;
                    ">${data.organizationName}</p>
                ` : ""}
                
                <!-- Icon -->
                <div style="
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 16px;
                ">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="8" r="6"/>
                        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
                    </svg>
                </div>
                
                <!-- Title -->
                <h1 style="
                    font-size: 32px;
                    font-weight: 700;
                    color: #7c3aed;
                    margin: 0 0 8px 0;
                    letter-spacing: 4px;
                ">CERTIFICADO DE CONCLUSÃO</h1>
                
                <p style="
                    font-size: 16px;
                    color: #64748b;
                    margin: 0 0 24px 0;
                ">Este certificado é concedido a</p>
                
                <!-- Student Name -->
                <h2 style="
                    font-size: 40px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0 0 8px 0;
                ">${data.userName}</h2>
                
                <div style="width: 200px; height: 2px; background: linear-gradient(90deg, transparent, #7c3aed, transparent); margin: 16px 0;"></div>
                
                <!-- Course Info -->
                <p style="
                    font-size: 16px;
                    color: #64748b;
                    margin: 0 0 16px 0;
                ">Por ter concluído com sucesso o curso</p>
                
                <h3 style="
                    font-size: 28px;
                    font-weight: 600;
                    color: #1e293b;
                    margin: 0 0 16px 0;
                    max-width: 700px;
                ">${data.courseTitle}</h3>
                
                ${data.instructorName ? `
                    <p style="
                        font-size: 14px;
                        color: #64748b;
                        margin: 0 0 32px 0;
                    ">Ministrado por ${data.instructorName}</p>
                ` : '<div style="margin-bottom: 32px;"></div>'}
                
                <!-- Details Grid -->
                <div style="display: flex; gap: 48px; margin-bottom: 32px;">
                    <div style="text-align: center;">
                        <p style="font-size: 12px; color: #64748b; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">Data de Emissão</p>
                        <p style="font-size: 16px; font-weight: 600; color: #1e293b; margin: 0;">${formatDate(data.issuedAt)}</p>
                    </div>
                    ${data.courseDuration ? `
                        <div style="text-align: center;">
                            <p style="font-size: 12px; color: #64748b; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">Carga Horária</p>
                            <p style="font-size: 16px; font-weight: 600; color: #1e293b; margin: 0;">${formatDuration(data.courseDuration)}</p>
                        </div>
                    ` : ""}
                    <div style="text-align: center;">
                        <p style="font-size: 12px; color: #64748b; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">Status</p>
                        <p style="font-size: 16px; font-weight: 600; color: #10b981; margin: 0;">Válido</p>
                    </div>
                </div>
                
                <!-- Verification Code -->
                <div style="
                    background: #f1f5f9;
                    padding: 12px 24px;
                    border-radius: 8px;
                ">
                    <p style="font-size: 12px; color: #64748b; margin: 0 0 4px 0;">Código de Verificação</p>
                    <p style="font-size: 18px; font-weight: 600; font-family: monospace; color: #1e293b; margin: 0; letter-spacing: 2px;">${data.code}</p>
                </div>
                
                <!-- Footer -->
                <p style="
                    position: absolute;
                    bottom: 40px;
                    font-size: 11px;
                    color: #94a3b8;
                ">Verifique a autenticidade em: ${typeof window !== "undefined" ? window.location.origin : ""}/certificate/${data.code}</p>
            </div>
        </div>
    `;

    document.body.appendChild(container);

    try {
        // Generate canvas from HTML
        const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
        });

        // Create PDF (landscape A4)
        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4",
        });

        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

        // Download the PDF
        const fileName = `certificado_${data.courseTitle.replace(/\s+/g, "_").toLowerCase()}_${data.code}.pdf`;
        pdf.save(fileName);
    } finally {
        document.body.removeChild(container);
    }
}
