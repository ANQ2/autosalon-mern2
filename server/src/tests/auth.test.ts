import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { authService } from "../services/auth.service";

let mongod: MongoMemoryServer;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

test("register returns token", async () => {
    const res = await authService.register({ email: "a@a.com", password: "123456", fullName: "A A" });
    expect(res.accessToken).toBeTruthy();
});

test("login works", async () => {
    await authService.register({ email: "b@b.com", password: "123456", fullName: "B B" });
    const res = await authService.login({ email: "b@b.com", password: "123456" });
    expect(res.accessToken).toBeTruthy();
});
