"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { CAR } from "src/gql/cars";
import { CREATE_LEAD } from "src/gql/inquiries";
import { CREATE_CAR_CHAT, SEND_MESSAGE } from "src/gql/chats";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

const schema = z.object({
    type: z.enum(["TEST_DRIVE", "RESERVE", "QUESTION"]),
    message: z.string().optional(),
    preferredDate: z.string().optional(), // datetime-local возвращает строку
});
type Form = z.infer<typeof schema>;

type Car = {
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    mileage: number;
    fuel: string;
    status: string;
    color: string | null;
    images: string[];
};

type CarQueryData = {
    car: Car | null;
};

type CarQueryVars = {
    id: string;
};

type CreateLeadVars = {
    input: {
        carId: string;
        type: Form["type"];
        message: string | null;
        preferredDate: string | null;
    };
};

type CreateCarChatData = {
    createCarChat: { id: string };
};
type CreateCarChatVars = {
    carId: string;
};

type SendMessageData = {
    sendMessage: { id: string };
};
type SendMessageVars = {
    chatId: string;
    text: string;
};

type ApolloLikeError = {
    message?: string;
    graphQLErrors?: Array<{
        message?: string;
        extensions?: { issues?: Array<{ path?: string; message?: string }> };
    }>;
    networkError?: { message?: string };
};

function isApolloLikeError(e: unknown): e is ApolloLikeError {
    return !!e && typeof e === "object";
}

function getErrText(e: unknown): string {
    if (!isApolloLikeError(e)) return "Ошибка";
    const ge = e.graphQLErrors?.[0];
    const issues = ge?.extensions?.issues;
    if (issues?.length) {
        return issues.map((i) => `${i.path ? `${i.path}: ` : ""}${i.message ?? "Invalid"}`).join("\n");
    }
    return ge?.message || e.networkError?.message || e.message || "Ошибка";
}

function buildLeadMessage(values: Form): string {
    const parts: string[] = [];
    parts.push(`Новая заявка: ${values.type}`);
    if (values.preferredDate?.trim()) {
        // Форматируем дату красиво для сообщения
        const date = new Date(values.preferredDate);
        const formatted = date.toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
        parts.push(`Дата: ${formatted}`);
    }
    if (values.message?.trim()) parts.push(`Сообщение: ${values.message.trim()}`);
    return parts.join("\n");
}

export default function CarPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const carId = params.id;

    const { data, loading } = useQuery<CarQueryData, CarQueryVars>(CAR, { variables: { id: carId } });

    const [createLead, { loading: creatingLead }] = useMutation<unknown, CreateLeadVars>(CREATE_LEAD);
    const [createCarChat, { loading: creatingChat }] = useMutation<CreateCarChatData, CreateCarChatVars>(CREATE_CAR_CHAT);
    const [sendMessage, { loading: sending }] = useMutation<SendMessageData, SendMessageVars>(SEND_MESSAGE);

    const [formError, setFormError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<Form>({
        resolver: zodResolver(schema),
        defaultValues: { type: "TEST_DRIVE", message: "", preferredDate: "" },
    });

    const type = watch("type");

    if (loading) return <div>Loading...</div>;

    const car = data?.car;
    if (!car) return <div>Car not found</div>;

    const busy = creatingLead || creatingChat || sending;

    // Минимальная дата = сейчас (формат datetime-local: "YYYY-MM-DDTHH:MM")
    const minDateTime = new Date().toISOString().slice(0, 16);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Link className="underline" href="/cars">
                    ← Назад
                </Link>
                <Link className="underline" href="/profile">
                    Профиль
                </Link>
            </div>

            <div className="rounded-2xl border border-neutral-800 p-4">
                <div className="text-2xl font-bold">
                    {car.brand} {car.model}
                </div>
                <div className="text-neutral-400">
                    year: {car.year} • price: {car.price} • mileage: {car.mileage} • fuel: {car.fuel} • status: {car.status}
                </div>
                {car.color && <div className="text-neutral-400">color: {car.color}</div>}
            </div>

            <div className="rounded-2xl border border-neutral-800 p-4 space-y-3">
                <h3 className="text-lg font-semibold">Создать заявку</h3>

                {formError && (
                    <div className="whitespace-pre-line rounded-xl border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                        {formError}
                    </div>
                )}

                <form
                    className="space-y-2"
                    onSubmit={handleSubmit(async (values) => {
                        setFormError(null);
                        try {
                            // Конвертируем datetime-local строку (YYYY-MM-DDTHH:MM) в ISO 8601
                            const preferredDateISO = values.preferredDate?.trim()
                                ? new Date(values.preferredDate).toISOString()
                                : null;

                            // 1) создаём заявку
                            await createLead({
                                variables: {
                                    input: {
                                        carId,
                                        type: values.type,
                                        message: values.message?.trim() || null,
                                        preferredDate: preferredDateISO,
                                    },
                                },
                            });

                            // 2) создаём/получаем чат по машине
                            const chatRes = await createCarChat({ variables: { carId } });
                            const chatId = chatRes.data?.createCarChat?.id;
                            if (!chatId) {
                                setFormError("Не удалось создать чат");
                                return;
                            }

                            // 3) отправляем сообщение в чат
                            const text = buildLeadMessage(values);
                            await sendMessage({ variables: { chatId, text } });

                            // 4) редирект в чат
                            router.push(`/chats/${chatId}`);
                        } catch (e: unknown) {
                            setFormError(getErrText(e));
                        }
                    })}
                >
                    <label className="block text-sm">
                        Тип заявки
                        <select className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 p-2" {...register("type")}>
                            <option value="TEST_DRIVE">TEST_DRIVE</option>
                            <option value="RESERVE">RESERVE</option>
                            <option value="QUESTION">QUESTION</option>
                        </select>
                        {errors.type && <p className="text-xs text-red-400">{errors.type.message}</p>}
                    </label>

                    {(type === "TEST_DRIVE" || type === "RESERVE") && (
                        <label className="block text-sm">
                            Предпочтительная дата и время
                            <input
                                type="datetime-local"
                                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 p-2"
                                {...register("preferredDate")}
                                min={minDateTime}
                            />
                            <p className="mt-1 text-xs text-neutral-500">Выберите удобное для вас время</p>
                        </label>
                    )}

                    <label className="block text-sm">
                        Сообщение
                        <textarea
                            className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 p-2"
                            rows={3}
                            {...register("message")}
                            placeholder="Комментарий/вопрос..."
                        />
                    </label>

                    <button className="rounded-xl bg-white px-4 py-2 text-black" disabled={busy}>
                        {busy ? "Отправляю..." : "Отправить"}
                    </button>
                </form>
            </div>
        </div>
    );
}