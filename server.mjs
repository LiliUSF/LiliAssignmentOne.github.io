import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const defaultAllowedOrigins = [
  "https://liliusf.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || defaultAllowedOrigins.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);
const requestLimit = 10;
const requestWindowMs = 10 * 60 * 1000;
const requestTimesByAddress = new Map();
const publicFiles = new Set([
  "angel-numbers.html",
  "about.html",
  "creator-photo.jpg",
  "horoscope.html",
  "index.html",
  "journaling.html",
  "manifestation.html",
  "oracle.html",
  "pages.css",
  "site.js",
  "tarot.html",
  "zodiac-signs.html"
]);
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"]
]);

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  response.end(JSON.stringify(data));
}

function applyCors(request, response) {
  const origin = request.headers.origin;
  if (!origin) return true;
  if (!allowedOrigins.has(origin)) return false;
  response.setHeader("access-control-allow-origin", origin);
  response.setHeader("access-control-allow-methods", "POST, OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type");
  response.setHeader("access-control-max-age", "600");
  response.setHeader("vary", "Origin");
  return true;
}

function getRequestCount(address, now) {
  const recentRequests = (requestTimesByAddress.get(address) || [])
    .filter((timestamp) => now - timestamp < requestWindowMs);
  requestTimesByAddress.set(address, recentRequests);
  if (requestTimesByAddress.size > 1000) {
    for (const [clientAddress, timestamps] of requestTimesByAddress) {
      const activeTimestamps = timestamps.filter((timestamp) => now - timestamp < requestWindowMs);
      if (activeTimestamps.length) requestTimesByAddress.set(clientAddress, activeTimestamps);
      else requestTimesByAddress.delete(clientAddress);
    }
  }
  return recentRequests;
}

async function readJsonRequest(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > 4096) {
      const error = new Error("Your question is too long. Please keep it under 500 characters.");
      error.statusCode = 413;
      throw error;
    }
  }
  try {
    return JSON.parse(body);
  } catch {
    const error = new Error("Please send your question as valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

async function handleOracleRequest(request, response) {
  if (!applyCors(request, response)) {
    sendJson(response, 403, { error: "This site is not allowed to use the oracle service." });
    return;
  }
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }
  if (request.method !== "POST") {
    response.setHeader("allow", "POST");
    sendJson(response, 405, { error: "Use POST to ask the oracle." });
    return;
  }
  if (!request.headers["content-type"]?.includes("application/json")) {
    sendJson(response, 415, { error: "Please send your question as JSON." });
    return;
  }

  const address = request.socket.remoteAddress || "unknown";
  const now = Date.now();
  const recentRequests = getRequestCount(address, now);
  if (recentRequests.length >= requestLimit) {
    sendJson(response, 429, { error: "The oracle needs a little pause. Please try again in a few minutes." });
    return;
  }

  let payload;
  try {
    payload = await readJsonRequest(request);
  } catch (error) {
    sendJson(response, error.statusCode || 400, { error: error.message });
    return;
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
      typeof payload.question !== "string" ||
      payload.question.trim().length < 3 ||
      payload.question.trim().length > 500) {
    sendJson(response, 400, { error: "Please ask a question between 3 and 500 characters long." });
    return;
  }
  if (!process.env.OPENAI_API_KEY) {
    sendJson(response, 503, { error: "The oracle is resting until its server is connected to OpenAI." });
    return;
  }

  recentRequests.push(now);
  requestTimesByAddress.set(address, recentRequests);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 220,
        input: [
          {
            role: "system",
            content: "You are Lili's Little Sky's kind, whimsical Magic 8-Ball advice oracle. Give a concise, warm, specific response to the user's question, ideally 2-4 sentences. Frame advice as an optional reflection, never a prediction or certainty. Do not claim supernatural powers. Do not encourage dangerous, illegal, self-harming, or harmful actions; if someone may be in immediate danger, encourage contacting local emergency services or a trusted person. Do not present yourself as a therapist, doctor, lawyer, or financial advisor. Never request sensitive personal information."
          },
          { role: "user", content: payload.question.trim() }
        ]
      }),
      signal: controller.signal
    });
    const result = await openAiResponse.json().catch(() => null);
    if (!openAiResponse.ok) {
      console.error("OpenAI advice request failed with status", openAiResponse.status);
      sendJson(response, 502, { error: "The oracle could not find its words just now. Please try again." });
      return;
    }
    const answer = result?.output
      ?.flatMap((item) => item.content || [])
      .find((item) => item.type === "output_text")
      ?.text?.trim();
    if (!answer) {
      console.error("OpenAI advice response did not contain text output.");
      sendJson(response, 502, { error: "The oracle did not return a reading. Please try again." });
      return;
    }
    sendJson(response, 200, { answer });
  } catch (error) {
    if (error.name === "AbortError") {
      sendJson(response, 504, { error: "The oracle is taking too long to answer. Please try again." });
      return;
    }
    console.error("The advice service could not be reached:", error.message);
    sendJson(response, 502, { error: "The oracle is temporarily unavailable. Please try again in a moment." });
  } finally {
    clearTimeout(timeout);
  }
}

async function serveStaticFile(request, response, pathname) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }
  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
  if (!publicFiles.has(relativePath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  const filePath = resolve(projectRoot, relativePath);
  if (filePath !== projectRoot && !filePath.startsWith(`${projectRoot}${sep}`)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  try {
    const fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "content-type": mimeTypes.get(extname(filePath)) || "application/octet-stream",
      "content-length": fileInfo.size,
      "x-content-type-options": "nosniff"
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    createReadStream(filePath).pipe(response);
  } catch (error) {
    if (error.code !== "ENOENT" && error.code !== "ENOTDIR") {
      console.error("Unable to serve requested file:", error.message);
      response.writeHead(500);
      response.end("Internal server error");
      return;
    }
    response.writeHead(404);
    response.end("Not found");
  }
}

const server = createServer((request, response) => {
  let requestUrl;
  try {
    requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }
  if (requestUrl.pathname === "/health" && request.method === "GET") {
    sendJson(response, 200, { ok: true });
    return;
  }
  if (requestUrl.pathname === "/api/oracle") {
    void handleOracleRequest(request, response);
    return;
  }
  void serveStaticFile(request, response, requestUrl.pathname);
});

server.headersTimeout = 10000;
server.requestTimeout = 25000;
server.listen(port, host, () => {
  console.log(`Lili's Little Sky is available on ${host}:${port}`);
});
