import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";

import { env } from "./config/env";
import { connectDb } from "./config/db";
import { schema } from "./graphql/schema";
import { buildContext } from "./graphql/context";
import { uploadRouter } from "./routes/upload.routes";

async function bootstrap(): Promise<void> {
  await connectDb();

  const app = express();
  const httpServer = http.createServer(app);

  app.use(helmet());

  // ✅ CORS (один раз и одинаково для HTTP + middleware)
  app.use(
    cors({
      origin: env.CORS_ORIGIN ?? "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(express.json());

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  app.use("/upload", uploadRouter);

  // ===== WebSocket (subscriptions) =====
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx: any) => {
        const auth: string =
          (ctx?.connectionParams?.authorization as string | undefined) ??
          (ctx?.connectionParams?.Authorization as string | undefined) ??
          "";

        // подгоняем к твоему buildContext(req)
        const fakeReq = { headers: { authorization: auth } } as any;
        return buildContext(fakeReq);
      },
    },
    wsServer
  );

  // ===== Apollo HTTP =====
  const apolloServer = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await apolloServer.start();

  app.use(
    "/graphql",
    expressMiddleware(apolloServer, {
      context: async ({ req }) => buildContext(req),
    })
  );

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  httpServer.listen(env.PORT, () => {
    console.log(`🚀 HTTP GraphQL: http://localhost:${env.PORT}/graphql`);
    console.log(`📡 WS GraphQL:  ws://localhost:${env.PORT}/graphql`);
    console.log(`🖼 Uploads:    http://localhost:${env.PORT}/uploads`);
  });

  process.on("SIGINT", async () => {
    try {
      await apolloServer.stop();
      await serverCleanup.dispose();
      wsServer.close();
      httpServer.close(() => process.exit(0));
    } catch (e) {
      console.error("Shutdown error:", e);
      process.exit(1);
    }
  });
}

bootstrap().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
