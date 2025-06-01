import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { promises as fs } from "fs";
import path from "path";
import applyCors from "@/utils/cors";

/* ── Inisialisasi Gemini API ── */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/* ── Cache profil AI ── */
let AI_PROFILE = "";
async function getProfile() {
  if (!AI_PROFILE) {
    const filePath = path.join(process.cwd(), "data", "ai_profile.md");
    AI_PROFILE = await fs.readFile(filePath, "utf8");
  }
  return AI_PROFILE;
}

/* ── Fungsi ke Serper.dev ── */
async function searchSerper(q: string) {
  const { data } = await axios.post(
    "https://google.serper.dev/search",
    { q },
    {
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY!,
        "Content-Type": "application/json",
      },
    }
  );
  return data.organic ?? [];
}

/* ── Allowed Origins ── */
const ALLOWED_ORIGINS = [
  "https://portofoliomukti.framer.website",
  "https://portofolioku2-astro-theme.vercel.app",
];

/* ── Endpoint API ── */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("📥 /gemini hit", { method: req.method, at: Date.now() });

  await applyCors(req, res);

  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { messages, username } = req.body || {};

  if (!messages || typeof messages !== "string") {
    console.warn("⚠️ Bad Request: messages kosong atau bukan string");
    return res.status(400).json({ error: "Empty or invalid messages" });
  }

  console.log("🧾 messages received:\n", messages);

  // Ambil kalimat terakhir dari user untuk dianalisis keywordnya
  const userLines = messages
    .split("\n")
    .filter((line) => line.startsWith("User:") || line.startsWith("🧑"));
  const lastUserMessage = userLines[userLines.length - 1] || "";
  const keyword = lastUserMessage.toLowerCase();

  /* ====== 1. CUACA ====== */
  if (/cuaca|derajat|panas|dingin|suhu/.test(keyword)) {
    try {
      const { data } = await axios.get("https://api.open-meteo.com/v1/forecast", {
        params: {
          latitude: -7.4706,
          longitude: 110.2178,
          daily: "temperature_2m_max,temperature_2m_min",
          timezone: "Asia/Bangkok",
        },
      });
      const reply = `Cuaca hari ini di Tempuran: tertinggi ${data.daily.temperature_2m_max[0]}°C dan terendah ${data.daily.temperature_2m_min[0]}°C.`;
      return res.status(200).json({ reply });
    } catch {
      return res.status(500).json({ error: "Gagal ambil data cuaca" });
    }
  }

  /* ====== 2. SERPER SEARCH ====== */
  if (/cari|search|apa itu|jelaskan|dimana|siapa|kenapa|kapan/.test(keyword)) {
    try {
      const searchQuery = lastUserMessage.replace(/^User:\s*/i, "").trim();
      const results = await searchSerper(searchQuery);
      const r =
        results.length > 0
          ? `🔎 *${results[0].title}*\n${results[0].snippet}\n🔗 ${results[0].link}`
          : "Tidak ditemukan hasil relevan.";
      return res.status(200).json({ reply: r });
    } catch {
      return res.status(500).json({ error: "Gagal ambil data pencarian" });
    }
  }

  /* ====== 3. GEMINI AI ====== */
  try {
    const profile = await getProfile();
    const persona = username ? `Kamu sedang berbicara dengan ${username}.` : "";
    const systemMsg = `${profile}\n${persona}\n\n${messages}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const { response } = await model.generateContent(systemMsg);
    const reply = response.text();

    return res.status(200).json({ reply });
  } catch (e) {
    console.error("Gemini error:", e);
    return res.status(500).json({ error: "Gagal menghasilkan jawaban" });
  }
}
