import { GraphQLError } from "graphql";

export type ErrorCode =
    | "UNAUTHENTICATED"
    | "FORBIDDEN"
    | "BAD_USER_INPUT"
    | "NOT_FOUND"
    | "CONFLICT"
    | "INTERNAL_SERVER_ERROR";

export function gqlError(code: ErrorCode, message: string, extra?: Record<string, unknown>): GraphQLError {
    return new GraphQLError(message, { extensions: { code, ...extra } });
}

export function assertAuth(user: any): asserts user is { id: string; role: string } {
    if (!user) throw gqlError("UNAUTHENTICATED", "Not authenticated");
}

export function assertRole(user: { role: string }, roles: string[]): void {
    if (!roles.includes(user.role)) throw gqlError("FORBIDDEN", "Forbidden");
}
