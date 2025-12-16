"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { RequireRole } from "src/lib/role-guard";
import { USERS, SET_USER_ROLE } from "src/gql/admin";
import Link from "next/link";

export default function AdminUsersPage() {
  return (
    <RequireRole allow={["ADMIN"]}>
      <AdminUsersInner />
    </RequireRole>
  );
}

function AdminUsersInner() {
  const { data, loading, refetch } = useQuery(USERS);
  const [setRole, { loading: saving }] = useMutation(SET_USER_ROLE);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Админ: роли пользователей</h2>
        <div className="flex gap-3">
          <Link className="underline" href="/profile">Профиль</Link>
          <Link className="underline" href="/cars">Каталог</Link>
        </div>
      </div>

      <ul className="space-y-2">
        {data?.users?.map((u: any) => (
          <li key={u.id} className="rounded-2xl border border-neutral-800 p-3">
            <div className="font-semibold">
              {u.username} <span className="text-neutral-400">({u.email})</span>
            </div>
            <div className="text-sm text-neutral-300">role: {u.role}</div>

            <div className="mt-2 flex flex-wrap gap-2">
              {(["CLIENT", "MANAGER", "ADMIN"] as const).map((r) => (
                <button
                  key={r}
                  className="rounded-xl border border-neutral-700 px-3 py-1 text-sm"
                  disabled={saving}
                  onClick={async () => {
                    await setRole({ variables: { userId: u.id, role: r } });
                    await refetch();
                  }}
                >
                  set {r}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
