"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQuery, useSubscription } from "@apollo/client/react";
import { MY_INQUIRIES, INQUIRY_UPDATED } from "src/gql/inquiries";
import { useAuthStore } from "src/store/auth";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const { data, loading, refetch } = useQuery(MY_INQUIRIES);
  const sub = useSubscription(INQUIRY_UPDATED);

  useEffect(() => {
    if (sub.data?.inquiryUpdated?.id) refetch();
  }, [sub.data, refetch]);

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Профиль</h2>
          <p className="text-neutral-400">{user.email} • {user.role}</p>
        </div>

        <button
          className="rounded-xl border border-neutral-700 px-3 py-2 text-sm"
          onClick={() => { logout(); location.href = "/login"; }}
        >
          Выйти
        </button>
      </div>

      <div className="flex gap-4">
        <Link className="underline" href="/cars">Каталог</Link>
        <Link className="underline" href="/chats">Чаты</Link>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Мои заявки</h3>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <ul className="space-y-2">
            {data?.myInquiries?.map((x: any) => (
              <li key={x.id} className="rounded-xl border border-neutral-800 p-3">
                <div className="font-semibold">{x.car.brand} {x.car.model}</div>
                <div className="text-sm text-neutral-300">status: {x.status} • type: {x.type}</div>
                {x.managerComment && <div className="text-sm text-neutral-400">Комментарий: {x.managerComment}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
