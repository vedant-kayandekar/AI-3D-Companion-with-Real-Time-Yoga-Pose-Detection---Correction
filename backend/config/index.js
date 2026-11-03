import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  jwtSecret: process.env.JWT_SECRET || "supersecretjwtkey",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  ragServiceUrl: (process.env.RAG_SERVICE_URL || "http://localhost:8000").replace(/\/+$/, ""),
  edgeTtsVoice: process.env.EDGE_TTS_VOICE || "en-US-AriaNeural",
  
  // Feature Toggles (preserved from original architecture)
  enableStreaming: process.env.ENABLE_STREAMING !== "false",
  enablePiperTts: process.env.ENABLE_PIPER_TTS === "true" || true,
  enableRedis: process.env.ENABLE_REDIS === "true", // Disabled by default for zero-cost hobby tier
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  
  // Rate Limits / Quotas
  maxGuestChats: parseInt(process.env.MAX_GUEST_CHATS || "4", 10),

  // File Paths
  paths: {
    rootDir,
    piperDir: path.join(rootDir, "piper"),
    piperBin: path.join(
      rootDir,
      "piper",
      "piper",
      process.platform === "win32" ? "piper.exe" : "piper"
    ),
    piperModel: path.join(rootDir, "piper", "en_US-amy-medium.onnx"),
  },
};

export function printConfigSummary() {
  const maskedKey = config.geminiApiKey
    ? `${config.geminiApiKey.substring(0, 8)}...${config.geminiApiKey.slice(-4)}`
    : "NOT SET";
  const maskedRag = config.ragServiceUrl.length > 25
    ? `...${config.ragServiceUrl.slice(-20)}`
    : config.ragServiceUrl;

  console.log("=================================================");
  console.log("🧘 YogaKickFit AI — Backend Configuration");
  console.log("=================================================");
  console.log(`📡 Port              : ${config.port}`);
  console.log(`🤖 Gemini API Key   : ${maskedKey}`);
  console.log(`🌲 RAG Service URL   : ${maskedRag}`);
  console.log(`🗣️ Piper TTS Engine  : ${config.enablePiperTts ? "Enabled (Pool: 3)" : "Disabled"}`);
  console.log(`⚡ Redis Pipeline    : ${config.enableRedis ? "Active" : "Bypassed (Zero-Cost Mode)"}`);
  console.log(`🛡️  Guest Chat Limit  : ${config.maxGuestChats} chats/session`);
  console.log("=================================================");
}
