// pages/api/chat.js
import { searchBrave } from '@/lib/braveSearch';

export default async function handler(req, res) {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Tidak ada pesan yang dikirim.' });
  }

  // 🔍 Deteksi jika user ingin mencari di internet
  if (message.includes("cari") || message.includes("search")) {
    try {
      const results = await searchBrave(message);
      const formatted = results.map((item) => (
        `🔎 **${item.title}**\n${item.description}\n🔗 ${item.url}`
      )).join('\n\n');

      return res.status(200).json({
        role: "assistant",
        content: formatted,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Gagal mengambil data dari Brave Search.' });
    }
  }

  // 🤖 Kalau bukan pencarian, lanjut ke ChatGPT
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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

