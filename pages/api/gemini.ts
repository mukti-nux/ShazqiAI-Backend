import type { NextApiRequest, NextApiResponse } from "next";
import applyCors from "@/utils/cors"; // Sesuaikan dengan path file CORS
import axios from "axios"; // Untuk cuaca API
import { searchSerper } from "@/lib/searchSerper"; // Sesuaikan jika ada utilitas Serper

// Inisialisasi API Gemini (gunakan API key yang sesuai)
const GOOGLE_API_KEY = process.env.GEMINI_API_KEY;

// Fungsi untuk menangani cuaca
const getWeather = async () => {
  try {
    const weatherRes = await axios.get(
      "https://api.open-meteo.com/v1/forecast?latitude=-7.4706&longitude=110.2178&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FBangkok"
    );
    const data = weatherRes.data.daily;
    const max = data.temperature_2m_max[0];
    const min = data.temperature_2m_min[0];
    return `Cuaca hari ini di Tempuran: suhu tertinggi sekitar ${max}°C dan terendah ${min}°C. Jangan lupa bawa payung kalau mau keluar yaa~ ☁️☂️`;
  } catch (error) {
    return "Gagal ambil data cuaca.";
  }
};

// Fungsi untuk menangani pencarian Serper
const searchContent = async (message: string) => {
  if (
    message.startsWith("cari ") ||
    message.startsWith("search ") ||
    message.includes("apa itu") ||
    message.includes("jelaskan") ||
    message.includes("dimana")
  ) {
    try {
      const results = await searchSerper(message);
      const formatted = results.length > 0
        ? `🔎 **${results[0].title}**\n${results[0].snippet}\n🔗 ${results[0].link}`
        : "Tidak ditemukan hasil yang relevan.";
      return formatted;
    } catch (err) {
      console.error("❌ Gagal ambil Serper:", err);
      return "Gagal mengambil data pencarian.";
    }
  }
  return null;
};

// Fungsi untuk menangani Gemini API menggunakan axios
const generateGeminiResponse = async (message: string) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        contents: [
          {
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
          {
            "contents":[
            {
                "parts": [
                {
                 "text": "Your text here",
              },
            ],
          },
        ],
      }
    );

    const geminiResponse = response.data?.content || "Tidak ada balasan dari Gemini.";
    return geminiResponse;
  } catch (error) {
    console.error("Error dari Gemini:", error);
    return "Gagal menghasilkan jawaban dari Gemini.";
  }
};

// Fungsi utama handler API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await applyCors(req, res); // Terapkan CORS

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metode tidak diizinkan" });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Pesan tidak boleh kosong" });
  }

  try {
    // Cek apakah pesan mengandung pertanyaan cuaca
    const isWeatherQuestion = /cuaca|derajat|panas|dingin|suhu/i.test(message);
    if (isWeatherQuestion) {
      const weatherMessage = await getWeather();
      return res.status(200).json({ reply: weatherMessage });
    }

    // Cek apakah pesan adalah pencarian Serper
    const searchMessage = await searchContent(message);
    if (searchMessage) {
      return res.status(200).json({ reply: searchMessage });
    }

    // Jika bukan cuaca atau pencarian, lanjutkan ke Gemini API
    const geminiResponse = await generateGeminiResponse(message);
    return res.status(200).json({ reply: geminiResponse });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Terjadi kesalahan." });
  }
}
