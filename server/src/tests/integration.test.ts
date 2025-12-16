import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { ApolloServer } from "@apollo/server";
import { schema } from "../graphql/schema";
import { buildContext } from "../graphql/context";

let mongod: MongoMemoryServer;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

test("GraphQL register + me", async () => {
    const server = new ApolloServer({ schema });
    await server.start();

    // 1️⃣ REGISTER
    const reg = await server.executeOperation({
        query: `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
          user {
            id
            email
            role
          }
        }
      }
    `,
        variables: {
            input: {
                email: "int@demo.com",
                username: "intuser",
                password: "123456",
            },
        },
    });

    expect((reg.body as any).singleResult.errors).toBeUndefined();

    const token = (reg.body as any).singleResult.data.register.token;
    expect(token).toBeTruthy();

    const contextValue = buildContext({
        headers: { authorization: `Bearer ${token}` },
    } as any);

    const me = await server.executeOperation(
        {
            query: `
        query {
          me {
            email
            role
          }
        }
      `,
        },
        { contextValue }
    );

    expect((me.body as any).singleResult.data.me.email).toBe("int@demo.com");
    expect((me.body as any).singleResult.data.me.role).toBe("CLIENT");
});
