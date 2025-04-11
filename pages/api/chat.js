// pages/api/chat.js
import { searchBrave } from '../../lib/braveSearch';

export default async function handler(req, res) {
  const { message } = req.body;
  console.log("📩 Pesan diterima:", message);
  console.log("🔥 Chat API Triggered");


  if (!message) {
    return res.status(400).json({ error: 'Tidak ada pesan yang dikirim.' });
  }

  const keyword = message.toLowerCase();

  // 🧠 Deteksi apakah perlu pakai Brave
  const isSearch =
    keyword.includes("cari") ||
    keyword.includes("search") ||
    keyword.startsWith("haloo shaz") ||
    keyword.includes("apa itu") ||
    keyword.includes("siapa") ||
    keyword.includes("jelaskan");

  if (isSearch) {
    console.log("🔍 Deteksi pencarian. Menggunakan Brave...");
    try {
      const results = await searchBrave(message);
      const formatted = results.slice(0, 5).map((item) => (
        `🔎 **${item.title}**\n${item.description}\n🔗 ${item.url}`
      )).join('\n\n');

      return res.status(200).json({
        role: "assistant",
        content: formatted || "Maaf, tidak ditemukan hasil yang relevan.",
      });
    } catch (err) {
      console.error("❌ Brave Search error:", err);
      return res.status(500).json({ error: 'Gagal mengambil data dari Brave Search.' });
    }
  }

  // 🤖 Lanjut ke OpenAI kalau bukan pencarian
  console.log("💬 Melanjutkan ke OpenAI...");
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
    console.error("❌ ChatGPT error:", err);
    return res.status(500).json({ error: 'Gagal mendapatkan respons dari ChatGPT.' });
  }
}
