import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { promises as fs } from "fs";
import path from "path";
import applyCors from "@/utils/cors";

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

  const { model, message, messages, username } = req.body || {};

  try {
    if (model === "gpt") {
      // Validasi message harus array
      if (!message || !Array.isArray(message)) {
        return res.status(400).json({ error: "'message' harus berupa array untuk model GPT" });
      }

      // Panggil GPT API di sini (misal OpenAI)
      // Contoh sederhana, sesuaikan dengan kode asli kamu
      const openaiRes = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: message,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const reply = openaiRes.data.choices[0].message.content;
      return res.status(200).json({ reply });

    } else if (model === "gemini") {
      // Validasi messages harus string
      if (!messages || typeof messages !== "string") {
        return res.status(400).json({ error: "'messages' harus berupa string untuk model Gemini" });
      }

      // Proses Gemini seperti kode kamu sebelumnya
      const profile = await getProfile();
      const persona = username ? `Kamu sedang berbicara dengan ${username}.` : "";
      const systemMsg = `${profile}\n${persona}\n\n${messages}`;

      const gemModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const { response } = await gemModel.generateContent(systemMsg);
      const reply = response.text();

      return res.status(200).json({ reply });

    } else {
      return res.status(400).json({ error: "Model tidak dikenali atau tidak disediakan" });
    }
  } catch (e) {
    console.error("Error di API chat:", e);
    return res.status(500).json({ error: "Gagal menghasilkan jawaban" });
  }
}
