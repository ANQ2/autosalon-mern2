import mongoose, { Schema } from "mongoose";

export const AppointmentStatus = ["SCHEDULED", "COMPLETED", "CANCELED"] as const;

const appointmentSchema = new Schema(
    {
        leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
        managerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        dateTime: { type: Date, required: true },
        location: { type: String, required: true, trim: true, maxlength: 120 },
        note: { type: String, trim: true, maxlength: 500 },
        status: { type: String, enum: AppointmentStatus, default: "SCHEDULED" },
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

appointmentSchema.index({ leadId: 1 }, { unique: true });

export const AppointmentModel = mongoose.model("Appointment", appointmentSchema);
