import { z } from "zod";
import { CarModel } from "../models/Car";
import { gqlError } from "../utils/errors";
import { parseOrThrow } from "../utils/zod";

// Под GraphQL typeDefs.ts:
// input CarFilterInput { brand, minPrice, maxPrice, fuel, status, yearFrom, yearTo }
// input PaginationInput { limit = 20, offset = 0 }

const filterSchema = z
    .object({
        brand: z.string().optional(),
        minPrice: z.number().min(0).optional(),
        maxPrice: z.number().min(0).optional(),
        fuel: z.enum(["GAS", "DIESEL", "HYBRID", "EV"]).optional(),

        // В Mongo Car.ts enum сейчас: AVAILABLE | RESERVED | SOLD
        // (ARCHIVED в typeDefs есть, но модель его не примет)
        status: z.enum(["AVAILABLE", "RESERVED", "SOLD"]).optional(),

        yearFrom: z.number().int().min(1950).optional(),
        yearTo: z.number().int().max(2100).optional(),
    })
    .optional();

const paginationSchema = z
    .object({
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
    })
    .optional();

// Принимаем GraphQL CarCreateInput и маппим Mongo поля
// input CarCreateInput {
//   brand, model, year, price, mileage, color, fuel, transmission, drive, vin, description, images
// }
const carCreateInputSchema = z
    .object({
        brand: z.string().min(1).max(50),
        model: z.string().min(1).max(50),
        year: z.number().int().min(1950).max(2100),
        price: z.number().min(0),
        mileage: z.number().min(0),

        fuel: z.enum(["GAS", "DIESEL", "HYBRID", "EV"]),
        transmission: z.enum(["AT", "MT", "CVT"]),

        images: z.array(z.string().min(3)).optional(),

        // остальное может прилетать с клиента — не валим запрос
        color: z.string().optional(),
        drive: z.enum(["FWD", "RWD", "AWD"]).optional(),
        vin: z.string().optional(),
        description: z.string().optional(),
    })
    .passthrough();

const carUpdateSchema = z
    .object({
        title: z.string().min(2).max(120).optional(),
        price: z.number().min(0).optional(),
        mileage: z.number().min(0).optional(),
        status: z.enum(["AVAILABLE", "RESERVED", "SOLD"]).optional(),
        images: z.array(z.string().min(3)).optional(),
    })
    .passthrough();

function buildTitle(brand: string, model: string): string {
    const t = `${brand} ${model}`.trim();
    return t.length >= 2 ? t : brand.trim();
}

export const carService = {
    async listCars(filter: unknown, pagination: unknown) {
        const f = parseOrThrow(filterSchema ?? z.any(), filter ?? {});
        const p = parseOrThrow(paginationSchema ?? z.any(), pagination ?? {});

        const q: any = { isDeleted: false };

        if (f?.brand) q.brand = new RegExp(f.brand, "i");
        if (f?.status) q.status = f.status;

        // model в Mongo хранит fuelType как string (раньше), поэтому фильтруем по нему
        if (f?.fuel) q.fuelType = f.fuel;

        if (f?.minPrice != null || f?.maxPrice != null) {
            q.price = {};
            if (f.minPrice != null) q.price.$gte = f.minPrice;
            if (f.maxPrice != null) q.price.$lte = f.maxPrice;
        }

        if (f?.yearFrom != null || f?.yearTo != null) {
            q.year = {};
            if (f.yearFrom != null) q.year.$gte = f.yearFrom;
            if (f.yearTo != null) q.year.$lte = f.yearTo;
        }

        const limit = (p as any)?.limit ?? 20;
        const offset = (p as any)?.offset ?? 0;

        return CarModel.find(q).sort({ createdAt: -1 }).skip(offset).limit(limit);
    },

    async createCar(input: unknown) {
        const data = parseOrThrow(carCreateInputSchema, input);

        const doc = {
            title: buildTitle(data.brand, data.model),
            brand: data.brand,
            model: data.model,
            year: data.year,
            price: Math.round(Number(data.price)), // если хочешь хранить дробные — убери Math.round и поправь модель
            mileage: Math.round(Number(data.mileage)),
            fuelType: data.fuel,
            transmission: data.transmission,
            drive: data.drive,
            images: data.images ?? [],
        };

        return CarModel.create(doc);
    },

    async updateCar(carId: string, input: unknown) {
        const data = parseOrThrow(carUpdateSchema, input);
        const car = await CarModel.findOne({ _id: carId, isDeleted: false });
        if (!car) throw gqlError("NOT_FOUND", "Car not found");
        Object.assign(car, data);
        await car.save();
        return car;
    },
};