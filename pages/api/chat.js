// pages/api/chat.js
import { searchBrave } from '../../lib/braveSearch';

export default async function handler(req, res) {
  const { message } = req.body;
  console.log("📩 Pesan diterima:", message);

  if (!message) {
    console.warn("⚠️ Tidak ada message dikirim!");
    return res.status(400).json({ error: 'Tidak ada pesan yang dikirim.' });
  }

  // 🔍 Deteksi jika ada keyword pencarian
  const keyword = message.toLowerCase();
console.log("📥 Diterima pesan:", keyword);

  if (
    keyword.includes("cari") ||
    keyword.includes("search") ||
    keyword.startsWith("haloo shaz") ||
    keyword.includes("apa itu") ||
    keyword.includes("siapa") ||
    keyword.includes("jelaskan")
) {
  console.log("🔍 Deteksi pencarian aktif. Keyword cocok:", keyword);

  // panggil fungsi pencarian Brave di sini
  const searchResult = await searchBrave(keyword); // pastikan sudah diimport
  return NextResponse.json({ text: searchResult });
}
    console.log("🔍 Keyword 'cari' atau 'search' terdeteksi! Menggunakan Brave...");
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
      console.error("❌ Gagal melakukan pencarian:", err.message);
      return res.status(500).json({ error: 'Gagal mengambil data dari Brave Search.' });
    }
  }

  // 🤖 Jika bukan pencarian, lanjut ke OpenAI
  console.log("🤖 Bukan pencarian, meneruskan ke OpenAI...");
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
    console.log("✅ Respons OpenAI diterima:", data);

    return res.status(200).json({
      role: "assistant",
      content: data.choices?.[0]?.message?.content || "(Tidak ada balasan)",
    });
  } catch (err) {
    console.error("❌ Gagal mendapatkan respons dari ChatGPT:", err.message);
    return res.status(500).json({ error: 'Gagal mendapatkan respons dari ChatGPT.' });
  }
