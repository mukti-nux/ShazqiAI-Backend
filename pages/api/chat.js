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

  //jika terdapat keyword pencarian, pakai Meteo
  if (keyword.includes("cuaca") || keyword.includes("suhu")) {
    console.log("🌤️ Deteksi cuaca...");
    const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=-7.4706&longitude=110.2178&daily=temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum,precipitation_hours,uv_index_clear_sky_max&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&timezone=Asia%2FBangkok"); // sesuaikan URL & query
    const weather = await response.json();
    return res.status(200).json({
      role: "assistant",
      content: `Cuaca saat ini: ${weather.current.temperature}°C.`,
    });
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

if (!response.ok) {
  console.error("⚠️ Error dari OpenAI:", data);
  return res.status(500).json({ error: data.error?.message || "Gagal dari OpenAI" });
}

if (!data.choices || !data.choices[0]?.message?.content) {
  console.warn("⚠️ Response OpenAI tidak memiliki konten.");
  return res.status(500).json({ error: "Tidak ada balasan dari AI." });
}

return res.status(200).json({
  role: "assistant",
  content: data.choices[0].message.content,
});

  } catch (err) {
    console.error("❌ Gagal dari ChatGPT:", err.message);
    return res.status(500).json({ error: 'Gagal mendapatkan respons dari ChatGPT.' });
  }
}
