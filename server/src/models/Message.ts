import mongoose, { Schema } from "mongoose";

export const MessageKind = ["TEXT", "SYSTEM"] as const;

const messageSchema = new Schema(
    {
        chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
        authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
        kind: {
            type: String,
            enum: MessageKind,
            required: true,
            default: "TEXT"
        },
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

messageSchema.index({ chatId: 1, createdAt: 1 });

export const MessageModel = mongoose.model("Message", messageSchema);