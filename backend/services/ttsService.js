import fs, { promises as fsp } from "fs";
import { spawn } from "child_process";
import { config } from "../config/index.js";

const PIPER_SAMPLE_RATE = 22050;
const PIPER_CHANNELS = 1;
const PIPER_BITS_PER_SAMPLE = 16;
const PIPER_POOL_SIZE = 2; // 2 warmed-up workers is optimal for memory & speed

class PiperPool {
  constructor() {
    this.workers = [];
    this.queue = [];
    this.ready = false;
    this.failed = false;
  }

  async start() {
    if (!config.enablePiperTts) {
      console.log("ℹ️ Piper TTS disabled via config. Using Edge-TTS.");
      return;
    }

    try {
      await fsp.access(config.paths.piperBin);
      await fsp.access(config.paths.piperModel);
    } catch {
      console.warn(`⚠️ Piper binary/model not accessible. Using Edge-TTS as primary.`);
      this.failed = true;
      return;
    }

    console.log(`🔥 Starting Piper TTS pool (${PIPER_POOL_SIZE} workers)...`);

    const readyPromises = [];
    for (let i = 0; i < PIPER_POOL_SIZE; i++) {
      const { worker, readyPromise } = this._spawnWorker(i);
      this.workers.push(worker);
      readyPromises.push(readyPromise);
    }

    // Wait until at least one worker finishes loading the ONNX model
    try {
      await Promise.race([
        Promise.all(readyPromises),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Piper startup timeout (8s)")), 8000)
        ),
      ]);
      this.ready = true;
      console.log(`✅ Piper TTS pool ready (Warmed up)!`);
    } catch (e) {
      console.warn(`⚠️ Piper warming warning: ${e.message}. Will try lazily.`);
      this.ready = true;
    }
  }

  _spawnWorker(id) {
    let markReady;
    const readyPromise = new Promise((resolve) => {
      markReady = resolve;
    });

    const proc = spawn(
      config.paths.piperBin,
      ["--model", config.paths.piperModel, "--output_raw", "--json-input"],
      { stdio: ["pipe", "pipe", "pipe"] }
    );

    const worker = {
      id,
      proc,
      busy: false,
      isWarmed: false,
      resolve: null,
      reject: null,
      audioChunks: [],
      timer: null,
    };

    proc.stdout.on("data", (chunk) => {
      worker.audioChunks.push(chunk);
      if (worker.timer) clearTimeout(worker.timer);
      worker.timer = setTimeout(() => this._finish(worker), 120);
    });

    proc.stderr.on("data", (data) => {
      const msg = data.toString();
      if (msg.includes("Initialized piper") || msg.includes("Loaded voice")) {
        worker.isWarmed = true;
        markReady();
      }
    });

    proc.on("exit", () => {
      if (worker.reject) worker.reject(new Error(`Piper worker ${id} exited`));
      const idx = this.workers.findIndex((w) => w.id === id);
      if (idx >= 0) {
        const { worker: newWorker } = this._spawnWorker(id);
        this.workers[idx] = newWorker;
      }
    });

    return { worker, readyPromise };
  }

  _finish(worker) {
    if (!worker.resolve) return;

    const pcm = Buffer.concat(worker.audioChunks);
    worker.audioChunks = [];
    const wav = this._pcmToWav(pcm);
    const resolve = worker.resolve;
    worker.resolve = null;
    worker.reject = null;
    worker.busy = false;

    resolve(wav.toString("base64"));
    this._next();
  }

  _pcmToWav(pcm) {
    const h = Buffer.alloc(44);
    const byteRate = PIPER_SAMPLE_RATE * PIPER_CHANNELS * (PIPER_BITS_PER_SAMPLE / 8);
    const blockAlign = PIPER_CHANNELS * (PIPER_BITS_PER_SAMPLE / 8);
    h.write("RIFF", 0);
    h.writeUInt32LE(36 + pcm.length, 4);
    h.write("WAVE", 8);
    h.write("fmt ", 12);
    h.writeUInt32LE(16, 16);
    h.writeUInt16LE(1, 20);
    h.writeUInt16LE(PIPER_CHANNELS, 22);
    h.writeUInt32LE(PIPER_SAMPLE_RATE, 24);
    h.writeUInt32LE(byteRate, 28);
    h.writeUInt16LE(blockAlign, 32);
    h.writeUInt16LE(PIPER_BITS_PER_SAMPLE, 34);
    h.write("data", 36);
    h.writeUInt32LE(pcm.length, 40);
    return Buffer.concat([h, pcm]);
  }

  synthesize(text) {
    return new Promise((resolve, reject) => {
      // 5-second timeout guardrail
      const timer = setTimeout(() => {
        const itemIdx = this.queue.findIndex((q) => q.resolve === resolve);
        if (itemIdx >= 0) this.queue.splice(itemIdx, 1);
        reject(new Error("Piper synthesis timeout (5s)"));
      }, 5000);

      this.queue.push({
        text,
        resolve: (data) => {
          clearTimeout(timer);
          resolve(data);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
      this._next();
    });
  }

  _next() {
    if (this.queue.length === 0) return;
    const worker = this.workers.find((w) => !w.busy && w.isWarmed);
    if (!worker) return;

    const { text, resolve, reject } = this.queue.shift();
    worker.busy = true;
    worker.resolve = resolve;
    worker.reject = reject;
    worker.audioChunks = [];

    if (worker.timer) clearTimeout(worker.timer);

    try {
      worker.proc.stdin.write(JSON.stringify({ text }) + "\n");
    } catch (e) {
      worker.busy = false;
      reject(e);
      this._next();
    }
  }
}

export const piperPool = new PiperPool();
piperPool.start();

const getVoiceForRole = (role) => {
  if (role === "Kickboxing") return "en-US-ChristopherNeural";
  if (role === "Yoga") return "en-IN-NeerjaNeural";
  return config.edgeTtsVoice;
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

  if (audioChunks.length === 0) {
    throw new Error("Edge-TTS returned 0 audio chunks.");
  }

  return {
    audioBase64: Buffer.concat(audioChunks).toString("base64"),
    wordBoundaries,
  };
}

/**
 * Resilient TTS Generator:
 * Tier 1: Piper TTS (Local, ultra-low latency)
 * Tier 2: Edge-TTS (Cloud neural fallback)
 * Tier 3: Null Fallback (Client never blocks)
 */
export async function generateTTS(text, role) {
  // 1. Try Piper first if active and ready
  if (piperPool.ready && !piperPool.failed) {
    try {
      console.log(`[TTS] 🗣️ Piper synthesizing: "${text.substring(0, 30)}..."`);
      const audioBase64 = await piperPool.synthesize(text);
      return { audioBase64, wordBoundaries: null, source: "piper" };
    } catch (e) {
      console.warn(`[TTS] ⚠️ Piper fallback: ${e.message}`);
    }
  }

  // 2. Try Edge-TTS
  try {
    const voice = getVoiceForRole(role);
    console.log(`[TTS] 🗣️ Edge-TTS synthesizing with '${voice}': "${text.substring(0, 30)}..."`);
    const result = await synthesizeWithEdgeTTS(text, voice);
    return { ...result, source: "edge" };
  } catch (edgeErr) {
    console.error(`[TTS] ❌ Edge-TTS failed: ${edgeErr.message}`);
  }

  // 3. Graceful degradation: Return null audio so frontend still displays text and advances
  return {
    audioBase64: null,
    wordBoundaries: null,
    source: "none",
  };
}
