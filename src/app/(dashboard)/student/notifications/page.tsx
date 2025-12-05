"use client";

import { NotificationsPage } from "@/components/notifications";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function StudentNotificationsPage() {
    const { user } = useUser();

    const convexUser = useQuery(api.users.getByClerkId, {
        clerkId: user?.id || ""
    });

    if (!convexUser) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return <NotificationsPage userId={convexUser._id} />;
}
