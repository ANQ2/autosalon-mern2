import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from "mongoose";
import { ApolloServer } from "@apollo/server";
import { schema } from "../graphql/schema";
import { buildContext } from "../graphql/context";

let mongod: MongoMemoryServer;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

test("GraphQL register + me", async () => {
    const server = new ApolloServer({ schema });
    await server.start();

    const reg = await server.executeOperation({
        query: `
          mutation($email:String!, $password:String!, $fullName:String!) {
            register(email:$email, password:$password, fullName:$fullName) {
              accessToken
              user { id email role }
            }
          }
        `,
        variables: { email: "int@demo.com", password: "123456", fullName: "Int User" }
    });

    const token = (reg.body as any).singleResult.data.register.accessToken;
    expect(token).toBeTruthy();

    const contextValue = await buildContext({
        headers: { authorization: `Bearer ${token}` },
    } as any);

    const me = await server.executeOperation(
        { query: `query { me { email role } }` },
        { contextValue }
    );

    expect((me.body as any).singleResult.data.me.email).toBe("int@demo.com");
});