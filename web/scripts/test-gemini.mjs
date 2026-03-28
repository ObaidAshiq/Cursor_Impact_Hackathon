/**
 * Quick Gemini connectivity check. Run from `web/`: npm run test:gemini
 * Loads `.env.local` if present (same vars as Next.js).
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, "..");

function loadEnvLocal() {
  const p = join(webRoot, ".env.local");
  if (!existsSync(p)) return;
  const raw = readFileSync(p, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvLocal();

const key =
  process.env.GEMINI_API_KEY?.trim() ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
const configuredModel =
  process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
const fallbacks = [
  configuredModel,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-1.5-flash-002",
  "gemini-1.5-flash",
].filter((m, i, a) => a.indexOf(m) === i);

if (!key) {
  console.error(
    "No API key: set GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY) in .env.local or the environment.",
  );
  process.exit(1);
}

console.log("Testing Gemini API…");
console.log(`Key prefix: ${key.slice(0, 8)}…`);

const genAI = new GoogleGenerativeAI(key);

let lastErr = null;
let saw429 = false;
let saw404 = false;
for (const modelId of fallbacks) {
  try {
    const model = genAI.getGenerativeModel({ model: modelId });
    const res = await model.generateContent(
      'Reply with exactly one word: "ok" (no punctuation).',
    );
    const text = res.response.text()?.trim();
    console.log(`\n✓ Success with model "${modelId}"`);
    console.log(`  Response: ${text ?? "(empty)"}`);
    process.exit(0);
  } catch (e) {
    lastErr = e;
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("429") || msg.includes("quota")) saw429 = true;
    if (msg.includes("404") || msg.includes("not found")) saw404 = true;
    console.warn(`  ✗ ${modelId}: ${msg.split("\n")[0]}`);
  }
}

console.error("\n✗ All configured models failed.");
if (saw429) {
  console.error(
    "  → Rate limit or free-tier quota exhausted: wait and retry, pick another model in GEMINI_MODEL, or check billing in Google AI Studio.",
  );
}
if (saw404) {
  console.error(
    "  → Some model IDs are not available on the v1 API for your key; open AI Studio and copy an exact model name from the API docs.",
  );
}
console.error("\nLast error:", lastErr);
process.exit(1);
