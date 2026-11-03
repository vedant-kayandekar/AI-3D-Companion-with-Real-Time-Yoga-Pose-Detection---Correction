import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/index.js";

const genAI = new GoogleGenerativeAI(config.geminiApiKey || "-");

// Primary model verified active on Google API
const PRIMARY_MODEL = "gemini-3.5-flash";
const BACKUP_MODELS = ["gemini-3-flash-preview", "gemini-2.5-flash-lite"];

export const getSystemInstruction = (role) => {
  const baseInstruction = `
CRITICAL INSTRUCTIONS:
- NEVER start with generic repetitive greetings like "Hello!", "Welcome!", "Namaste!", "Hey there!". Get straight to the user's answer immediately.
- Keep each sentence concise (10-18 words max) so sentences can be streamed as snappy audio chunks.
- Do NOT output markdown code blocks or raw JSON. Respond in natural spoken conversation.
- Use facial expression or animation tags at the very start of appropriate sentences: [smile], [laugh], [sad], [Talking_0], [Talking_1], [Talking_2].`;

  if (role === "Kickboxing") {
    return `You are a high-energy Kickboxing Coach.
Rules:
1. Start with an ultra-short punchy phrase (1-3 words) like "Let's work!", "Got it.", "Focus now.".
2. Keep sentences under 15 words.
3. Use kickboxing tags: [Boxing], [Kicking], [Block], [FightingPosition].
${baseInstruction}`;
  }

  return `You are a calm, knowledgeable Yoga Instructor and supportive wellness companion.
Rules:
1. Start directly with an encouraging short response (1-4 words) like "Certainly.", "Let's begin.", "Understood.".
2. Guide poses with step-by-step alignment cues.
3. Keep the tone warm, grounded, and clear.
4. For general chat, act like a trusted mindful friend.
${baseInstruction}`;
};

export const detectAnimationAndExpression = (sentence, role, seq) => {
  let facialExpression = "smile";
  let animation = role === "Kickboxing"
    ? "FightingPosition"
    : ["Talking_0", "Talking_1", "Talking_2"][seq % 3];

  const tagMatch = sentence.match(/\[(.*?)\]/);
  if (tagMatch) {
    const tagContent = tagMatch[1].trim().toLowerCase();
    if (tagContent.includes("sad")) {
      facialExpression = "sad";
    } else if (tagContent.includes("angry")) {
      facialExpression = "angry";
    } else if (tagContent.includes("laugh")) {
      facialExpression = "smile";
      animation = "Laughing";
    } else if (tagContent.includes("box") || tagContent.includes("punch")) {
      animation = "Boxing";
    } else if (tagContent.includes("kick")) {
      animation = "Kicking";
    } else if (tagContent.includes("block")) {
      animation = "Block";
    } else if (tagContent.includes("talking")) {
      animation = tagMatch[1].trim();
    }
  }

  const cleanText = sentence.replace(/\[.*?\]/g, "").trim();
  return { cleanText, facialExpression, animation };
};

/**
 * Stream responses from Gemini and yield complete sentences as they form
 */
export async function* streamAiResponse(userMessage, role) {
  const systemInstruction = getSystemInstruction(role);

  const modelsToTry = [PRIMARY_MODEL, ...BACKUP_MODELS];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI] Attempting stream with model '${modelName}'...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
      });

      const chat = model.startChat({ history: [] });
      const result = await chat.sendMessageStream(userMessage);

      let buffer = "";

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          buffer += chunkText;
          // Match complete sentence ending in punctuation followed by space or newline
          let match;
          while ((match = buffer.match(/^(.*?[.!?।\n])\s*/))) {
            const sentence = match[1].trim();
            buffer = buffer.substring(match[0].length);
            if (sentence.length > 1) {
              yield sentence;
            }
          }
        }
      }

      if (buffer.trim().length > 1) {
        yield buffer.trim();
      }

      return; // Succeeded!
    } catch (err) {
      console.warn(`[AI] Model '${modelName}' failed: ${err.message}. Trying next model...`);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models failed to generate response");
}
