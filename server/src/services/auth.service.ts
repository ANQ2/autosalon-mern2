import bcrypt from "bcrypt";
import { z } from "zod";
import { UserModel } from "../models/User";
import { gqlError } from "../utils/errors";
import { signAccessToken } from "../utils/jwt";
import { parseOrThrow } from "../utils/zod";

const registerSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(80),
    password: z.string().min(6).max(64),
    phone: z.string().max(30).optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(64),
});

export const authService = {
    async register(input: unknown) {
        const data = parseOrThrow(registerSchema, input);

        const exists = await UserModel.findOne({
            $or: [
                { email: data.email },
                { username: data.username },
            ],
            isDeleted: false,
        });

        if (exists) {
            throw gqlError("CONFLICT", "User already exists");
        }

        const passwordHash = await bcrypt.hash(data.password, 10);

        const user = await UserModel.create({
            email: data.email,
            username: data.username,
            fullName: data.username,
            passwordHash,
            role: "CLIENT",
            phone: data.phone,
        });

        const token = signAccessToken({
            sub: user._id.toString(),
            role: (user as any).role,
        });

        return { token, user };
    },

    async login(input: unknown) {
        const data = parseOrThrow(loginSchema, input);

        const user = await UserModel.findOne({
            email: data.email,
            isDeleted: false,
        });

        if (!user) {
            throw gqlError("UNAUTHENTICATED", "Invalid credentials");
        }

        const ok = await bcrypt.compare(
            data.password,
            (user as any).passwordHash
        );

        if (!ok) {
            throw gqlError("UNAUTHENTICATED", "Invalid credentials");
        }

        const token = signAccessToken({
            sub: user._id.toString(),
            role: (user as any).role,
        });

        return { token, user };
    },
};
