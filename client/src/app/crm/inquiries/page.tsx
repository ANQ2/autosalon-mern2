"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client/react";
import { RequireRole } from "src/lib/role-guard";
import { CRM_LEADS, UPDATE_LEAD_STATUS } from "src/gql/inquiries";
import { CREATE_CAR_CHAT } from "src/gql/chats";
import { useRouter } from "next/navigation";

type LeadStatus = "NEW" | "IN_PROGRESS" | "APPROVED" | "REJECTED";

type Lead = {
    id: string;
    type: string;
    status: LeadStatus;
    preferredDate?: string | null;
    message?: string | null;
    managerComment?: string | null;
    car: {
        id: string;
        brand: string;
        model: string;
    };
    customer: {
        id: string;
        username: string;
        email: string;
    };
};

type CrmLeadsQueryData = {
    crmLeads: Lead[];
};

type UpdateLeadStatusMutationData = {
    updateLeadStatus: { id: string; status: LeadStatus; managerComment?: string | null };
};

type UpdateLeadStatusMutationVars = {
    leadId: string;
    status: LeadStatus;
};

type CreateCarChatMutationData = {
    createCarChat: { id: string };
};

type CreateCarChatMutationVars = {
    carId: string;
};

export default function CrmInquiriesPage() {
    return (
        <RequireRole allow={["MANAGER", "ADMIN"]}>
            <CrmInquiriesInner />
        </RequireRole>
    );
}

function CrmInquiriesInner() {
    const router = useRouter();

    const { data, loading, refetch } = useQuery<CrmLeadsQueryData>(CRM_LEADS);

    const [updateStatus] = useMutation<UpdateLeadStatusMutationData, UpdateLeadStatusMutationVars>(UPDATE_LEAD_STATUS);

    const [createCarChat] = useMutation<CreateCarChatMutationData, CreateCarChatMutationVars>(CREATE_CAR_CHAT);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">CRM: заявки</h2>
                <div className="flex gap-3">
                    <Link className="underline" href="/profile">
                        Профиль
                    </Link>
                    <Link className="underline" href="/cars">
                        Каталог
                    </Link>
                    <Link className="underline" href="/crm/cars/new">
                        Добавить авто
                    </Link>
                </div>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <ul className="space-y-2">
                    {(data?.crmLeads ?? []).map((x: Lead) => (
                        <li key={x.id} className="rounded-2xl border border-neutral-800 p-3 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="font-semibold">
                                        {x.car.brand} {x.car.model} — {x.type}
                                    </div>
                                    <div className="text-sm text-neutral-400">
                                        user: {x.customer.username} ({x.customer.email})
                                    </div>
                                    <div className="text-sm text-neutral-300">status: {x.status}</div>
                                    {x.preferredDate && <div className="text-sm text-neutral-400">date: {x.preferredDate}</div>}
                                    {x.message && <div className="text-sm text-neutral-300">msg: {x.message}</div>}
                                    {x.managerComment && <div className="text-sm text-neutral-400">comment: {x.managerComment}</div>}
                                </div>

                                <button
                                    className="rounded-xl border border-neutral-700 px-3 py-2 text-sm"
                                    onClick={async () => {
                                        const res = await createCarChat({ variables: { carId: x.car.id } });
                                        const chatId = res.data?.createCarChat.id;
                                        if (!chatId) return;
                                        router.push(`/chats/${chatId}`);
                                    }}
                                >
                                    Открыть чат
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {(["NEW", "IN_PROGRESS", "APPROVED", "REJECTED"] as const).map((st) => (
                                    <button
                                        key={st}
                                        className="rounded-xl border border-neutral-700 px-3 py-1 text-sm"
                                        onClick={async () => {
                                            await updateStatus({ variables: { leadId: x.id, status: st } });

                                            const comment = prompt("Комментарий менеджера (optional):");
                                            if (comment && comment.trim().length > 0) {
                                                alert(
                                                    "Комментарий менеджера сейчас не сохраняется этой кнопкой, потому что в схеме нет update с managerComment. Если нужно — добавим отдельную мутацию на бэке."
                                                );
                                            }

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