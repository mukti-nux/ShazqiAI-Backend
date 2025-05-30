import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { promises as fs } from "fs";
import path from "path";

/* ── Konstanta CORS ── */
const ORIGIN  = ["https://portofoliomukti.framer.website", 
                 "https://portofolioku2-astro-theme.vercel.app/"]; // ganti "*" saat debug
const METHODS = "POST, OPTIONS";
const HEADERS = "Content-Type";

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

/* ── Endpoint API ── */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("📥 /gemini hit", { method: req.method, at: Date.now() });

  /* 1. PRE‑FLIGHT OPTIONS */
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", METHODS);
    res.setHeader("Access-Control-Allow-Headers", HEADERS);
    res.setHeader("Vary", "Origin");
    return res.status(200).end();          // ← pakai .end()
  }

  /* 2. Izinkan hanya POST */
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  /* 3. Header CORS untuk POST */
  res.setHeader("Access-Control-Allow-Origin", ORIGIN);
  res.setHeader("Vary", "Origin");

  /* 4. Ambil body */
  const { message: prompt, username } = req.body as { message?: string; username?: string };
  if (!prompt || typeof prompt !== "string")
    return res.status(400).json({ error: "Empty message" });

  const keyword = prompt.toLowerCase();

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
  if (/cari|search|apa itu|jelaskan|dimana/.test(keyword)) {
    try {
      const results = await searchSerper(prompt);
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
    const profile   = await getProfile();
    const persona   = username ? `Kamu sedang berbicara dengan ${username}.` : "";
    const systemMsg = `${profile}\n${persona}\n\nUser: ${prompt}\nAI:`;

    const model     = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const { response } = await model.generateContent(systemMsg);
    const reply = response.text();

    return res.status(200).json({ reply });
  } catch (e) {
    console.error("Gemini error:", e);
    return res.status(500).json({ error: "Gagal menghasilkan jawaban" });
  }
}
