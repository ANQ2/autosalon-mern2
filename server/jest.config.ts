import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/src/tests/**/*.test.ts"],
    verbose: true
};
export default config;
