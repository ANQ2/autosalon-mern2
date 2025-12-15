import mongoose, { Schema } from "mongoose";

export const LeadType = ["TEST_DRIVE", "RESERVE"] as const;
export const LeadStatus = ["NEW", "IN_PROGRESS", "APPOINTED", "DONE", "CANCELED"] as const;

const leadSchema = new Schema(
    {
        type: { type: String, enum: LeadType, required: true },
        status: { type: String, enum: LeadStatus, default: "NEW" },
        customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        carId: { type: Schema.Types.ObjectId, ref: "Car", required: true },
        assignedManagerId: { type: Schema.Types.ObjectId, ref: "User" },
        preferredDate: { type: Date },
        comment: { type: String, trim: true, maxlength: 500 },
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

leadSchema.index({ status: 1 });
leadSchema.index({ customerId: 1 });
leadSchema.index({ assignedManagerId: 1 });
leadSchema.index({ carId: 1 });

export const LeadModel = mongoose.model("Lead", leadSchema);
