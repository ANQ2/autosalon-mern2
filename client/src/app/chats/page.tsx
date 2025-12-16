"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { MY_CHATS } from "src/gql/chats";
import { useAuthStore } from "src/store/auth";

type UserLite = {
    id: string;
    username: string;
    role: "CLIENT" | "MANAGER" | "ADMIN";
};

type ChatListItem = {
    id: string;
    status: "OPEN" | "CLOSED";
    lastMessageAt: string | null;
    customer: UserLite | null;
    manager: UserLite | null;
    car: { id: string } | null;
    lastMessage: {
        id: string;
        text: string;
        kind: "TEXT" | "SYSTEM";
        createdAt: string;
        author: UserLite;
    } | null;
};

type MyChatsQueryData = {
    myChats: ChatListItem[];
};

function formatLast(ts: string | null | undefined): string {
    if (!ts) return "—";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return ts;
    return d.toLocaleString();
}

export default function ChatsPage() {
    const user = useAuthStore((s) => s.user);
    const { data, loading } = useQuery<MyChatsQueryData>(MY_CHATS);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Чаты</h2>
                <div className="flex gap-3">
                    <Link className="underline" href="/profile">
                        Профиль
                    </Link>
                    <Link className="underline" href="/cars">
                        Каталог
                    </Link>
                </div>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <ul className="space-y-2">
                    {(data?.myChats ?? []).map((c) => {
                        const meId = user?.id;

                        const customerName = c.customer?.username ?? "customer";
                        const managerName = c.manager?.username ?? "manager";

                        const title =
                            meId && c.customer?.id === meId
                                ? `Чат с менеджером: ${managerName}`
                                : meId && c.manager?.id === meId
                                    ? `Чат с клиентом: ${customerName}`
                                    : `Чат: ${customerName} ↔ ${managerName}`;

                        const preview = c.lastMessage?.text
                            ? c.lastMessage.text.length > 80
                                ? `${c.lastMessage.text.slice(0, 80)}…`
                                : c.lastMessage.text
                            : "—";

                        return (
                            <li key={c.id} className="rounded-2xl border border-neutral-800 p-3">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="font-semibold truncate">
                                            {title} <span className="text-neutral-500">({c.status})</span>
                                        </div>
                                        <div className="text-sm text-neutral-400">
                                            last: {formatLast(c.lastMessageAt)} • {preview}
                                        </div>
                                    </div>

                                    <Link className="underline shrink-0" href={`/chats/${c.id}`}>
                                        Открыть
                                    </Link>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}