import dotenv from "dotenv";
dotenv.config();

function must(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
}

export const env = {
    NODE_ENV: process.env.NODE_ENV ?? "development",
    PORT: Number(process.env.PORT ?? "4000"),
    MONGO_URI: must("MONGO_URI"),
    JWT_SECRET: must("JWT_SECRET"),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "1d"
};
