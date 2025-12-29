"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Id } from "@convex/_generated/dataModel";

interface OrganizationContextType {
    selectedOrgId: Id<"organizations"> | null;
    setSelectedOrgId: (id: Id<"organizations"> | null) => void;
    clearSelectedOrg: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
    const [selectedOrgId, setSelectedOrgIdState] = useState<Id<"organizations"> | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        const savedOrgId = localStorage.getItem("superadmin_selected_org_id");
        if (savedOrgId) {
            setSelectedOrgIdState(savedOrgId as Id<"organizations">);
        }
    }, []);

    const setSelectedOrgId = (id: Id<"organizations"> | null) => {
        setSelectedOrgIdState(id);
        if (id) {
            localStorage.setItem("superadmin_selected_org_id", id);
        } else {
            localStorage.removeItem("superadmin_selected_org_id");
        }
    };

    const clearSelectedOrg = () => {
        setSelectedOrgId(null);
    };

    return (
        <OrganizationContext.Provider value={{ selectedOrgId, setSelectedOrgId, clearSelectedOrg }}>
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganizationState() {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error("useOrganizationState must be used within an OrganizationProvider");
    }
    return context;
}
