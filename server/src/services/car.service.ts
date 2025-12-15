import { z } from "zod";
import { CarModel } from "../models/Car";
import { gqlError } from "../utils/errors";
import { parseOrThrow } from "../utils/zod";

const filterSchema = z.object({
    brand: z.string().optional(),
    minPrice: z.number().int().min(0).optional(),
    maxPrice: z.number().int().min(0).optional(),
    status: z.enum(["AVAILABLE", "RESERVED", "SOLD"]).optional(),
    yearFrom: z.number().int().min(1950).optional(),
    yearTo: z.number().int().max(2100).optional()
}).optional();

const paginationSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(50).default(12)
}).optional();

const carCreateSchema = z.object({
    title: z.string().min(2).max(120),
    brand: z.string().min(1).max(50),
    model: z.string().min(1).max(50),
    year: z.number().int().min(1950).max(2100),
    price: z.number().int().min(0),
    mileage: z.number().int().min(0),
    fuelType: z.string().min(1).max(30),
    transmission: z.string().min(1).max(30),
    images: z.array(z.string().min(3)).optional()
});

const carUpdateSchema = z.object({
    title: z.string().min(2).max(120).optional(),
    price: z.number().int().min(0).optional(),
    mileage: z.number().int().min(0).optional(),
    status: z.enum(["AVAILABLE", "RESERVED", "SOLD"]).optional(),
    images: z.array(z.string().min(3)).optional()
});

export const carService = {
    async listCars(filter: unknown, pagination: unknown) {
        const f = parseOrThrow(filterSchema ?? z.any(), filter ?? {});
        const p = parseOrThrow(paginationSchema ?? z.any(), pagination ?? {});

        const q: any = { isDeleted: false };

        if (f?.brand) q.brand = new RegExp(f.brand, "i");
        if (f?.status) q.status = f.status;

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

        const page = (p as any)?.page ?? 1;
        const limit = (p as any)?.limit ?? 12;

        return CarModel.find(q)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
    },

    async createCar(input: unknown) {
        const data = parseOrThrow(carCreateSchema, input);
        return CarModel.create({ ...data, images: data.images ?? [] });
    },

    async updateCar(carId: string, input: unknown) {
        const data = parseOrThrow(carUpdateSchema, input);
        const car = await CarModel.findOne({ _id: carId, isDeleted: false });
        if (!car) throw gqlError("NOT_FOUND", "Car not found");
        Object.assign(car, data);
        await car.save();
        return car;
    }
};
