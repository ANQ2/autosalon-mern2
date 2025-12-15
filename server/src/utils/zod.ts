import { ZodSchema } from "zod";
import { gqlError } from "./errors";

export function parseOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
    const r = schema.safeParse(data);
    if (!r.success) {
        throw gqlError("BAD_USER_INPUT", "Validation error", {
            issues: r.error.issues.map(i => ({ path: i.path.join("."), message: i.message }))
        });
    }
    return r.data;
}
