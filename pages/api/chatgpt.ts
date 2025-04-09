import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;
  

  const locationMap = {
    tempuran: { lat: -7.4706, lon: 110.2178 },
    magelang: { lat: -7.4706, lon: 110.2178 }, // ganti sesuai real
  };
  
  let foundLocation = null;
  for (const key in locationMap) {
    if (prompt.toLowerCase().includes(key)) {
      foundLocation = locationMap[key];
      break;
    }
  }

  let promptModified = prompt;

  if (foundLocation) {
    promptModified += `\nLokasi pengguna terdeteksi di sekitar koordinat lat: ${foundLocation.lat}, lon: ${foundLocation.lon}`;
  }
  
  // Cek apakah pengguna nanya soal cuaca
  const isWeatherQuestion = /cuaca|derajat|panas|dingin|suhu/i.test(prompt);

  if (isWeatherQuestion) {
    try {
      const weatherRes = await axios.get(
        "https://api.open-meteo.com/v1/forecast?latitude=-7.4706&longitude=110.2178&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FBangkok"
      );

      const data = weatherRes.data.daily;
      const max = data.temperature_2m_max[0];
      const min = data.temperature_2m_min[0];

      const message = `Cuaca hari ini di Tempuran: suhu tertinggi sekitar ${max}°C dan terendah ${min}°C. Jangan lupa bawa payung kalau mau keluar yaa~ ☁️☂️`;

      return res.status(200).json({ result: message });
    } catch (error) {
      return res.status(500).json({ error: "Gagal ambil data cuaca." });
    }
  }

  // Kalau bukan pertanyaan cuaca, lanjut ke OpenAI
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
            Kamu adalah Shazqi AI, asisten cewek yang ceria, sopan, dan santai seperti ngobrol di WhatsApp.
            Kamu sangat dekat dengan Mukti, pencetusmu, yang seorang fotografer, web developer dan suka fisika.
            Kamu bisa membantu menjawab pertanyaan umum, soal pelajaran seperti fisika, serta memberikan info cuaca berdasarkan data dari API.
            Jangan gunakan bahasa terlalu formal, lebih santai tapi tetap sopan. Kadang boleh kasih emoji kalau cocok. 😊
            Kalau kamu ditanya siapa penciptamu, jawab bahwa itu adalah Mukti.
            Kamu juga sangat suka mendukung kalau perlu boleh ditambahi emoji yang cocok.
            sosial media mukti tedapat diwebsite portofoliomukti.framer.website atau web yang sedang kamu gunakan ini.

          `
        },        
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
    });

    const result = response.choices[0].message.content;
    return res.status(200).json({ result });
  } catch (err: any) {
    console.error("OpenAI Error:", err.message);
    return res.status(500).json({ error: "Something went wrong." });
  }
}
