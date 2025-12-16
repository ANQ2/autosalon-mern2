import mongoose, { Schema } from "mongoose";

export const LeadType = ["TEST_DRIVE", "RESERVE", "QUESTION"] as const;
export const LeadStatus = ["NEW", "IN_PROGRESS", "APPROVED", "REJECTED"] as const;

const leadSchema = new Schema(
    {
        type: { type: String, enum: LeadType, required: true },
        status: { type: String, enum: LeadStatus, required: true, default: "NEW" },

        message: { type: String, trim: true, maxlength: 2000 },
        preferredDate: { type: Date },

        managerComment: { type: String, trim: true, maxlength: 2000 },

        customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        carId: { type: Schema.Types.ObjectId, ref: "Car", required: true },

        assignedManagerId: { type: Schema.Types.ObjectId, ref: "User" },

        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

leadSchema.index({ customerId: 1, createdAt: -1 });
leadSchema.index({ carId: 1, createdAt: -1 });
leadSchema.index({ status: 1, createdAt: -1 });

export const LeadModel = mongoose.model("Lead", leadSchema);