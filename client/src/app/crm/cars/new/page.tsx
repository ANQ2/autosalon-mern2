"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { RequireRole } from "src/lib/role-guard";
import { CREATE_CAR } from "src/gql/manager";
import Link from "next/link";

export default function NewCarPage() {
  return (
    <RequireRole allow={["MANAGER", "ADMIN"]}>
      <NewCarInner />
    </RequireRole>
  );
}

function NewCarInner() {
  const [brand, setBrand] = useState("Toyota");
  const [model, setModel] = useState("Corolla");
  const [year, setYear] = useState(2020);
  const [price, setPrice] = useState(10000000);
  const [mileage, setMileage] = useState(0);
  const [color, setColor] = useState("white");
  const [fuel, setFuel] = useState<"GAS" | "DIESEL" | "HYBRID" | "EV">("GAS");

  const [createCar, { loading }] = useMutation(CREATE_CAR);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Добавить машину</h2>
        <div className="flex gap-3">
          <Link className="underline" href="/cars">Каталог</Link>
          <Link className="underline" href="/crm/inquiries">CRM</Link>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 p-4 space-y-2">
        <input className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-2"
          value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="brand" />

        <input className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-2"
          value={model} onChange={(e) => setModel(e.target.value)} placeholder="model" />

        <div className="grid gap-2 md:grid-cols-2">
          <input className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-2"
            type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} placeholder="year" />

          <input className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-2"
            type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="price" />
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <input className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-2"
            type="number" value={mileage} onChange={(e) => setMileage(Number(e.target.value))} placeholder="mileage" />

          <input className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-2"
            value={color} onChange={(e) => setColor(e.target.value)} placeholder="color" />
        </div>

        <select className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-2"
          value={fuel} onChange={(e) => setFuel(e.target.value as any)}>
          <option value="GAS">GAS</option>
          <option value="DIESEL">DIESEL</option>
          <option value="HYBRID">HYBRID</option>
          <option value="EV">EV</option>
        </select>

        <button
          className="rounded-xl bg-white px-4 py-2 text-black"
          disabled={loading}
          onClick={async () => {
            await createCar({
              variables: { input: { brand, model, year, price, mileage, color, fuel, images: [] } }
            });
            alert("Машина создана");
            location.href = "/cars";
          }}
        >
          Создать
        </button>
      </div>
    </div>
  );
}
