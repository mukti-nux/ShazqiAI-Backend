import { searchSerper } from '@/lib/searchSerper'
import { getWeather } from '@/lib/weatherAPI'

export default async function handler(req, res) {
  // 🔐 CORS Header (ganti domain kalau perlu)
  res.setHeader("Access-Control-Allow-Origin", "https://portofoliomukti.framer.website")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") return res.status(200).end()

  const { message } = req.body

  if (!message) {
    return res.status(400).json({ error: "Tidak ada pesan yang dikirim." })
  }

  const keyword = message.toLowerCase()

  // ☁️ 1. Deteksi Cuaca
  if (keyword.includes("cuaca") || keyword.includes("weather")) {
    try {
      const weather = await getWeather()
      console.log("🌤 Cuaca dijawab:", weather)
      return res.status(200).json({
        role: "assistant",
        content: weather,
      })
    } catch (err) {
      console.error("❌ Gagal ambil cuaca:", err)
      return res.status(500).json({ error: "Gagal mengambil data cuaca." })
    }
  }

  // 🔎 2. Deteksi Pencarian Serper
  if (
    keyword.startsWith("cari ") ||
    keyword.startsWith("search ") ||
    keyword.includes("apa itu") ||
    keyword.includes("jelaskan") ||
    keyword.includes("dimana")
  ) {
    try {
      const results = await searchSerper(message)
      console.log("🔍 Hasil Serper:", results)
      const formatted = results.length > 0
        ? `🔎 **${results[0].title}**\n${results[0].snippet}\n🔗 ${results[0].link}`
        : "Tidak ditemukan hasil yang relevan."

      return res.status(200).json({
        role: "assistant",
        content: formatted,
      })
    } catch (err) {
      console.error("❌ Gagal ambil Serper:", err)
      return res.status(500).json({ error: "Gagal mengambil data pencarian." })
    }
  }

  // 💬 3. Default ChatGPT
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-mini",
        messages: [{ role: "user", content: message }],
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    console.log("🧠 ChatGPT Balasan:", data)

    return res.status(200).json({
      role: "assistant",
      content: data.choices?.[0]?.message?.content || "(Tidak ada balasan)",
    })
  } catch (err) {
    console.error("❌ Gagal dari ChatGPT:", err)
    return res.status(500).json({ error: "Gagal mendapatkan respons dari ChatGPT." })
  }
}
