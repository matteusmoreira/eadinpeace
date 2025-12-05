"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    GraduationCap,
    Settings,
    BarChart3,
    Building2,
    CreditCard,
    FileText,
    Trophy,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Shield,
    UserCog,
    Play,
    Award,
    HelpCircle,
    Bell,
    Palette,
    Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type UserRole = "superadmin" | "admin" | "professor" | "student";

interface MenuItem {
    title: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
}

interface MenuSection {
    title: string;
    roles: UserRole[];
    items: MenuItem[];
}

// Menu organizado por seções
const menuSections: MenuSection[] = [
    // ===== COMUM A TODOS =====
    {
        title: "Menu",
        roles: ["superadmin", "admin", "professor", "student"],
        items: [
            { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        ],
    },

    // ===== SUPERADMIN =====
    {
        title: "Gestão Global",
        roles: ["superadmin"],
        items: [
            { title: "Organizações", href: "/superadmin/organizations", icon: Building2 },
            { title: "Usuários", href: "/superadmin/users", icon: Users },
            { title: "Planos", href: "/superadmin/plans", icon: CreditCard },
            { title: "Pagamentos", href: "/superadmin/payments", icon: CreditCard },
        ],
    },
    {
        title: "Analytics",
        roles: ["superadmin"],
        items: [
            { title: "Relatórios Globais", href: "/superadmin/reports", icon: BarChart3 },
            { title: "Métricas", href: "/superadmin/metrics", icon: Trophy },
        ],
    },
    {
        title: "Sistema",
        roles: ["superadmin"],
        items: [
            { title: "Configurações", href: "/superadmin/settings", icon: Settings },
            { title: "Aparência", href: "/superadmin/appearance", icon: Palette },
        ],
    },

    // ===== ADMIN =====
    {
        title: "Gestão",
        roles: ["admin"],
        items: [
            { title: "Usuários", href: "/admin/users", icon: Users },
            { title: "Professores", href: "/admin/professors", icon: GraduationCap },
            { title: "Alunos", href: "/admin/students", icon: Users },
        ],
    },
    {
        title: "Conteúdo",
        roles: ["admin"],
        items: [
            { title: "Cursos", href: "/admin/courses", icon: BookOpen },
            { title: "Categorias", href: "/admin/categories", icon: FileText },
        ],
    },
    {
        title: "Relatórios",
        roles: ["admin"],
        items: [
            { title: "Relatórios", href: "/admin/reports", icon: BarChart3 },
            { title: "Certificados", href: "/admin/certificates", icon: Award },
            { title: "Anúncios", href: "/admin/announcements", icon: Bell },
        ],
    },

    // ===== PROFESSOR =====
    {
        title: "Ensino",
        roles: ["professor"],
        items: [
            { title: "Meus Cursos", href: "/professor/courses", icon: BookOpen },
            { title: "Criar Curso", href: "/professor/courses/new", icon: Play, badge: "Novo" },
        ],
    },
    {
        title: "Avaliações",
        roles: ["professor"],
        items: [
            { title: "Quizzes", href: "/professor/quizzes", icon: HelpCircle },
            { title: "Resultados", href: "/professor/results", icon: BarChart3 },
        ],
    },
    {
        title: "Alunos",
        roles: ["professor"],
        items: [
            { title: "Meus Alunos", href: "/professor/students", icon: Users },
            { title: "Mensagens", href: "/professor/messages", icon: MessageSquare },
        ],
    },

    // ===== STUDENT =====
    {
        title: "Aprendizado",
        roles: ["student"],
        items: [
            { title: "Meus Cursos", href: "/student/courses", icon: GraduationCap },
            { title: "Continuar", href: "/student/continue", icon: Play },
            { title: "Buscar", href: "/student/search", icon: Search },
        ],
    },
    {
        title: "Progresso",
        roles: ["student"],
        items: [
            { title: "Meu Progresso", href: "/student/progress", icon: Trophy },
            { title: "Avaliações", href: "/student/quizzes", icon: HelpCircle },
            { title: "Certificados", href: "/student/certificates", icon: Award },
        ],
    },
    {
        title: "Comunidade",
        roles: ["student"],
        items: [
            { title: "Fórum", href: "/student/community", icon: MessageSquare },
            { title: "Ranking", href: "/student/ranking", icon: Trophy },
            { title: "Notificações", href: "/student/notifications", icon: Bell },
        ],
    },

    // ===== CONFIGURAÇÕES (para admin, professor, student) =====
    {
        title: "Conta",
        roles: ["admin", "professor", "student"],
        items: [
            { title: "Configurações", href: "/settings", icon: Settings },
            { title: "Notificações", href: "/notifications", icon: Bell },
        ],
    },
];

interface SidebarProps {
    role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const { signOut } = useClerk();
    const { user } = useUser();

    const filteredSections = menuSections.filter((section) =>
        section.roles.includes(role)
    );

    const showExpanded = !isCollapsed || isHovering;

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsCollapsed(true);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const roleLabels: Record<UserRole, { label: string; color: string }> = {
        superadmin: { label: "Super Admin", color: "gradient-bg" },
        admin: { label: "Administrador", color: "bg-primary" },
        professor: { label: "Professor", color: "bg-amber-500" },
        student: { label: "Aluno", color: "bg-emerald-500" },
    };

    return (
        <TooltipProvider delayDuration={0}>
            <motion.aside
                initial={false}
                animate={{ width: showExpanded ? 280 : 80 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                onMouseEnter={() => isCollapsed && setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className={cn(
                    "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar",
                    "flex flex-col shadow-lg"
                )}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
                    <AnimatePresence mode="wait">
                        {showExpanded ? (
                            <motion.div
                                key="full-logo"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center">
                                    <GraduationCap className="h-5 w-5 text-white" />
                                </div>
                                <span className="font-bold text-lg gradient-text">EAD Pro</span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="small-logo"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex justify-center w-full"
                            >
                                <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center">
                                    <GraduationCap className="h-5 w-5 text-white" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {showExpanded && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="h-8 w-8"
                        >
                            {isCollapsed ? (
                                <ChevronRight className="h-4 w-4" />
                            ) : (
                                <ChevronLeft className="h-4 w-4" />
                            )}
                        </Button>
                    )}
                </div>

                {/* Role Badge */}
                {showExpanded && (
                    <div className="px-4 py-3 border-b border-sidebar-border">
                        <Badge className={cn("w-full justify-center py-1", roleLabels[role].color, "text-white border-0")}>
                            {role === "superadmin" && <Shield className="h-3 w-3 mr-1" />}
                            {role === "admin" && <UserCog className="h-3 w-3 mr-1" />}
                            {role === "professor" && <GraduationCap className="h-3 w-3 mr-1" />}
                            {role === "student" && <Users className="h-3 w-3 mr-1" />}
                            {roleLabels[role].label}
                        </Badge>
                    </div>
                )}

                {/* Navigation */}
                <ScrollArea className="flex-1 py-4">
                    <nav className="space-y-6 px-3">
                        {filteredSections.map((section, sectionIndex) => (
                            <div key={section.title}>
                                {/* Section Title */}
                                {showExpanded && (
                                    <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {section.title}
                                    </h3>
                                )}

                                {/* Section Items */}
                                <div className="space-y-1">
                                    {section.items.map((item) => {
                                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                        const Icon = item.icon;

                                        const linkContent = (
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                                                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                                    isActive
                                                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                                                        : "text-sidebar-foreground"
                                                )}
                                            >
                                                <Icon className={cn("h-5 w-5 shrink-0", isActive && "animate-pulse")} />
                                                <AnimatePresence mode="wait">
                                                    {showExpanded && (
                                                        <motion.span
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -10 }}
                                                            transition={{ duration: 0.15 }}
                                                            className="text-sm font-medium whitespace-nowrap flex-1"
                                                        >
                                                            {item.title}
                                                        </motion.span>
                                                    )}
                                                </AnimatePresence>
                                                {showExpanded && item.badge && (
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                        {item.badge}
                                                    </Badge>
                                                )}
                                            </Link>
                                        );

                                        if (!showExpanded) {
                                            return (
                                                <Tooltip key={item.href}>
                                                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                                    <TooltipContent side="right" className="font-medium">
                                                        {item.title}
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        }

                                        return <div key={item.href}>{linkContent}</div>;
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                </ScrollArea>

                <Separator />

                {/* User Profile */}
                <div className="p-3">
                    <div
                        className={cn(
                            "flex items-center gap-3 rounded-lg p-2",
                            "bg-sidebar-accent/50"
                        )}
                    >
                        <Avatar className="h-9 w-9 border-2 border-sidebar-primary">
                            <AvatarImage src={user?.imageUrl} />
                            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                                {user?.firstName?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <AnimatePresence mode="wait">
                            {showExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex-1 overflow-hidden"
                                >
                                    <p className="text-sm font-medium truncate">
                                        {user?.fullName || "Usuário"}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {user?.primaryEmailAddress?.emailAddress}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {showExpanded && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0"
                                        onClick={() => signOut()}
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Sair</TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </div>
            </motion.aside>
        </TooltipProvider>
    );
}
