"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LOGIN } from "src/gql/auth";
import { useAuthStore } from "src/store/auth";
import { useState } from "react";

const schema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(4, "Минимум 4 символа")
});
type Form = z.infer<typeof schema>;

function getGqlErrorMessage(e: any): string {
  // ApolloError -> graphQLErrors[0].message
  const msg =
    e?.graphQLErrors?.[0]?.message ||
    e?.networkError?.message ||
    e?.message ||
    "Ошибка входа";
  return String(msg);
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [login, { loading }] = useMutation(LOGIN);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" }
  });

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Вход</h2>
        <p className="text-sm text-neutral-400">
          Войдите, чтобы открыть каталог, чаты и CRM по роли.
        </p>
      </div>

      <div className="card space-y-3">
        {formError && (
          <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {formError}
          </div>
        )}

        <form
          className="space-y-3"
          onSubmit={handleSubmit(async (values) => {
            setFormError(null);
            try {
              const res = await login({ variables: { input: values } });
              const payload = res.data?.login;
              if (!payload?.token || !payload?.user) {
                setFormError("Не удалось получить токен/пользователя");
                return;
              }
              setAuth(payload.token, payload.user);
              router.replace("/profile");
            } catch (e: any) {
              setFormError(getGqlErrorMessage(e));
            }
          })}
        >
          <label className="block text-sm">
            Email
            <input
              className="input mt-1"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-300">{errors.email.message}</p>
            )}
          </label>

          <label className="block text-sm">
            Пароль
            <input
              type="password"
              className="input mt-1"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-300">
                {errors.password.message}
              </p>
            )}
          </label>

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Входим..." : "Войти"}
          </button>

          <div className="flex items-center justify-between text-sm text-neutral-400">
            <span>Нет аккаунта?</span>
            <Link className="underline hover:text-white" href="/register">
              Регистрация →
            </Link>
          </div>
        </form>
      </div>

      <div className="card-muted space-y-2 text-sm text-neutral-300">
        <div className="font-semibold">Demo users</div>
        <div className="text-neutral-400">
          admin@demo.kz / 123456 <br />
          manager@demo.kz / 123456 <br />
          client@demo.kz / 123456
        </div>
      </div>
    </div>
  );
}
