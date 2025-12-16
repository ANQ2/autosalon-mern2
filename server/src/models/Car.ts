import mongoose, { Schema } from "mongoose";

export const CarStatus = ["AVAILABLE", "RESERVED", "SOLD"] as const;
export const DriveTypes = ["FWD", "RWD", "AWD"] as const;
export const TransmissionTypes = ["AT", "MT", "CVT"] as const;

const carSchema = new Schema(
    {
        title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
        brand: { type: String, required: true, trim: true, maxlength: 50 },
        drive: { type: String, enum: DriveTypes, required: true },
        model: { type: String, required: true, trim: true, maxlength: 50 },
        year: { type: Number, required: true, min: 1950, max: 2100 },
        price: { type: Number, required: true, min: 0 },
        mileage: { type: Number, required: true, min: 0 },
        fuelType: { type: String, required: true, trim: true, maxlength: 30 },
        transmission: { type: String, required: true, trim: true, maxlength: 30 },
        status: { type: String, enum: CarStatus, default: "AVAILABLE" },
        images: [{ type: String, trim: true }],
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

carSchema.index({ brand: 1, model: 1, year: -1 });
carSchema.index({ price: 1 });
carSchema.index({ status: 1 });

export const CarModel = mongoose.model("Car", carSchema);
