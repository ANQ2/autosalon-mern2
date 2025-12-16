"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useSubscription } from "@apollo/client/react";
import { CHAT, MESSAGES, MESSAGE_ADDED, SEND_MESSAGE } from "src/gql/chats";

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const chatId = params.id;

  const { data: chatData } = useQuery(CHAT, { variables: { id: chatId } });
  const { data: msgData, loading, refetch } = useQuery(MESSAGES, { variables: { chatId, limit: 50 } });
  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE);

  const sub = useSubscription(MESSAGE_ADDED, { variables: { chatId } });
  const [text, setText] = useState("");

  // простой подход: при новом сообщении — refetch
  useEffect(() => {
    if (sub.data?.messageAdded?.id) refetch();
  }, [sub.data, refetch]);

  const title = useMemo(() => chatData?.chat?.title ?? "Chat", [chatData]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link className="underline" href="/chats">← Чаты</Link>
        <div className="text-neutral-300">{title}</div>
        <Link className="underline" href="/profile">Профиль</Link>
      </div>

      <div className="rounded-2xl border border-neutral-800 p-3 space-y-2">
        <div className="text-sm text-neutral-400">Сообщения</div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-2">
            {msgData?.messages?.map((m: any) => (
              <div key={m.id} className="rounded-xl border border-neutral-900 bg-neutral-950 p-2">
                <div className="text-sm text-neutral-400">
                  {m.sender.username} • {new Date(m.createdAt).toLocaleString()}
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
              if (!text.trim()) return;
              await sendMessage({ variables: { input: { chatId, text: text.trim() } } });
              setText("");
              await refetch();
            }
          }}
        />
        <button
          className="rounded-xl bg-white px-4 py-2 text-black"
          disabled={sending}
          onClick={async () => {
            if (!text.trim()) return;
            await sendMessage({ variables: { input: { chatId, text: text.trim() } } });
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
