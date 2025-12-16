"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { REGISTER } from "src/gql/auth";
import { useAuthStore } from "src/store/auth";
import type { User } from "src/store/auth";
import { useState } from "react";

const schema = z.object({
    email: z.string().email("Введите корректный email"),
    username: z.string().min(3, "Минимум 3 символа"),
    password: z.string().min(4, "Минимум 4 символа"),
    phone: z.string().optional(),
});
type Form = z.infer<typeof schema>;

type RegisterMutationData = {
    register: {
        token: string;
        user: User;
    } | null;
};

type RegisterMutationVars = {
    input: Form;
};

type ApolloLikeErrorShape = {
    message?: string;
    networkError?: { message?: string } | null;
    graphQLErrors?: Array<{
        message?: string;
        extensions?: {
            code?: string;
            issues?: Array<{ path?: string; message?: string }>;
        };
    }> | null;
};

function isApolloLikeError(e: unknown): e is ApolloLikeErrorShape {
    return !!e && typeof e === "object";
}

function getGqlErrorMessage(e: unknown): string {
    if (isApolloLikeError(e)) {
        const ge = e.graphQLErrors?.[0];
        const issues = ge?.extensions?.issues;

        // серверный zod parseOrThrow отдаёт: extensions.issues: [{ path, message }]
        if (issues && issues.length > 0) {
            return issues
                .map((i) => `${i.path ? `${i.path}: ` : ""}${i.message ?? "Invalid value"}`)
                .join("\n");
        }

        return ge?.message || e.networkError?.message || e.message || "Ошибка регистрации";
    }

    return "Ошибка регистрации";
}

export default function RegisterPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);

    const [reg, { loading }] = useMutation<RegisterMutationData, RegisterMutationVars>(REGISTER);
    const [formError, setFormError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Form>({
        resolver: zodResolver(schema),
        defaultValues: { email: "", username: "", password: "", phone: "" },
    });

    return (
        <div className="mx-auto max-w-4xl">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Left promo panel */}
                <div className="card hidden md:block">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2">
                            <div className="h-10 w-10 rounded-2xl bg-white/10 ring-1 ring-white/10 grid place-items-center">
                                🚗
                            </div>
                            <div>
                                <div className="text-lg font-semibold">AUTOSALON</div>
                                <div className="text-xs text-neutral-400">MERN2 · Next.js · GraphQL</div>
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold leading-tight">
                            Быстрая регистрация <span className="text-neutral-400">и доступ к каталогу</span>
                        </h1>

                        <p className="text-sm text-neutral-300">
                            Клиент видит каталог, заявки и чаты. Роли <b>MANAGER</b>/<b>ADMIN</b> назначаются админом.
                        </p>

                        <div className="flex flex-wrap gap-2">
                            <span className="badge">JWT + роли</span>
                            <span className="badge">Защита маршрутов</span>
                            <span className="badge">Real-time чат</span>
                            <span className="badge">CRM заявки</span>
                        </div>

                        <div className="card-muted">
                            <div className="text-xs text-neutral-400">Подсказка</div>
                            <div className="mt-1 text-sm">
                                После регистрации ты попадёшь в профиль. Если роль ADMIN — появится управление пользователями.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right form */}
                <div className="card">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">Регистрация</h2>
                        <p className="text-sm text-neutral-400">Создай аккаунт клиента, чтобы войти в систему.</p>
                    </div>

                    {formError && (
                        <div className="mt-4 whitespace-pre-line rounded-xl border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                            {formError}
                        </div>
                    )}

                    <form
                        className="mt-4 space-y-3"
                        onSubmit={handleSubmit(async (values) => {
                            setFormError(null);
                            try {
                                // ВАЖНО: пустой phone превращаем в undefined, иначе бэк может валидировать формат и падать
                                const input: Form = {
                                    ...values,
                                    email: values.email.trim(),
                                    username: values.username.trim(),
                                    password: values.password,
                                    phone: values.phone?.trim() ? values.phone.trim() : undefined,
                                };

                                const res = await reg({ variables: { input } });
                                const payload = res.data?.register;

                                if (!payload?.token || !payload?.user) {
                                    setFormError("Не удалось получить токен/пользователя");
                                    return;
                                }

                                setAuth(payload.token, payload.user);
                                router.replace("/profile");
                            } catch (e: unknown) {
                                setFormError(getGqlErrorMessage(e));
                            }
                        })}
                    >
                        <label className="block text-sm">
                            Email
                            <input className="input mt-1" placeholder="you@example.com" {...register("email")} />
                            {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email.message}</p>}
                        </label>

                        <label className="block text-sm">
                            Username
                            <input className="input mt-1" placeholder="например, arsen" {...register("username")} />
                            {errors.username && <p className="mt-1 text-xs text-red-300">{errors.username.message}</p>}
                        </label>

                        <label className="block text-sm">
                            Пароль
                            <input type="password" className="input mt-1" placeholder="••••••••" {...register("password")} />
                            {errors.password && <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>}
                        </label>

                        <label className="block text-sm">
                            Телефон (необязательно)
                            <input className="input mt-1" placeholder="+7 777 777 77 77" {...register("phone")} />
                        </label>

                        <button className="btn-primary w-full" disabled={loading}>
                            {loading ? "Создаём..." : "Создать аккаунт"}
                        </button>

                        <div className="flex items-center justify-between text-sm text-neutral-400">
                            <span>Уже есть аккаунт?</span>
                            <Link className="link" href="/login">
                                Войти →
                            </Link>
                        </div>
                    </form>
                </div>
            </div>

            {/* mobile footer hint */}
            <div className="mt-6 md:hidden card-muted">
                Роли <b>MANAGER</b>/<b>ADMIN</b> назначаются админом. После регистрации ты попадёшь в профиль.
            </div>
        </div>
    );
}