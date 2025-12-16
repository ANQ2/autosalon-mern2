"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "src/store/auth";

export default function HomePage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (token) router.replace("/cars");
  }, [token, router]);

  return (
    <div className="card space-y-5">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Autosalon</h1>
        <p className="text-neutral-300">
          Каталог автомобилей, заявки на тест-драйв/бронь и чат клиент ↔ менеджер с реалтайм обновлениями.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="card-muted">
          <div className="font-semibold">Каталог</div>
          <div className="text-sm text-neutral-400">Фильтры, карточки, статусы авто</div>
        </div>
        <div className="card-muted">
          <div className="font-semibold">CRM</div>
          <div className="text-sm text-neutral-400">Менеджеры создают авто и ведут заявки</div>
        </div>
        <div className="card-muted">
          <div className="font-semibold">Чат</div>
          <div className="text-sm text-neutral-400">Сообщения через GraphQL Subscriptions</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link className="btn-primary" href="/login">
          Войти
        </Link>
        <Link className="btn-outline" href="/register">
          Регистрация
        </Link>
        <Link className="btn-ghost" href="/cars">
          Перейти в каталог →
        </Link>
      </div>

      <div className="text-sm text-neutral-400">
        Роли: <span className="badge">CLIENT</span> <span className="badge">MANAGER</span>{" "}
        <span className="badge">ADMIN</span>
      </div>
    </div>
  );
}
