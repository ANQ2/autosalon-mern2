import mongoose, { Schema } from "mongoose";

const promotionSchema = new Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 120 },
        description: { type: String, required: true, trim: true, maxlength: 1000 },
        discountPercent: { type: Number, required: true, min: 0, max: 100 },
        startsAt: { type: Date, required: true },
        endsAt: { type: Date, required: true },
        isActive: { type: Boolean, default: true },
        createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

promotionSchema.index({ isActive: 1 });
promotionSchema.index({ startsAt: 1, endsAt: 1 });

export const PromotionModel = mongoose.model("Promotion", promotionSchema);
