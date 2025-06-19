import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { promises as fs } from "fs";
import path from "path";
import applyCors from "@/utils/cors";

// 🔥 Firebase Setup
import { ref, push } from "firebase/database";
import { database } from "@/lib/firebase";

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

let AI_PROFILE = "";
async function getProfile() {
  if (!AI_PROFILE) {
    const filePath = path.join(process.cwd(), "data", "ai_profile.md");
    AI_PROFILE = await fs.readFile(filePath, "utf8");
  }
  return AI_PROFILE;
}

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

const ALLOWED_ORIGINS = [
  "https://portofoliomukti.framer.website",
  "https://portofolioku2-astro-theme.vercel.app",
  "https://portofolioku-v2.vercel.app",
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Empty or invalid messages" });
  }

  const userMessages = messages.filter((m) => m.role === "user");
  const lastUserMessage = userMessages.length
    ? userMessages[userMessages.length - 1].content.toLowerCase()
    : "";

  // 🔍 Cuaca
  if (/cuaca|derajat|panas|dingin|suhu/.test(lastUserMessage)) {
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

  // 🔎 Pencarian via Serper
  if (/cari|search|carikan/.test(lastUserMessage)) {
    try {
      const searchQuery = lastUserMessage.trim();
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

  // 🤖 Chat dengan Gemini
  try {
    const profile = await getProfile();
    const persona = username ? `Kamu sedang berbicara dengan ${username}.` : "";

    const chatHistoryStr = messages
      .map((msg) => {
        if (msg.role === "user") return `User: ${msg.content}`;
        if (msg.role === "assistant") return `AI: ${msg.content.replace(/^AI:\s*/i, "")}`;
        return `${msg.role}: ${msg.content}`;
      })
      .join("\n");

    const systemMsg = `${profile}\n${persona}\n\n${chatHistoryStr}`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 1024,
      },
    });

    const { response } = await model.generateContent(systemMsg);
    const reply = response.text().replace(/^AI:\s*/i, "");

    // 📝 Simpan ke Firebase
    await push(ref(database, "gemini_logs"), {
      username: username || "anonim",
      prompt: lastUserMessage,
      reply,
      timestamp: Date.now(),
    });

    return res.status(200).json({ reply });
  } catch (e) {
    console.error("Gemini error:", e);
    return res.status(500).json({ error: "Gagal menghasilkan jawaban" });
  }
}
