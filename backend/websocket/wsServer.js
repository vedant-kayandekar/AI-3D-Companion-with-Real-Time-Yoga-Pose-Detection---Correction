import { WebSocketServer, WebSocket } from "ws";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { sessionService } from "../services/sessionService.js";

const clients = new Map();

export function initWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (ws, req) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const token = url.searchParams.get("token");
      const isGuest = url.searchParams.get("guest") === "true";
      const requestedGuestId = url.searchParams.get("guestId");

      if (isGuest) {
        // Use client's persistent guestId or generate one if missing
        const guestId = requestedGuestId || crypto.randomUUID();
        ws.userId = guestId;
        ws.isGuest = true;
        ws.isAlive = true;

        sessionService.getOrCreateSession(guestId);
        clients.set(guestId, ws);

        console.log(`[WS] 🟢 Guest client connected: ${guestId}`);
        ws.send(
          JSON.stringify({
            type: "auth_success",
            userId: guestId,
            isGuest: true,
            remainingChats: sessionService.getRemainingChats(guestId),
          })
        );
        return;
      }

      if (!token) {
        console.warn("[WS] ⚠️ Connection rejected: Missing token");
        ws.send(JSON.stringify({ type: "error", message: "Auth token required" }));
        ws.close();
        return;
      }

      jwt.verify(token, config.jwtSecret, (err, user) => {
        if (err) {
          console.warn("[WS] ⚠️ Connection rejected: Invalid JWT token");
          ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
          ws.close();
          return;
        }

        ws.userId = user.userId;
        ws.isGuest = false;
        ws.isAlive = true;
        clients.set(user.userId, ws);

        console.log(`[WS] 🟢 Authenticated user connected: ${user.userId}`);
        ws.send(
          JSON.stringify({
            type: "auth_success",
            userId: user.userId,
            isGuest: false,
          })
        );
      });
    } catch (e) {
      console.error("[WS] Error in connection handler:", e);
      ws.close();
    }

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("close", () => {
      if (ws.userId) {
        clients.delete(ws.userId);
        console.log(`[WS] 🔴 Disconnected client: ${ws.userId}`);
      }
    });

    ws.on("error", (err) => {
      console.error(`[WS] Client error (${ws.userId}):`, err.message);
    });
  });

  // Heartbeat interval to prune dead sockets
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        if (ws.userId) clients.delete(ws.userId);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  return wss;
}

export function sendToClient(userId, payload) {
  if (!userId) return false;
  const clientWs = clients.get(userId);
  if (clientWs && clientWs.readyState === WebSocket.OPEN) {
    clientWs.send(JSON.stringify(payload));
    return true;
  }
  return false;
}

export function isClientConnected(userId) {
  const clientWs = clients.get(userId);
  return !!(clientWs && clientWs.readyState === WebSocket.OPEN);
}
