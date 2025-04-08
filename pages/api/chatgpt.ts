import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Invalid prompt." });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // atau gpt-3.5-turbo untuk testing
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
    console.error("OpenAI Error:", err?.response?.data || err.message || err);
    return res.status(500).json({ error: "Something went wrong." });
  }
}
