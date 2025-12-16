"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useMutation, useQuery, useSubscription } from "@apollo/client/react";
import { RequireRole } from "src/lib/role-guard";
import { INQUIRIES, UPDATE_INQUIRY_STATUS, INQUIRY_UPDATED } from "src/gql/inquiries";
import { CREATE_CHAT } from "src/gql/chats";
import { useRouter } from "next/navigation";

export default function CrmInquiriesPage() {
  return (
    <RequireRole allow={["MANAGER", "ADMIN"]}>
      <CrmInquiriesInner />
    </RequireRole>
  );
}

function CrmInquiriesInner() {
  const router = useRouter();
  const { data, loading, refetch } = useQuery(INQUIRIES);
  const [updateStatus] = useMutation(UPDATE_INQUIRY_STATUS);
  const [createChat] = useMutation(CREATE_CHAT);
  const sub = useSubscription(INQUIRY_UPDATED);

  useEffect(() => {
    if (sub.data?.inquiryUpdated?.id) refetch();
  }, [sub.data, refetch]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">CRM: заявки</h2>
        <div className="flex gap-3">
          <Link className="underline" href="/profile">Профиль</Link>
          <Link className="underline" href="/cars">Каталог</Link>
          <Link className="underline" href="/crm/cars/new">Добавить авто</Link>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul className="space-y-2">
          {data?.inquiries?.map((x: any) => (
            <li key={x.id} className="rounded-2xl border border-neutral-800 p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {x.car.brand} {x.car.model} — {x.type}
                  </div>
                  <div className="text-sm text-neutral-400">
                    user: {x.user.username} ({x.user.email})
                  </div>
                  <div className="text-sm text-neutral-300">
                    status: {x.status}
                  </div>
                  {x.preferredDate && <div className="text-sm text-neutral-400">date: {x.preferredDate}</div>}
                  {x.message && <div className="text-sm text-neutral-300">msg: {x.message}</div>}
                  {x.managerComment && <div className="text-sm text-neutral-400">comment: {x.managerComment}</div>}
                </div>

                <button
                  className="rounded-xl border border-neutral-700 px-3 py-2 text-sm"
                  onClick={async () => {
                    const res = await createChat({
                      variables: { input: { otherUserId: x.user.id, inquiryId: x.id, title: `Inquiry #${x.id}` } }
                    });
                    const chatId = res.data.createChat.id;
                    router.push(`/chats/${chatId}`);
                  }}
                >
                  Открыть чат
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {["NEW", "IN_PROGRESS", "APPROVED", "REJECTED"].map((st) => (
                  <button
                    key={st}
                    className="rounded-xl border border-neutral-700 px-3 py-1 text-sm"
                    onClick={async () => {
                      const comment = prompt("Комментарий менеджера (optional):") ?? "";
                      await updateStatus({
                        variables: { input: { inquiryId: x.id, status: st, managerComment: comment || null } }
                      });
                      await refetch();
                    }}
                  >
                    set {st}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
