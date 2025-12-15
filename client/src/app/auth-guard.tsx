"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "src/store/auth";

const PUBLIC_PATHS = ["/", "/login", "/register"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const token = useAuthStore((s) => s.token);

    const isPublic = useMemo(() => PUBLIC_PATHS.includes(pathname), [pathname]);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!mounted) return;
        if (!token && !isPublic) router.replace("/login");
    }, [mounted, token, isPublic, router]);

    if (!mounted) return <div className="p-4">Loading...</div>;
    if (!token && !isPublic) return <div className="p-4">Redirecting...</div>;

    return <>{children}</>;
}
