"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { RequireRole } from "src/lib/role-guard";
import { CREATE_CAR } from "src/gql/cars";
import { z } from "zod";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

const Fuel = z.enum(["GAS", "DIESEL", "HYBRID", "EV"]);
const Transmission = z.enum(["AT", "MT", "CVT"]);
const Drive = z.enum(["FWD", "RWD", "AWD"]);

type Form = {
    brand: string;
    model: string;
    year: number;
    price: number;
    mileage: number;
    color?: string;
    fuel: z.infer<typeof Fuel>;
    transmission: z.infer<typeof Transmission>;
    drive: z.infer<typeof Drive>;
    vin?: string;
    description?: string;
    imagesText?: string;
};

const schema = z.object({
    brand: z.string().min(1, "Укажи brand"),
    model: z.string().min(1, "Укажи model"),
    year: z.coerce.number().int().min(1950, "Слишком маленький год").max(2100, "Слишком большой год"),
    price: z.coerce.number().min(0, "Цена не может быть отрицательной"),
    mileage: z.coerce.number().min(0, "Пробег не может быть отрицательным"),
    color: z.string().optional(),
    fuel: Fuel,
    transmission: Transmission,
    drive: Drive,
    vin: z.string().optional(),
    description: z.string().optional(),
    imagesText: z.string().optional(),
});

type CreateCarMutationData = {
    createCar: { id: string };
};

type CreateCarMutationVars = {
    input: {
        brand: string;
        model: string;
        year: number;
        price: number;
        mileage: number;
        color?: string | null;
        fuel: "GAS" | "DIESEL" | "HYBRID" | "EV";
        transmission: "AT" | "MT" | "CVT";
        drive: "FWD" | "RWD" | "AWD";
        vin?: string | null;
        description?: string | null;
        images?: string[] | null;
    };
};

type GqlIssue = { path?: string; message?: string };
type ApolloLikeError = {
    message?: string;
    graphQLErrors?: Array<{
        message?: string;
        extensions?: { issues?: GqlIssue[] };
    }>;
};

function isApolloLikeError(e: unknown): e is ApolloLikeError {
    return !!e && typeof e === "object";
}

function normalizeImages(text?: string): string[] | undefined {
    const t = (text ?? "").trim();
    if (!t) return undefined;

    return t
        .split(/[\n,]/g)
        .map((s) => s.trim())
        .filter(Boolean);
}

export default function NewCarPage() {
    return (
        <RequireRole allow={["MANAGER", "ADMIN"]}>
            <NewCarInner />
        </RequireRole>
    );
}

function NewCarInner() {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);

    const [createCar, { loading }] = useMutation<CreateCarMutationData, CreateCarMutationVars>(CREATE_CAR);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Form>({
        // ВАЖНО: из-за несовпадения типов zod v4 + @hookform/resolvers,
        // zodResolver(schema) типизируется как Resolver<FieldValues>, а useForm<Form> ждёт Resolver<Form>.
        // Поэтому делаем безопасный каст типов. Валидация при этом работает нормально.
        resolver: zodResolver(schema) as unknown as Resolver<Form>,
        defaultValues: {
            brand: "",
            model: "",
            year: new Date().getFullYear(),
            price: 0,
            mileage: 0,
            color: "",
            fuel: "GAS",
            transmission: "AT",
            drive: "FWD",
            vin: "",
            description: "",
            imagesText: "",
        },
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold">CRM: добавить авто</h2>
                    <p className="text-sm text-neutral-400">Доступно для MANAGER/ADMIN</p>
                </div>

                <div className="flex gap-3">
                    <Link className="underline" href="/cars">
                        Каталог
                    </Link>
                    <Link className="underline" href="/profile">
                        Профиль
                    </Link>
                </div>
            </div>

            {serverError && (
                <div className="card-muted whitespace-pre-line border border-red-900/50 bg-red-950/40 text-red-200">
                    {serverError}
                </div>
            )}

            <div className="card">
                <form
                    className="grid gap-3 md:grid-cols-2"
                    onSubmit={handleSubmit(async (v) => {
                        setServerError(null);
                        try {
                            const images = normalizeImages(v.imagesText);

                            const res = await createCar({
                                variables: {
                                    input: {
                                        brand: v.brand.trim(),
                                        model: v.model.trim(),
                                        year: v.year,
                                        price: v.price,
                                        mileage: v.mileage,
                                        color: v.color?.trim() ? v.color.trim() : undefined,
                                        fuel: v.fuel,
                                        transmission: v.transmission,
                                        drive: v.drive,
                                        vin: v.vin?.trim() ? v.vin.trim() : undefined,
                                        description: v.description?.trim() ? v.description.trim() : undefined,
                                        images: images?.length ? images : undefined,
                                    },
                                },
                            });

                            const id = res.data?.createCar?.id;
                            if (!id) {
                                setServerError("Не удалось создать авто (пустой ответ).");
                                return;
                            }

                            router.push(`/cars/${id}`);
                        } catch (e: unknown) {
                            if (isApolloLikeError(e)) {
                                const ge = e.graphQLErrors?.[0];
                                const issues = ge?.extensions?.issues;

                                if (issues?.length) {
                                    setServerError(
                                        issues.map((i) => `${i.path ? `${i.path}: ` : ""}${i.message ?? "Invalid"}`).join("\n")
                                    );
                                    return;
                                }

                                setServerError(ge?.message || e.message || "Ошибка создания авто");
                                return;
                            }

                            setServerError("Ошибка создания авто");
                        }
                    })}
                >
                    <label className="block text-sm">
                        Brand
                        <input className="input mt-1" placeholder="Toyota" {...register("brand")} />
                        {errors.brand && <p className="mt-1 text-xs text-red-300">{errors.brand.message}</p>}
                    </label>

                    <label className="block text-sm">
                        Model
                        <input className="input mt-1" placeholder="Camry" {...register("model")} />
                        {errors.model && <p className="mt-1 text-xs text-red-300">{errors.model.message}</p>}
                    </label>

                    <label className="block text-sm">
                        Year
                        <input className="input mt-1" type="number" {...register("year")} />
                        {errors.year && <p className="mt-1 text-xs text-red-300">{errors.year.message}</p>}
                    </label>

                    <label className="block text-sm">
                        Price
                        <input className="input mt-1" type="number" step="0.01" {...register("price")} />
                        {errors.price && <p className="mt-1 text-xs text-red-300">{errors.price.message}</p>}
                    </label>

                    <label className="block text-sm">
                        Mileage
                        <input className="input mt-1" type="number" step="0.01" {...register("mileage")} />
                        {errors.mileage && <p className="mt-1 text-xs text-red-300">{errors.mileage.message}</p>}
                    </label>

                    <label className="block text-sm">
                        Color (optional)
                        <input className="input mt-1" placeholder="Black" {...register("color")} />
                    </label>

                    <label className="block text-sm">
                        Fuel
                        <select className="select mt-1" {...register("fuel")}>
                            <option value="GAS">GAS</option>
                            <option value="DIESEL">DIESEL</option>
                            <option value="HYBRID">HYBRID</option>
                            <option value="EV">EV</option>
                        </select>
                        {errors.fuel && <p className="mt-1 text-xs text-red-300">{errors.fuel.message}</p>}
                    </label>

                    <label className="block text-sm">
                        Transmission
                        <select className="select mt-1" {...register("transmission")}>
                            <option value="AT">AT</option>
                            <option value="MT">MT</option>
                            <option value="CVT">CVT</option>
                        </select>
                        {errors.transmission && <p className="mt-1 text-xs text-red-300">{errors.transmission.message}</p>}
                    </label>

                    <label className="block text-sm">
                        Drive
                        <select className="select mt-1" {...register("drive")}>
                            <option value="FWD">FWD</option>
                            <option value="RWD">RWD</option>
                            <option value="AWD">AWD</option>
                        </select>
                        {errors.drive && <p className="mt-1 text-xs text-red-300">{errors.drive.message}</p>}
                    </label>

                    <label className="block text-sm">
                        VIN (optional)
                        <input className="input mt-1" placeholder="JTNB11HK..." {...register("vin")} />
                    </label>

                    <label className="block text-sm md:col-span-2">
                        Description (optional)
                        <textarea className="input mt-1 min-h-[90px]" placeholder="Описание..." {...register("description")} />
                    </label>

                    <label className="block text-sm md:col-span-2">
                        Images (optional)
                        <div className="mt-1 text-xs text-neutral-400">
                            Ссылки на изображения через запятую или с новой строки (пример: <code>/uploads/1.jpg</code> или{" "}
                            <code>https://...</code>)
                        </div>
                        <textarea
                            className="input mt-1 min-h-[90px]"
                            placeholder="/uploads/a.jpg, /uploads/b.jpg"
                            {...register("imagesText")}
                        />
                    </label>

                    <div className="md:col-span-2 mt-2 flex gap-2">
                        <button className="btn-primary" disabled={loading} type="submit">
                            {loading ? "Создаю..." : "Создать авто"}
                        </button>
                        <Link className="btn-outline" href="/cars">
                            Отмена
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}