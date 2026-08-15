import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { WebSocketServer } from "ws";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import jwt from "jsonwebtoken";
import pool from "./db.js";
import axios from "axios";
import os from "os";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET || "supersecretjwtkey";
const geminiApiKey = process.env.GEMINI_API_KEY;
const ragServiceUrl = process.env.RAG_SERVICE_URL || "http://localhost:8000";

const edgeTtsVoice = process.env.EDGE_TTS_VOICE || "en-US-AriaNeural";

const genAI = new GoogleGenerativeAI(geminiApiKey || "-");

const app = express();
app.use(express.json());
app.use(cors());

// ==========================================
// 1. PIPER TTS POOL (Primary)
// ==========================================
const PIPER_BINARY = path.join(__dirname, "piper", "piper", os.platform() === "win32" ? "piper.exe" : "piper");
const PIPER_MODEL = path.join(__dirname, "piper", "en_US-amy-medium.onnx");
const PIPER_POOL_SIZE = 3;
const PIPER_SAMPLE_RATE = 22050;
const PIPER_CHANNELS = 1;
const PIPER_BITS_PER_SAMPLE = 16;

class PiperPool {
  constructor() {
    this.workers = [];
    this.queue = [];
    this.ready = false;
  }

  async start() {
    console.log(`🔥 Starting Piper pool (${PIPER_POOL_SIZE} workers)...`);
    try {
        await fsp.access(PIPER_BINARY);
    } catch (e) {
        console.warn(`⚠️ Piper binary not found at ${PIPER_BINARY}. Falling back to Edge-TTS entirely.`);
        return;
    }

    for (let i = 0; i < PIPER_POOL_SIZE; i++) {
      this.workers.push(this._spawnWorker(i));
    }
    await new Promise((r) => setTimeout(r, 2000));
    this.ready = true;
    console.log(`✅ Piper pool ready!`);
  }

  _spawnWorker(id) {
    const proc = spawn(
      PIPER_BINARY,
      ["--model", PIPER_MODEL, "--output_raw", "--json-input"],
      { stdio: ["pipe", "pipe", "pipe"] }
    );

    const worker = {
      id, proc, busy: false, resolve: null, reject: null, audioChunks: [], timer: null
    };

    proc.stdout.on("data", (chunk) => {
      worker.audioChunks.push(chunk);
      if (worker.timer) clearTimeout(worker.timer);
      worker.timer = setTimeout(() => this._finish(worker), 100);
    });

    proc.stderr.on("data", () => {});

    proc.on("exit", (code) => {
      if (worker.reject) worker.reject(new Error(`Piper worker ${id} crashed`));
      const idx = this.workers.findIndex((w) => w.id === id);
      if (idx >= 0) this.workers[idx] = this._spawnWorker(id);
    });

    return worker;
  }

  _finish(worker) {
    if (!worker.resolve) return;
    const pcm = Buffer.concat(worker.audioChunks);
    worker.audioChunks = [];
    const wav = this._pcmToWav(pcm);
    const resolve = worker.resolve;
    worker.resolve = null; worker.reject = null; worker.busy = false;
    resolve(wav.toString("base64"));
    this._next();
  }

  _pcmToWav(pcm) {
    const h = Buffer.alloc(44);
    const byteRate = PIPER_SAMPLE_RATE * PIPER_CHANNELS * (PIPER_BITS_PER_SAMPLE / 8);
    const blockAlign = PIPER_CHANNELS * (PIPER_BITS_PER_SAMPLE / 8);
    h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8);
    h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20);
    h.writeUInt16LE(PIPER_CHANNELS, 22); h.writeUInt32LE(PIPER_SAMPLE_RATE, 24);
    h.writeUInt32LE(byteRate, 28); h.writeUInt16LE(blockAlign, 32);
    h.writeUInt16LE(PIPER_BITS_PER_SAMPLE, 34); h.write("data", 36);
    h.writeUInt32LE(pcm.length, 40);
    return Buffer.concat([h, pcm]);
  }

  synthesize(text) {
    return new Promise((resolve, reject) => {
      this.queue.push({ text, resolve, reject });
      this._next();
    });
  }

  _next() {
    if (this.queue.length === 0) return;
    const worker = this.workers.find((w) => !w.busy);
    if (!worker) return;
    const { text, resolve, reject } = this.queue.shift();
    worker.busy = true; worker.resolve = resolve; worker.reject = reject;
    worker.audioChunks = [];
    if (worker.timer) clearTimeout(worker.timer);
    worker.proc.stdin.write(JSON.stringify({ text }) + "\n");
  }
}

const piperPool = new PiperPool();
piperPool.start();

// ==========================================
// 2. EDGE TTS (Fallback)
// ==========================================
const getVoiceForRole = (role) => {
    if (role === "Kickboxing") return "en-US-ChristopherNeural";
    if (role === "Yoga") return "en-IN-NeerjaNeural";
    return edgeTtsVoice;
};

async function synthesizeWithEdgeTTS(text, voice) {
    const { Communicate } = await import("edge-tts-universal");
    const communicate = new Communicate(text, { voice });
    const audioChunks = [];
    const wordBoundaries = [];

    for await (const chunk of communicate.stream()) {
        if (chunk.type === "audio" && chunk.data) {
            audioChunks.push(chunk.data);
        } else if (chunk.type === "WordBoundary") {
            wordBoundaries.push({
                word: chunk.text,
                offsetMs: chunk.offset / 10000,
                durationMs: chunk.duration / 10000,
            });
        }
    }
    if (audioChunks.length === 0) throw new Error("Edge-TTS returned no audio data.");
    
    return {
        audioBase64: Buffer.concat(audioChunks).toString("base64"),
        wordBoundaries,
    };
}

async function generateTTS(text, role) {
    // Attempt Piper first (if ready)
    if (piperPool.ready) {
        try {
            console.log(`🗣️ Generating TTS using Piper for text: "${text.substring(0, 30)}..."`);
            const audioBase64 = await piperPool.synthesize(text);
            return { audioBase64, wordBoundaries: null, source: "piper" };
        } catch (e) {
            console.error("Piper TTS failed, falling back to Edge TTS", e);
        }
    }
    
    // Fallback to Edge TTS
    console.log(`🗣️ Generating TTS using Edge-TTS for text: "${text.substring(0, 30)}..."`);
    const voice = getVoiceForRole(role);
    const result = await synthesizeWithEdgeTTS(text, voice);
    return { ...result, source: "edge" };
}

// ==========================================
// 3. AI PROMPTS & CHUNKING
// ==========================================
const getSystemInstruction = (role) => {
    const baseInstruction = `
CRITICAL RULES:
- NEVER start with generic greetings like "Hello!", "Welcome!", "Namaste!". Get straight to the point.
- Keep each sentence short (10-20 words max) so they can be streamed as audio chunks.
- Respond in natural conversation. Do NOT output JSON. Do NOT use markdown code blocks.`;

    if (role === "Kickboxing") {
        return `You are a high-energy, motivating Kickboxing Coach.
Rules:
1. ALWAYS start with an extremely short (1-4 words) sentence like "Let's go!", "Got it.".
2. Be energetic and motivating.
3. Keep subsequent sentences under 15 words.
- Use animation tags at the START of sentences: [Boxing], [Kicking], [Block]
${baseInstruction}`;
    } else {
        return `You are a friendly, supportive companion who also specializes as a Yoga teacher.
Rules:
1. ALWAYS start with an extremely short (1-4 words) sentence like "Sure thing!", "I understand.", "Namaste.".
2. Be warm, empathetic, conversational, and relaxed.
3. For pose/pranayama requests: guide step-by-step like a real instructor, but maintain your friendly tone.
4. If they just want to chat, act like a good friend.
- Use tags like [smile], [sad], [laugh], [Talking_1] at the START of sentences.
${baseInstruction}`;
    }
};

const detectAnimationAndExpression = (sentence, role, seq) => {
    let facialExpression = "smile";
    let animation = role === "Kickboxing" ? "FightingPosition" : ["Talking_0", "Talking_1", "Talking_2"][seq % 3];

    const tagMatch = sentence.match(/\[(.*?)\]/);
    if (tagMatch) {
        const tagContent = tagMatch[1].trim();
        if (tagContent.includes("sad")) facialExpression = "sad";
        else if (tagContent.includes("angry")) facialExpression = "angry";
        else if (tagContent.includes("laugh")) { facialExpression = "smile"; animation = "Laughing"; }
        else animation = tagContent;
    }
    const cleanText = sentence.replace(/\[.*?\]/g, "").trim();
    return { cleanText, facialExpression, animation };
};

// ==========================================
// 4. WEBSOCKET & HTTP SERVER
// ==========================================
const server = app.listen(port, () => {
    console.log(`🚀 Unified Yoga AI Backend listening on port ${port}`);
    // Log the last 15 characters of the RAG URL to verify the .env is loaded correctly
    const maskedUrl = ragServiceUrl.length > 15 
        ? "..." + ragServiceUrl.slice(-15) 
        : ragServiceUrl;
    console.log(`🔗 Configured RAG Service URL ends with: ${maskedUrl}`);
});

const wss = new WebSocketServer({ server });
const clients = new Map();

// Helper for guest mode mapping
const guestSessions = new Map();

wss.on("connection", (ws, req) => {
    const urlParams = new URLSearchParams(req.url.split("?")[1]);
    const token = urlParams.get("token");
    const isGuest = urlParams.get("guest") === "true";

    if (isGuest) {
        const guestId = crypto.randomUUID();
        ws.userId = guestId;
        ws.isGuest = true;
        guestSessions.set(guestId, { messageCount: 0 });
        clients.set(guestId, ws);
        console.log(`Guest connected: ${guestId}`);
        ws.send(JSON.stringify({ type: "auth_success", userId: guestId, isGuest: true }));
        return;
    }

    if (!token) {
        ws.send(JSON.stringify({ type: "error", message: "Auth token required" }));
        ws.close();
        return;
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) { ws.close(); return; }
        ws.userId = user.userId;
        clients.set(user.userId, ws);
        ws.send(JSON.stringify({ type: "auth_success", userId: user.userId }));
    });
});

wss.on("close", (ws) => {
    clients.delete(ws.userId);
    if (ws.isGuest) guestSessions.delete(ws.userId);
});

const sendToClient = (userId, payload) => {
    const clientWs = clients.get(userId);
    if (clientWs && clientWs.readyState === 1) {
        clientWs.send(JSON.stringify(payload));
    }
};

// ==========================================
// 5. CHAT PROCESSING (Replaces Redis Pipeline)
// ==========================================
async function processSentence(sentence, seq, userId, chatSessionId, role, source = "ai") {
    if (!sentence || sentence.length < 2) return;

    const { cleanText, facialExpression, animation } = detectAnimationAndExpression(sentence, role, seq);
    if (!cleanText) return;

    console.log(`✂️ Chunked sentence (Seq ${seq}): "${cleanText}"`);

    const msgId = crypto.randomUUID();
    
    // 1. Send Text immediately
    sendToClient(userId, {
        type: "text_ready",
        id: msgId,
        userId, chatSessionId, seq,
        text: cleanText,
        sender: "assistant",
        facialExpression, animation,
        source // "ai" or "rag"
    });

    // 2. Generate and send audio asynchronously
    (async () => {
        const audioText = cleanText.replace(/[*"]/g, "").trim();
        if (audioText.length === 0) return;
        
        try {
            const { audioBase64, wordBoundaries } = await generateTTS(audioText, role);
            sendToClient(userId, {
                type: "audio_ready",
                id: msgId, userId, seq,
                audio: audioBase64,
                lipsync: wordBoundaries,
            });
        } catch (e) {
            console.error(`Audio Generation Error:`, e.message);
        }
    })();
}

// Main processing function called directly from API
async function processChatRequest({ userId, chatSessionId, userMessage, role, useRAG, isGuest }) {
    try {
        let systemInstruction = getSystemInstruction(role);
        let augmentedMessage = userMessage;
        let source = "ai";

        // If RAG is requested, ask the RAG service first
        if (useRAG) {
            console.log(`🧠 RAG Mode ON: Sending query to knowledge base at ${ragServiceUrl}...`);
            try {
                const ragForm = new FormData();
                ragForm.append("question", userMessage);
                const ragRes = await axios.post(`${ragServiceUrl}/ask/`, ragForm, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });
                
                if (ragRes.data && ragRes.data.response) {
                    console.log(`📚 Success: Got response directly from RAG (Groq)! Bypassing Gemini.`);
                    const ragAnswer = ragRes.data.response;
                    source = "rag";
                    
                    // Directly stream the RAG response to the client
                    let seq = 0;
                    const sentences = ragAnswer.match(/[^.!?।\n]+[.!?।\n]+/g) || [ragAnswer];
                    
                    for (const sentence of sentences) {
                        if (sentence.trim().length > 2) {
                            await processSentence(sentence.trim(), seq++, userId, chatSessionId, role, source);
                        }
                    }
                    return; // Completely bypass Gemini!
                } else {
                    console.log(`⚠️ RAG returned empty response. Proceeding to Gemini fallback.`);
                }
            } catch (e) {
                console.error("❌ RAG Service error details:", e.response?.data || e.message);
                console.error("⚠️ Falling back to standard Gemini AI...");
            }
        }

        console.log(`🤖 Using Gemini (Google) as fallback...`);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
        });

        // Add dummy history for now. For a real app, fetch from DB unless guest.
        const chat = model.startChat({ history: [] }); 
        const result = await chat.sendMessageStream(augmentedMessage);

        let buffer = "";
        let seq = 0;

        for await (const chunk of result.stream) {
            const chunkText = await chunk.text();
            if (chunkText) {
                buffer += chunkText;
                const sentenceMatch = buffer.match(/^(.*?[.!?।\n])\s*/);
                if (sentenceMatch && sentenceMatch[1].trim().length > 2) {
                    const sentence = sentenceMatch[1].trim();
                    buffer = buffer.substring(sentenceMatch[0].length);
                    processSentence(sentence, seq++, userId, chatSessionId, role, source);
                }
            }
        }

        if (buffer.trim().length > 0) {
            processSentence(buffer, seq++, userId, chatSessionId, role, source);
        }
    } catch (e) {
        console.error("Chat generation error:", e);
        sendToClient(userId, {
            type: "text_ready",
            id: crypto.randomUUID(),
            userId,
            text: "I'm having trouble processing that right now.",
            sender: "assistant",
        });
    }
}

// Chat API Endpoint
app.post("/chat", async (req, res) => {
    let { message, chatSessionId, role, isRAGMode, isGuest, guestId } = req.body;
    role = role || "Yoga";

    // Handle Guest Limit
    if (isGuest && guestId) {
        const session = guestSessions.get(guestId);
        if (!session) return res.status(401).json({ error: "Invalid guest session" });
        if (session.messageCount >= 3) {
            return res.status(403).json({ 
                error: "Guest limit reached. Please log in to continue.",
                requireLogin: true
            });
        }
        session.messageCount++;
        
        // Process asynchronously
        processChatRequest({ 
            userId: guestId, chatSessionId: "guest", userMessage: message, 
            role, useRAG: isRAGMode, isGuest: true 
        });
        
        return res.status(202).json({ message: "Processing guest request", messageCount: session.messageCount });
    }

    // Handle Authenticated User (requires auth middleware in reality, simplified here)
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    
    jwt.verify(token, jwtSecret, async (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        
        const userId = user.userId;
        
        // In reality, save to DB here...
        
        // Process asynchronously
        processChatRequest({ 
            userId, chatSessionId, userMessage: message, 
            role, useRAG: isRAGMode, isGuest: false 
        });
        
        res.status(202).json({ message: "Processing request" });
    });
});

// Import old routes from separate files (auth, db queries, etc)
import authRoutes from './routes/auth.js';
app.use('/', authRoutes);
