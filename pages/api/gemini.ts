import { GoogleGenerativeAI } from '@google/generative-ai';
import type { NextApiRequest, NextApiResponse } from 'next';

// Inisialisasi Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set header CORS untuk izinkan akses dari Framer
  res.setHeader('Access-Control-Allow-Origin', 'https://portofoliomukti.framer.website'); // Ganti jika URL berbeda
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Cek request method
  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // CORS Preflight request
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metode tidak diizinkan' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
  }

  try {
    // Request ke Gemini API
    const model = genAI.getGenerativeModel({ model: 'text-bison-1.5-pro' });
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ reply: text });
  } catch (error) {
    console.error('Error dari Gemini:', error);
    return res.status(500).json({ error: 'Gagal menghasilkan jawaban' });
  }
}
