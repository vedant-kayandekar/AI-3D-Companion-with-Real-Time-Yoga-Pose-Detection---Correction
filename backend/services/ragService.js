import axios from "axios";
import { config } from "../config/index.js";

/**
 * Ask knowledge base via the Python RAG service
 */
export async function askKnowledgeBase(question) {
  const url = `${config.ragServiceUrl}/ask/`;
  console.log(`[RAG] 🧠 Querying knowledge base at: ${url}`);
  console.log(`[RAG] ❓ Question: "${question}"`);

  const formData = new URLSearchParams();
  formData.append("question", question);

  const response = await axios.post(url, formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 10000, // 10-second timeout guard
  });

  if (response.data && response.data.response) {
    console.log(`[RAG] ✅ Knowledge base match found! Sources:`, response.data.sources || []);
    return {
      answer: response.data.response,
      sources: response.data.sources || [],
    };
  }

  throw new Error("RAG service returned empty response");
}
