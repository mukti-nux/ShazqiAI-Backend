import { searchSerper } from '@/lib/searchSerper';
import { getWeather } from '@/page/api/cuaca'; // misalnya ini open-meteo
import { NextResponse } from 'next/server';

export default async function handler(req, res) {
  const { message } = req.body;
  const keyword = message.toLowerCase();

  if (!message) {
    return res.status(400).json({ error: 'Tidak ada pesan dikirim.' });
  }

  // 🔍 1. Deteksi Cuaca
  if (keyword.includes("cuaca") || keyword.includes("weather")) {
    const weather = await getWeather(); // kamu atur fungsi dan parameternya
    return res.status(200).json({
      role: "assistant",
      content: weather,
    });
  }

  // 🔍 2. Deteksi Pencarian
  if (keyword.startsWith("cari ") || keyword.startsWith("search ")) {
    const results = await searchSerper(message);
    return res.status(200).json({
      role: "assistant",
      content: results,
    });
  }

  // 🤖 3. Default ke ChatGPT
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: message }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return res.status(200).json({
      role: "assistant",
      content: data.choices?.[0]?.message?.content || "(Tidak ada balasan)",
    });
  } catch (err) {
    return res.status(500).json({ error: 'Gagal mendapatkan respons dari ChatGPT.' });
  }
}
