import { searchSerper } from '../../lib/searchSerper';

export default async function handler(req, res) {
  const { message } = req.body;
  console.log("📩 Pesan diterima:", message);

  if (!message) {
    return res.status(400).json({ error: 'Tidak ada pesan yang dikirim.' });
  }

  const keyword = message.toLowerCase();

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
      const formatted = results.map((item) => (
        `🔎 **${item.title}**\n${item.snippet}\n🔗 ${item.link}`
      )).join('\n\n');

      return res.status(200).json({
        role: "assistant",
        content: formatted,
      });
    } catch (err) {
      console.error("❌ Gagal melakukan pencarian:", err.message);
      return res.status(500).json({ error: 'Gagal mengambil data dari Serper Search.' });
    }
  }

  // Jika bukan keyword pencarian, pakai ChatGPT
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
