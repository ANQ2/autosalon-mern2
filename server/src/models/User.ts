import mongoose, { Schema } from "mongoose";

export const UserRoles = ["CUSTOMER", "MANAGER", "ADMIN"] as const;

const userSchema = new Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: UserRoles, required: true, default: "CUSTOMER" },
        fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
        phone: { type: String, trim: true, maxlength: 30 },
        favoriteCarIds: [{ type: Schema.Types.ObjectId, ref: "Car" }],
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

export const UserModel = mongoose.model("User", userSchema);
