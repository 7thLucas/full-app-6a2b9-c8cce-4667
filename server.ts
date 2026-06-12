import "dotenv/config";
import express from "express";
import cors from "cors";
import next from "next";
import mongoose from "mongoose";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLogger } from "./lib/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = createLogger("Server");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);

async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.warn("MONGODB_URI not set — skipping MongoDB connection");
    return;
  }
  try {
    await mongoose.connect(uri);
    logger.info("MongoDB connected");
  } catch (err) {
    logger.error("MongoDB connection error", err);
  }
}

async function loadRoutes(app: express.Application) {
  // Auto-discover all *.routes.ts files in app/modules/*
  const { glob } = await import("glob");
  const routeFiles = await glob("modules/*/*.routes.ts", {
    cwd: __dirname,
    absolute: true,
  });

  for (const file of routeFiles) {
    try {
      const mod = await import(file);
      const router = mod.default;
      if (router && typeof router === "function") {
        app.use("/api", router);
        logger.info(`Mounted route: ${path.basename(file)}`);
      }
    } catch (err) {
      logger.error(`Failed to load route: ${file}`, err);
    }
  }
}

async function main() {
  await connectMongo();

  const nextApp = next({ dev, dir: __dirname });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Load scaffold routes
  await loadRoutes(app);

  // Dogedex API routes
  const { default: dogedexRouter } = await import("./app/api/dogedex.routes.js");
  app.use("/api", dogedexRouter);

  // Next.js request handler
  app.all("*", (req, res) => {
    return handle(req, res);
  });

  const server = createServer(app);
  server.listen(port, () => {
    logger.info(`Dogedex server running on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error("Fatal server error:", err);
  process.exit(1);
});
