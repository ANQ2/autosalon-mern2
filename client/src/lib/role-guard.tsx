"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, type Role } from "src/store/auth";

export function RequireRole({
                                allow,
                                children
                            }: {
    allow: Role[];
    children: React.ReactNode;
}) {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        if (!user) return;
        if (!allow.includes(user.role)) router.replace("/profile");
    }, [user, allow, router]);

    if (!user) return <div className="p-4">Loading...</div>;
    if (!allow.includes(user.role)) return <div className="p-4">No access</div>;

    return <>{children}</>;
}
