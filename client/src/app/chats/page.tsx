"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { MY_CHATS } from "src/gql/chats";
import { useAuthStore } from "src/store/auth";

export default function ChatsPage() {
  const user = useAuthStore((s) => s.user);
  const { data, loading } = useQuery(MY_CHATS);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Чаты</h2>
        <div className="flex gap-3">
          <Link className="underline" href="/profile">Профиль</Link>
          <Link className="underline" href="/cars">Каталог</Link>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul className="space-y-2">
          {data?.myChats?.map((c: any) => {
            const other = c.participants?.find((p: any) => p.id !== user?.id);
            const title = c.title || (other ? `Chat with ${other.username}` : "Chat");

            return (
              <li key={c.id} className="rounded-2xl border border-neutral-800 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{title}</div>
                    <div className="text-sm text-neutral-400">
                      last: {c.lastMessageAt || "—"}
                    </div>
                  </div>
                  <Link className="underline" href={`/chats/${c.id}`}>Открыть</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
