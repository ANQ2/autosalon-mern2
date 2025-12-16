import mongoose, { Schema } from "mongoose";

export const UserRoles = ["CLIENT", "MANAGER", "ADMIN"] as const;

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: { type: String, required: true },

        role: {
            type: String,
            enum: UserRoles,
            required: true,
            default: "CLIENT",
        },

        username: { type: String, required: true, trim: true, minlength: 3, maxlength: 80 },
        fullName: { type: String, trim: true, minlength: 2, maxlength: 80 },

        phone: { type: String, trim: true, maxlength: 30 },

        favoriteCarIds: [{ type: Schema.Types.ObjectId, ref: "Car" }],

        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const UserModel = mongoose.model("User", userSchema);