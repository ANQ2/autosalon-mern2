"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, type Role } from "src/store/auth";

export function RequireRole({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const allowKey = useMemo(() => allow.join("|"), [allow]);

  useEffect(() => {
    if (!user) return;
    if (!allow.includes(user.role)) router.replace("/");
  }, [user, allowKey, router]); 

  if (!user) return <div className="p-4">Loading...</div>;
  if (!allow.includes(user.role)) return <div className="p-4">No access</div>;

  return <>{children}</>;
}
