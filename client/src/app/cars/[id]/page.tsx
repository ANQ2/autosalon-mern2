"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { CAR } from "src/gql/cars";
import { CREATE_INQUIRY } from "src/gql/inquiries";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  type: z.enum(["TEST_DRIVE", "RESERVE", "QUESTION"]),
  message: z.string().optional(),
  preferredDate: z.string().optional()
});
type Form = z.infer<typeof schema>;

export default function CarPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const carId = params.id;

  const { data, loading } = useQuery(CAR, { variables: { id: carId } });
  const [createInquiry, { loading: creating }] = useMutation(CREATE_INQUIRY);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { type: "TEST_DRIVE", message: "", preferredDate: "" }
  });

  const type = watch("type");

  if (loading) return <div>Loading...</div>;
  const car = data?.car;
  if (!car) return <div>Car not found</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link className="underline" href="/cars">← Назад</Link>
        <Link className="underline" href="/profile">Профиль</Link>
      </div>

      <div className="rounded-2xl border border-neutral-800 p-4">
        <div className="text-2xl font-bold">{car.brand} {car.model}</div>
        <div className="text-neutral-400">
          year: {car.year} • price: {car.price} • mileage: {car.mileage} • fuel: {car.fuel} • status: {car.status}
        </div>
        {car.color && <div className="text-neutral-400">color: {car.color}</div>}
      </div>

      <div className="rounded-2xl border border-neutral-800 p-4 space-y-3">
        <h3 className="text-lg font-semibold">Создать заявку</h3>

        <form
          className="space-y-2"
          onSubmit={handleSubmit(async (values) => {
            await createInquiry({
              variables: {
                input: {
                  carId,
                  type: values.type,
                  message: values.message || null,
                  preferredDate: values.preferredDate || null
                }
              }
            });
            alert("Заявка создана");
            router.push("/profile");
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
              Предпочтительная дата (строкой)
              <input className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 p-2" {...register("preferredDate")} placeholder="Например: завтра 18:00" />
            </label>
          )}

          <label className="block text-sm">
            Сообщение
            <textarea className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900 p-2" rows={3} {...register("message")} placeholder="Комментарий/вопрос..." />
          </label>

          <button className="rounded-xl bg-white px-4 py-2 text-black" disabled={creating}>
            Отправить
          </button>
        </form>
      </div>
    </div>
  );
}
