import express from "express";
import { handleChat } from "../controllers/chatController.js";
import { piperPool } from "../services/ttsService.js";
import { config } from "../config/index.js";

const router = express.Router();

router.post("/chat", handleChat);

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "YogaKickFit Unified Backend",
    timestamp: new Date().toISOString(),
    piperTts: {
      ready: piperPool.ready,
      failed: piperPool.failed,
      workerCount: piperPool.workers.length,
    },
    ragServiceUrl: config.ragServiceUrl,
    redisEnabled: config.enableRedis,
    model: "gemini-3.5-flash",
  });
});

export default router;
