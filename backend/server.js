import express from "express";
import cors from "cors";
import http from "http";
import { config, printConfigSummary } from "./config/index.js";
import { initWebSocketServer } from "./websocket/wsServer.js";
import { requestLogger } from "./middleware/logger.js";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// API Routes
app.use("/", chatRoutes);
app.use("/", authRoutes);

// Root Welcome / Diagnostics
app.get("/", (req, res) => {
  res.json({
    project: "YogaKickFit AI — 3D Companion Backend",
    author: "Vedant Kayandekar",
    status: "active",
    docs: "/health",
  });
});

// Create HTTP + WebSocket Unified Server
const server = http.createServer(app);
initWebSocketServer(server);

// Start Server
server.listen(config.port, () => {
  printConfigSummary();
  console.log(`🚀 Unified Yoga AI Backend running at http://localhost:${config.port}`);
});

export default app;
