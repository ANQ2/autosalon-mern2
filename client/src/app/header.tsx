"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "src/store/auth";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={active ? "btn-ghost bg-neutral-900 text-white" : "btn-ghost"}
    >
      {label}
    </Link>
  );
}

export default function Header() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!token) return null;

  return (
    <header className="mb-6 flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/cars" className="text-lg font-semibold tracking-tight">
          Autosalon
        </Link>

        <span className="badge">{user?.role ?? "—"}</span>
        <span className="text-sm text-neutral-400">{user?.email}</span>
      </div>

      <nav className="flex flex-wrap items-center gap-2">
        <NavLink href="/cars" label="Каталог" />
        <NavLink href="/chats" label="Чаты" />
        <NavLink href="/profile" label="Профиль" />

        {(user?.role === "MANAGER" || user?.role === "ADMIN") && (
          <NavLink href="/crm/cars/new" label="Добавить авто" />
        )}

        {user?.role === "ADMIN" && (
          <NavLink href="/admin/users" label="Пользователи" />
        )}

        <button className="btn-outline" onClick={logout}>
          Выйти
        </button>
      </nav>
    </header>
  );
}
