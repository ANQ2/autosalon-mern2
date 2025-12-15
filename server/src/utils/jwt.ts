import jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { env } from "../config/env";

export type JwtPayload = { sub: string; role: string };

function coerceExpiresIn(value: unknown): SignOptions["expiresIn"] {
    if (typeof value === "number") return value;

    if (typeof value === "string") {
        const v = value.trim();

        // "3600" -> 3600 (секунды)
        if (/^\d+$/.test(v)) return Number(v);

        // "1h", "30m", "7d", "500ms" и т.п.
        return v as StringValue;
    }

    return undefined;
}

export function signAccessToken(payload: JwtPayload): string {
    const secret = env.JWT_SECRET as Secret;
    const expiresIn = coerceExpiresIn(env.JWT_EXPIRES_IN);

    return jwt.sign(payload, secret, { expiresIn });
}

export function verifyAccessToken(token: string): JwtPayload {
    const secret = env.JWT_SECRET as Secret;
    return jwt.verify(token, secret) as JwtPayload;
}