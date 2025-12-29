"use client";

import { useCurrentUser } from "./use-current-user";
import { useOrganizationState } from "@/components/providers/organization-provider";
import { Id } from "@convex/_generated/dataModel";

export function useOrganization() {
    const { user } = useCurrentUser();
    const { selectedOrgId, setSelectedOrgId, clearSelectedOrg } = useOrganizationState();

    // Se for superadmin, preferencialmente usa a organização selecionada (impersonate)
    // Se não houver selecionada, ou se não for superadmin, usa a própria organização do usuário
    const organizationId = (user?.role === "superadmin" && selectedOrgId)
        ? selectedOrgId
        : (user?.organizationId as Id<"organizations"> | undefined);

    return {
        organizationId,
        selectedOrgId,
        setSelectedOrgId,
        clearSelectedOrg,
        isImpersonating: !!(user?.role === "superadmin" && selectedOrgId),
    };
}
