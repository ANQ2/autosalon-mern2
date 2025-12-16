import mongoose, { Schema } from "mongoose";

export const ChatStatus = ["OPEN", "CLOSED"] as const;

const chatSchema = new Schema(
    {
        status: { type: String, enum: ChatStatus, required: true, default: "OPEN" },

        customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        carId: { type: Schema.Types.ObjectId, ref: "Car" }, // опционально (для car чатов)
        managerId: { type: Schema.Types.ObjectId, ref: "User" }, // назначается позже

        lastMessageAt: { type: Date },

        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

chatSchema.index({ customerId: 1, createdAt: -1 });
chatSchema.index({ managerId: 1, createdAt: -1 });
chatSchema.index({ status: 1, lastMessageAt: -1 });
chatSchema.index({ carId: 1 });

export const ChatModel = mongoose.model("Chat", chatSchema);