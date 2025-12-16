"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { CARS } from "src/gql/cars";

type Fuel = "GAS" | "DIESEL" | "HYBRID" | "EV";
type CarStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "ARCHIVED";

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

  const filter = useMemo(() => {
    const f: any = {};
    if (brand.trim()) f.brand = brand.trim();
    if (minPrice) f.minPrice = Number(minPrice);
    if (maxPrice) f.maxPrice = Number(maxPrice);
    if (fuel) f.fuel = fuel;
    if (status) f.status = status;
    return Object.keys(f).length ? f : undefined;
  }, [brand, minPrice, maxPrice, fuel, status]);

  const { data, loading, refetch } = useQuery(CARS, { variables: { filter } });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Каталог машин</h2>
        <p className="text-sm text-neutral-400">
          Фильтруй по бренду, цене, топливу и статусу.
        </p>
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

          <select className="select" value={fuel} onChange={(e) => setFuel(e.target.value as any)}>
            <option value="">Fuel: any</option>
            <option value="GAS">GAS</option>
            <option value="DIESEL">DIESEL</option>
            <option value="HYBRID">HYBRID</option>
            <option value="EV">EV</option>
          </select>

          <select className="select" value={status} onChange={(e) => setStatus(e.target.value as any)}>
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
          {data.cars.map((c: any) => (
            <li key={c.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="text-lg font-semibold">
                    {c.brand} {c.model} <span className="text-neutral-400">({c.year})</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={c.status as CarStatus} />
                    <span className="badge">{c.fuel}</span>
                    <span className="badge">{c.transmission}</span>
                    <span className="badge">{c.drive}</span>
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
