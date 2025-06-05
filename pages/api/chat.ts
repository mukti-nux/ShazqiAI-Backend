import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { messages } = req.body || {};

  if (!messages || typeof messages !== "string") {
    return res.status(400).json({ error: "Empty or invalid messages" });
  }

  try {
    // Contoh request ke OpenAI GPT (ganti sesuai provider-mu)
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: messages
          .split("\n")
          .map((line) => {
            // Parse simple role & content dari string "User: xxx" atau "AI: xxx"
            if (line.startsWith("User:") || line.startsWith("🧑")) {
              return { role: "user", content: line.replace(/^User:\s*|^🧑\s*/, "") };
            }
            if (line.startsWith("AI:") || line.startsWith("🤖")) {
              return { role: "assistant", content: line.replace(/^AI:\s*|^🤖\s*/, "") };
            }
            return null;
          })
          .filter(Boolean),
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data.choices?.[0]?.message?.content || "Maaf, tidak ada jawaban.";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("GPT error:", error);
    return res.status(500).json({ error: "Gagal memproses permintaan GPT" });
  }
}
