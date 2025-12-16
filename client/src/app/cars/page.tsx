"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { CARS } from "src/gql/cars";

type Fuel = "GAS" | "DIESEL" | "HYBRID" | "EV";
type CarStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "ARCHIVED";

type CarListItem = {
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    mileage: number;
    fuel: Fuel;
    status: CarStatus;
    color: string | null;
    transmission?: string | null;
    drive?: string | null;
};

type CarFilterInput = {
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    fuel?: Fuel;
    status?: CarStatus;
};

type CarsQueryData = {
    cars: CarListItem[];
};

type CarsQueryVars = {
    filter?: CarFilterInput;
};

function isFuel(v: string): v is Fuel {
    return v === "GAS" || v === "DIESEL" || v === "HYBRID" || v === "EV";
}

function isCarStatus(v: string): v is CarStatus {
    return v === "AVAILABLE" || v === "RESERVED" || v === "SOLD" || v === "ARCHIVED";
}

function StatusBadge({ status }: { status: CarStatus }) {
    if (status === "AVAILABLE") return <span className="badge-green">AVAILABLE</span>;
    if (status === "RESERVED") return <span className="badge-yellow">RESERVED</span>;
    if (status === "SOLD") return <span className="badge-red">SOLD</span>;
    return <span className="badge">ARCHIVED</span>;
}

export default function CarsPage() {
    const [brand, setBrand] = useState("");
    const [minPrice, setMinPrice] = useState<string>("");
    const [maxPrice, setMaxPrice] = useState<string>("");
    const [fuel, setFuel] = useState<Fuel | "">("");
    const [status, setStatus] = useState<CarStatus | "">("");

    const filter = useMemo<CarFilterInput | undefined>(() => {
        const f: CarFilterInput = {};
        if (brand.trim()) f.brand = brand.trim();
        if (minPrice) f.minPrice = Number(minPrice);
        if (maxPrice) f.maxPrice = Number(maxPrice);
        if (fuel) f.fuel = fuel;
        if (status) f.status = status;
        return Object.keys(f).length ? f : undefined;
    }, [brand, minPrice, maxPrice, fuel, status]);

    const { data, loading, refetch } = useQuery<CarsQueryData, CarsQueryVars>(CARS, { variables: { filter } });

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight">Каталог машин</h2>
                <p className="text-sm text-neutral-400">Фильтруй по бренду, цене, топливу и статусу.</p>
            </div>

            <div className="card">
                <div className="grid gap-2 md:grid-cols-5">
                    <input
                        className="input"
                        placeholder="Brand (Toyota)"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                    />
                    <input
                        className="input"
                        placeholder="Min price"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <input
                        className="input"
                        placeholder="Max price"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                    />

                    <select
                        className="select"
                        value={fuel}
                        onChange={(e) => {
                            const v = e.target.value;
                            if (v === "") return setFuel("");
                            if (isFuel(v)) return setFuel(v);
                            setFuel("");
                        }}
                    >
                        <option value="">Fuel: any</option>
                        <option value="GAS">GAS</option>
                        <option value="DIESEL">DIESEL</option>
                        <option value="HYBRID">HYBRID</option>
                        <option value="EV">EV</option>
                    </select>

                    <select
                        className="select"
                        value={status}
                        onChange={(e) => {
                            const v = e.target.value;
                            if (v === "") return setStatus("");
                            if (isCarStatus(v)) return setStatus(v);
                            setStatus("");
                        }}
                    >
                        <option value="">Status: any</option>
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="RESERVED">RESERVED</option>
                        <option value="SOLD">SOLD</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                    </select>

                    <div className="md:col-span-5 mt-2 flex flex-wrap gap-2">
                        <button className="btn-primary" onClick={() => refetch({ filter })}>
                            Применить
                        </button>
                        <button
                            className="btn-outline"
                            onClick={() => {
                                setBrand("");
                                setMinPrice("");
                                setMaxPrice("");
                                setFuel("");
                                setStatus("");
                                refetch({ filter: undefined });
                            }}
                        >
                            Сброс
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="card-muted">Loading...</div>
            ) : !data?.cars?.length ? (
                <div className="card-muted text-neutral-300">Нет машин по заданным фильтрам.</div>
            ) : (
                <ul className="grid gap-3 md:grid-cols-2">
                    {data.cars.map((c) => (
                        <li key={c.id} className="card">
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-2">
                                    <div className="text-lg font-semibold">
                                        {c.brand} {c.model} <span className="text-neutral-400">({c.year})</span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <StatusBadge status={c.status} />
                                        <span className="badge">{c.fuel}</span>
                                        {c.transmission && <span className="badge">{c.transmission}</span>}
                                        {c.drive && <span className="badge">{c.drive}</span>}
                                    </div>

                                    <div className="text-sm text-neutral-300">
                                        <span className="text-neutral-400">Цена:</span> {c.price} •{" "}
                                        <span className="text-neutral-400">Пробег:</span> {c.mileage}
                                    </div>
                                </div>

                                <Link className="btn-outline" href={`/cars/${c.id}`}>
                                    Открыть
                                </Link>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}