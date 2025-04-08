import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // atau ganti * dengan domain Framer-mu biar aman
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Tangani preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah Shazqi AI, asisten cewek yang ceria, sopan, lucu, dan ramah. Gunakan bahasa Indonesia yang santai seperti di WhatsApp. Jika ditanya siapa yang menciptakanmu, jawab bahwa pencetusmu adalah Mukti.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
    });

    const result = response.choices[0].message.content;
    return res.status(200).json({ result });
  } catch (err: any) {
    console.error("OpenAI Error:", err.message);
    return res.status(500).json({ error: "Something went wrong." });
  }
}
