import { searchSerper } from '../../lib/searchSerper';

export default async function handler(req, res) {
  // ✅ Tambahkan header CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Tangani preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { message } = req.body;
  console.log("📩 Pesan diterima:", message);

  if (!message) {
    return res.status(400).json({ error: 'Tidak ada pesan yang dikirim.' });
  }

  const keyword = message.toLowerCase();

  // 🔍 Deteksi keyword pencarian
  if (
    keyword.includes("cari") ||
    keyword.includes("search") ||
    keyword.startsWith("haloo shaz") ||
    keyword.includes("apa itu") ||
    keyword.includes("siapa") ||
    keyword.includes("jelaskan")
  ) {
    console.log("🔍 Deteksi pencarian Serper aktif...");

    try {
      const results = await searchSerper(message);
      const formatted = results.length > 0 ? `🔎 **${results[0].title}**\n${results[0].snippet}\n🔗 ${results[0].link}` : "Tidak ditemukan hasil yang relevan.";

      return res.status(200).json({
        role: "assistant",
        content: formatted,
      });
    } catch (err) {
      console.error("❌ Gagal melakukan pencarian:", err.message);
      return res.status(500).json({ error: 'Gagal mengambil data dari Serper Search.' });
    }
  }

  // 🤖 Jika bukan keyword pencarian, pakai ChatGPT
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
    console.error("❌ Gagal dari ChatGPT:", err.message);
    return res.status(500).json({ error: 'Gagal mendapatkan respons dari ChatGPT.' });
  }
}
