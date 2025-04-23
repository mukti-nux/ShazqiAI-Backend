// pages/api/ai.ts  (contoh nama file)
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ──────────────── Konstanta CORS ──────────────── */
const ALLOWED_ORIGIN = "https://portofoliomukti.framer.website";  // ganti/array-kan kalau perlu
const ALLOWED_METHODS = "POST, OPTIONS";
const ALLOWED_HEADERS = "Content-Type";          // tambah 'Authorization' dsb. bila diperlukan
// const ALLOW_CREDENTIALS = true;               // aktifkan jika kirim cookie / auth

/* ──────────────── Inisialisasi Gemini ──────────────── */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/* ──────────────── Fungsi pencarian Serper.dev ──────────────── */
async function searchSerper(query: string) {
  const { data } = await axios.post(
    "https://google.serper.dev/search",
    { q: query },
    {
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY!,
        "Content-Type": "application/json",
      },
    }
  );
  return data.organic ?? [];
}

/* ──────────────── Route handler utama ──────────────── */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  /* ── 1. Pasang header CORS untuk SEMUA response ── */
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
  res.setHeader("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  // Jika perlu credentials:
  // res.setHeader("Access-Control-Allow-Credentials", "true");

  /* ── 2. Jawab pre‑flight OPTIONS ── */
  if (req.method === "OPTIONS") {
    return res.status(200).end();           // 204 juga boleh
  }

  /* ── 3. Batasi hanya POST ── */
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metode tidak diizinkan" });
  }

  /* ── 4. Validasi input ── */
  const { message: prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Pesan tidak boleh kosong" });
  }

  const keyword = prompt.toLowerCase();

  /* ────────── 5. Cek kata kunci CUACA ────────── */
  if (/cuaca|derajat|panas|dingin|suhu/.test(keyword)) {
    try {
      const { data } = await axios.get(
        "https://api.open-meteo.com/v1/forecast",
        {
          params: {
            latitude: -7.4706,
            longitude: 110.2178,
            daily: "temperature_2m_max,temperature_2m_min",
            timezone: "Asia/Bangkok",
          },
        }
      );

      const max = data.daily.temperature_2m_max[0];
      const min = data.daily.temperature_2m_min[0];
      const reply = `Cuaca hari ini di Tempuran: suhu tertinggi ${max}°C dan terendah ${min}°C. Jangan lupa bawa payung ya! ☁️☂️`;

      return res.status(200).json({ reply });
    } catch (err) {
      console.error("Cuaca error:", err);
      return res.status(500).json({ error: "Gagal ambil data cuaca." });
    }
  }

  /* ────────── 6. Deteksi kata kunci SERPER ────────── */
  if (
    keyword.startsWith("cari ") ||
    keyword.startsWith("search ") ||
    keyword.includes("apa itu") ||
    keyword.includes("jelaskan") ||
    keyword.includes("dimana")
  ) {
    try {
      const results = await searchSerper(prompt);
      const reply =
        results.length > 0
          ? `🔎 *${results[0].title}*\n${results[0].snippet}\n🔗 ${results[0].link}`
          : "Tidak ditemukan hasil yang relevan.";
      return res.status(200).json({ reply });
    } catch (err) {
      console.error("Serper error:", err);
      return res.status(500).json({ error: "Gagal mengambil data pencarian." });
    }
  }

  /* ────────── 7. Fallback ke GEMINI ────────── */
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const { response } = await model.generateContent(prompt);
    const reply = response.text();
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Gemini error:", err);
    return res.status(500).json({ error: "Gagal menghasilkan jawaban dari Gemini." });
  }
}
