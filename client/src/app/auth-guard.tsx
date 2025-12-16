"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "src/store/auth";

const PUBLIC_PATHS = ["/", "/login", "/register"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  const isPublic = useMemo(() => PUBLIC_PATHS.includes(pathname), [pathname]);

  useEffect(() => {
    if (!hydrated) return;
    if (!token && !isPublic) router.replace("/login");
  }, [hydrated, token, isPublic, router]);

  if (!hydrated) return <div className="p-4">Loading...</div>;
  if (!token && !isPublic) return <div className="p-4">Redirecting...</div>;

  return <>{children}</>;
}
