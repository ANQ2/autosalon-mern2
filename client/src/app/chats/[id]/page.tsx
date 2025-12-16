"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useSubscription } from "@apollo/client/react";
import { CHAT, MESSAGES, MESSAGE_ADDED, SEND_MESSAGE } from "src/gql/chats";

type User = {
    username: string;
};

type Message = {
    id: string;
    text: string;
    kind: "TEXT" | "SYSTEM";
    createdAt: string;
    author: User;
};

type ChatQueryData = {
    chat: {
        id: string;
        status: "OPEN" | "CLOSED";
        car: { id: string } | null;
        customer: { id: string; username: string } | null;
        manager: { id: string; username: string } | null;
    } | null;
};

type ChatQueryVars = {
    id: string;
};

type MessagesQueryData = {
    chatMessages: Message[];
};

type MessagesQueryVars = {
    chatId: string;
};

type MessageAddedSubData = {
    messageAdded: Message | null;
};

type MessageAddedSubVars = {
    chatId: string;
};

type SendMessageMutationData = {
    sendMessage: Message;
};

type SendMessageMutationVars = {
    chatId: string;
    text: string;
};

export default function ChatPage() {
    const params = useParams<{ id: string }>();
    const chatId = params.id;

    const { data: chatData } = useQuery<ChatQueryData, ChatQueryVars>(CHAT, {
        variables: { id: chatId },
    });

    const { data: msgData, loading, refetch } = useQuery<MessagesQueryData, MessagesQueryVars>(MESSAGES, {
        variables: { chatId },
    });

    const [sendMessage, { loading: sending }] = useMutation<SendMessageMutationData, SendMessageMutationVars>(SEND_MESSAGE);

    const sub = useSubscription<MessageAddedSubData, MessageAddedSubVars>(MESSAGE_ADDED, {
        variables: { chatId },
    });

    const [text, setText] = useState("");

    useEffect(() => {
        if (sub.data?.messageAdded?.id) refetch();
    }, [sub.data?.messageAdded?.id, refetch]);

    const title = useMemo(() => {
        const c = chatData?.chat;
        if (!c) return "Chat";
        const who = c.customer?.username ?? "customer";
        const manager = c.manager?.username ?? "manager";
        return `Chat (${c.status}) • ${who} ↔ ${manager}`;
    }, [chatData]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Link className="underline" href="/chats">
                    ← Чаты
                </Link>
                <div className="text-neutral-300">{title}</div>
                <Link className="underline" href="/profile">
                    Профиль
                </Link>
            </div>

            <div className="rounded-2xl border border-neutral-800 p-3 space-y-2">
                <div className="text-sm text-neutral-400">Сообщения</div>

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="space-y-2">
                        {(msgData?.chatMessages ?? []).map((m: Message) => (
                            <div key={m.id} className="rounded-xl border border-neutral-900 bg-neutral-950 p-2">
                                <div className="text-sm text-neutral-400">
                                    {m.author.username} • {new Date(m.createdAt).toLocaleString()} • {m.kind}
                                </div>
                                <div>{m.text}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <input
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-2"
                    placeholder="Написать сообщение..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={async (e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            const t = text.trim();
                            if (!t) return;
                            await sendMessage({ variables: { chatId, text: t } });
                            setText("");
                            await refetch();
                        }
                    }}
                />
                <button
                    className="rounded-xl bg-white px-4 py-2 text-black"
                    disabled={sending}
                    onClick={async () => {
                        const t = text.trim();
                        if (!t) return;
                        await sendMessage({ variables: { chatId, text: t } });
                        setText("");
                        await refetch();
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    );
}