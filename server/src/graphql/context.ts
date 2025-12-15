import type { Request } from "express";
import { verifyAccessToken } from "../utils/jwt";

export type AuthUser = { id: string; role: "CUSTOMER" | "MANAGER" | "ADMIN" };

export type GqlContext = { req?: Request; user: AuthUser | null };

export function buildContext(req?: Request): GqlContext {
    const auth = req?.headers?.authorization;
    if (!auth) return { req, user: null };

    const [, token] = auth.split(" ");
    if (!token) return { req, user: null };

    try {
        const payload = verifyAccessToken(token);
        return { req, user: { id: payload.sub, role: payload.role as any } };
    } catch {
        return { req, user: null };
    }
}
