// pages/api/chat.js
import { searchBrave } from '../../lib/braveSearch';

export default async function handler(req, res) {
  const { message } = req.body;

  console.log("📩 Pesan diterima:", message); // tambahkan ini

  if (!message) {
    return res.status(400).json({ error: 'Tidak ada pesan yang dikirim.' });
  }

  const lowerMessage = message.toLowerCase();

  // 🔍 Deteksi jika user ingin mencari di internet
  if (lowerMessage.includes("cari") || lowerMessage.includes("search")) {
    console.log("🔍 Trigger pencarian Brave jalan");

    // Ambil hanya isi query setelah "cari" atau "search"
    const query = message
      .toLowerCase()
      .replace(/^search\s+/i, '')
      .replace(/^cari\s+/i, '');

    try {
      const results = await searchBrave(query);

      const formatted = results.map((item, i) => (
        `🔹 *${i + 1}. ${item.title}*\n${item.description}\n👉 ${item.url}`
      )).join('\n\n');

      return res.status(200).json({
        role: "assistant",
        content: formatted || "Maaf, aku tidak menemukan hasil yang relevan dari Brave Search.",
      });

    } catch (err) {
      console.error("❌ Brave Search error:", err);
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
        model: "gpt-4o-mini",
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
    console.error("❌ ChatGPT API error:", err);
    return res.status(500).json({ error: 'Gagal mendapatkan respons dari ChatGPT.' });
  }
}
