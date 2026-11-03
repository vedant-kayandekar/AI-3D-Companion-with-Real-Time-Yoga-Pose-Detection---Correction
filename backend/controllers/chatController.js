import crypto from "crypto";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { sessionService } from "../services/sessionService.js";
import { generateTTS } from "../services/ttsService.js";
import {
  streamAiResponse,
  detectAnimationAndExpression,
} from "../services/aiService.js";
import { askKnowledgeBase } from "../services/ragService.js";
import { sendToClient, isClientConnected } from "../websocket/wsServer.js";

/**
 * Process a single sentence:
 * 1. Send text immediately over WebSocket (instant UI update)
 * 2. Generate TTS audio concurrently in the background
 * 3. Send audio over WebSocket as soon as it's synthesized
 */
async function processSentence(sentence, seq, userId, chatSessionId, role, source = "ai") {
  if (!sentence || sentence.length < 2) return;

  const { cleanText, facialExpression, animation } =
    detectAnimationAndExpression(sentence, role, seq);

  if (!cleanText) return;

  const msgId = crypto.randomUUID();
  console.log(`[PIPELINE] ✂️  Seq #${seq} [${source.toUpperCase()}]: "${cleanText.substring(0, 45)}..."`);

  // Step 1: Send Text IMMEDIATELY to client
  const textSent = sendToClient(userId, {
    type: "text_ready",
    id: msgId,
    userId,
    chatSessionId,
    seq,
    text: cleanText,
    sender: "assistant",
    facialExpression,
    animation,
    source,
  });

  if (!textSent) {
    console.warn(`[PIPELINE] ⚠️ Client socket for '${userId}' not open. Text dropped.`);
  }

  // Step 2: Asynchronous TTS generation (non-blocking)
  (async () => {
    const audioText = cleanText.replace(/[*"]/g, "").trim();
    if (audioText.length === 0) return;

    try {
      const { audioBase64, wordBoundaries, source: ttsSource } =
        await generateTTS(audioText, role);

      sendToClient(userId, {
        type: "audio_ready",
        id: msgId,
        userId,
        seq,
        audio: audioBase64,
        lipsync: wordBoundaries,
        ttsEngine: ttsSource,
      });
    } catch (err) {
      console.error(`[PIPELINE] ❌ TTS error for seq #${seq}:`, err.message);
      // Send null audio notification so client does not stay stuck in loading state!
      sendToClient(userId, {
        type: "audio_ready",
        id: msgId,
        userId,
        seq,
        audio: null,
        lipsync: null,
      });
    }
  })();
}

/**
 * Handle incoming chat message
 */
export async function handleChat(req, res) {
  let { message, chatSessionId, role, isRAGMode, isGuest, guestId } = req.body;
  role = role || "Yoga";

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }

  let targetUserId = null;

  // 1. Guest Handling
  if (isGuest) {
    if (!guestId) {
      return res.status(400).json({ error: "Missing guestId" });
    }

    if (!sessionService.canChat(guestId)) {
      console.warn(`[CHAT] 🛑 Guest limit exceeded for: ${guestId}`);
      return res.status(403).json({
        error: "Guest chat limit reached (4 messages). Please create an account or sign in to continue unlimited practice!",
        requireLogin: true,
      });
    }

    const currentCount = sessionService.incrementChat(guestId);
    targetUserId = guestId;
    console.log(`[CHAT] 👤 Guest chat (${currentCount}/${config.maxGuestChats}): "${message.substring(0, 40)}..."`);
  } else {
    // 2. Authenticated User Handling
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized. Token required." });
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      targetUserId = decoded.userId;
      console.log(`[CHAT] 🔐 Member chat (User: ${targetUserId}): "${message.substring(0, 40)}..."`);
    } catch {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
  }

  // Acknowledge HTTP request immediately (Async event-driven pattern)
  res.status(202).json({
    status: "processing",
    userId: targetUserId,
    remainingChats: isGuest ? sessionService.getRemainingChats(targetUserId) : null,
  });

  // Execute processing asynchronously in background
  (async () => {
    let source = "ai";
    let seq = 0;

    // Check if WebSocket is ready
    if (!isClientConnected(targetUserId)) {
      console.warn(`[CHAT] ⚠️ Target WebSocket client '${targetUserId}' is not connected yet.`);
    }

    // Tier 1: If RAG Mode requested, ask knowledge base
    if (isRAGMode) {
      try {
        const ragResult = await askKnowledgeBase(message);
        if (ragResult && ragResult.answer) {
          source = "rag";
          const sentences = ragResult.answer.match(/[^.!?।\n]+[.!?।\n]+/g) || [ragResult.answer];

          for (const s of sentences) {
            const trimmed = s.trim();
            if (trimmed.length > 1) {
              await processSentence(trimmed, seq++, targetUserId, chatSessionId, role, source);
            }
          }
          return; // Finished RAG response successfully!
        }
      } catch (ragErr) {
        console.warn(`[CHAT] ⚠️ RAG unavailable (${ragErr.message}). Seamlessly falling back to Direct Gemini AI.`);
      }
    }

    // Tier 2: Direct Gemini AI Generation
    try {
      for await (const sentence of streamAiResponse(message, role)) {
        await processSentence(sentence, seq++, targetUserId, chatSessionId, role, source);
      }
    } catch (aiErr) {
      console.error(`[CHAT] ❌ Direct AI generation failed:`, aiErr.message);
      // Fallback message so user never gets dead silence
      await processSentence(
        "I am ready to guide you. Could you please repeat your question?",
        seq++,
        targetUserId,
        chatSessionId,
        role,
        "fallback"
      );
    }
  })();
}
