// Types for Certificate Builder

export interface CertificateElement {
    id: string;
    type: "text" | "image" | "shape" | "qrcode" | "signature";
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    // Text properties
    content?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    textAlign?: string;
    color?: string;
    // Image/Shape properties
    src?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    borderRadius?: number;
    opacity?: number;
    shapeType?: "rectangle" | "circle" | "line";
}

export interface CertificateTemplate {
    _id: string;
    organizationId: string;
    name: string;
    description?: string;
    isDefault: boolean;
    width: number;
    height: number;
    backgroundColor: string;
    backgroundImage?: string;
    elements: CertificateElement[];
    createdBy: string;
    createdAt: number;
    updatedAt: number;
}

export interface DraggableElementProps {
    element: CertificateElement;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (updates: Partial<CertificateElement>) => void;
    onDelete: () => void;
    scale: number;
}

export interface CanvasAreaProps {
    width: number;
    height: number;
    backgroundColor: string;
    backgroundImage?: string;
    elements: CertificateElement[];
    selectedElementId: string | null;
    onSelectElement: (id: string | null) => void;
    onUpdateElement: (id: string, updates: Partial<CertificateElement>) => void;
    onDeleteElement: (id: string) => void;
    onAddElement: (element: CertificateElement) => void;
    scale: number;
}

export type TextPlaceholder =
    | "{{studentName}}"
    | "{{courseName}}"
    | "{{issueDate}}"
    | "{{courseHours}}"
    | "{{certificateCode}}"
    | "{{instructorName}}"
    | "{{organizationName}}";

export const TEXT_PLACEHOLDERS: { label: string; value: TextPlaceholder }[] = [
    { label: "Nome do Aluno", value: "{{studentName}}" },
    { label: "Nome do Curso", value: "{{courseName}}" },
    { label: "Data de Emissão", value: "{{issueDate}}" },
    { label: "Carga Horária", value: "{{courseHours}}" },
    { label: "Código do Certificado", value: "{{certificateCode}}" },
    { label: "Nome do Instrutor", value: "{{instructorName}}" },
    { label: "Nome da Organização", value: "{{organizationName}}" },
];

export const DEFAULT_FONTS = [
    "Inter",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Playfair Display",
    "Georgia",
    "Times New Roman",
];

export const DEFAULT_TEXT_ELEMENT: Partial<CertificateElement> = {
    type: "text",
    width: 200,
    height: 40,
    fontSize: 24,
    fontFamily: "Inter",
    fontWeight: "normal",
    textAlign: "center",
    color: "#1e293b",
    content: "Texto",
};

export const DEFAULT_SHAPE_ELEMENT: Partial<CertificateElement> = {
    type: "shape",
    width: 100,
    height: 100,
    fill: "#7c3aed",
    stroke: "transparent",
    strokeWidth: 0,
    borderRadius: 0,
    opacity: 1,
    shapeType: "rectangle",
};

export const DEFAULT_IMAGE_ELEMENT: Partial<CertificateElement> = {
    type: "image",
    width: 150,
    height: 150,
    borderRadius: 0,
    opacity: 1,
};
