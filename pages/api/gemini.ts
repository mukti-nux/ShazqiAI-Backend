import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function searchSerper(query: string) {
  const response = await axios.post(
    "https://google.serper.dev/search",
    { q: query },
    {
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY!,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data.organic || [];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "https://portofoliomukti.framer.website");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metode tidak diizinkan" });
  }

  const { message: prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Pesan tidak boleh kosong" });
  }

  const keyword = prompt.toLowerCase();

  // 🌤️ 1. Cek pertanyaan cuaca
  if (/cuaca|derajat|panas|dingin|suhu/i.test(keyword)) {
    try {
      const weatherRes = await axios.get(
        "https://api.open-meteo.com/v1/forecast?latitude=-7.4706&longitude=110.2178&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FBangkok"
      );

      const data = weatherRes.data.daily;
      const max = data.temperature_2m_max[0];
      const min = data.temperature_2m_min[0];

      const message = `Cuaca hari ini di Tempuran: suhu tertinggi sekitar ${max}°C dan terendah ${min}°C. Jangan lupa bawa payung kalau mau keluar yaa~ ☁️☂️`;

      return res.status(200).json({ reply: message });
    } catch (error) {
      return res.status(500).json({ error: "Gagal ambil data cuaca." });
    }
  }

  // 🔎 2. Cek pertanyaan pencarian
  if (
    keyword.startsWith("cari ") ||
    keyword.startsWith("search ") ||
    keyword.includes("apa itu") ||
    keyword.includes("jelaskan") ||
    keyword.includes("dimana")
  ) {
    try {
      const results = await searchSerper(prompt);
      const formatted =
        results.length > 0
          ? `🔎 *${results[0].title}*\n${results[0].snippet}\n🔗 ${results[0].link}`
          : "Tidak ditemukan hasil yang relevan.";

      return res.status(200).json({ reply: formatted });
    } catch (err) {
      console.error("❌ Gagal ambil Serper:", err);
      return res.status(500).json({ error: "Gagal mengambil data pencarian." });
    }
  }

  // 🤖 3. Jika bukan dua di atas, teruskan ke Gemini
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text: `
              Kamu adalah Shazqi AI, asisten cewek yang ceria, sopan, dan santai seperti ngobrol di WhatsApp.
              Kamu sangat dekat dengan Mukti, pencetusmu, yang seorang fotografer, web developer dan suka fisika.
              Kamu bisa membantu menjawab pertanyaan umum, soal pelajaran seperti fisika, serta memberikan info cuaca berdasarkan data dari API.
              Jangan gunakan bahasa terlalu formal, lebih santai tapi tetap sopan. Kadang boleh kasih emoji kalau cocok. 😊
              Kalau kamu ditanya siapa penciptamu, jawab bahwa itu adalah Mukti.
              Kamu juga sangat suka mendukung kalau perlu boleh ditambahi emoji yang cocok.
              Sosial media Mukti terdapat di website portofoliomukti.framer.website atau web yang sedang kamu gunakan ini.
              `,
            },
          ],
        },
      ],
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ reply: text });
  } catch (error) {
    console.error("Error dari Gemini:", error);
    return res.status(500).json({ error: "Gagal menghasilkan jawaban dari Gemini." });
  }
}
