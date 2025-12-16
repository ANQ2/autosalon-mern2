import type { Request } from "express";
import { verifyAccessToken } from "../utils/jwt";

export type Role = "CLIENT" | "MANAGER" | "ADMIN";

export type GqlUser = {
    id: string;
    role: Role;
};

export type GqlContext = {
    req: Request;
    user: GqlUser | null;
};

function normalizeRole(raw: unknown): Role {
    const role = typeof raw === "string" ? raw : "";

    // поддержка старого значения (если где-то ещё осталось/есть старые токены)
    if (role === "CUSTOMER") return "CLIENT";

    if (role === "CLIENT" || role === "MANAGER" || role === "ADMIN") return role;

    return "CLIENT";
}

export function buildContext(req: Request): GqlContext {
    const authHeader = req.headers.authorization ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";

    if (!token) return { req, user: null };

    try {
        const payload = verifyAccessToken(token);
        return {
            req,
            user: {
                id: payload.sub,
                role: normalizeRole(payload.role),
            },
        };
    } catch {
        return { req, user: null };
    }
}