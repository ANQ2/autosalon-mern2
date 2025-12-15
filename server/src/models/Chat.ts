import mongoose, { Schema } from "mongoose";

export const ChatType = ["CAR", "SUPPORT"] as const;
export const ChatStatus = ["OPEN", "CLOSED"] as const;

const chatSchema = new Schema(
    {
        type: { type: String, enum: ChatType, required: true },
        status: { type: String, enum: ChatStatus, default: "OPEN" },

        carId: { type: Schema.Types.ObjectId, ref: "Car" }, // для CAR чата
        customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        managerId: { type: Schema.Types.ObjectId, ref: "User" }, // назначается менеджером/админом

        lastMessageAt: { type: Date },
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

chatSchema.index({ type: 1, status: 1 });
chatSchema.index({ customerId: 1 });
chatSchema.index({ managerId: 1 });
chatSchema.index({ carId: 1 });

export const ChatModel = mongoose.model("Chat", chatSchema);
