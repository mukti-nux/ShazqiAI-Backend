import type { NextApiRequest, NextApiResponse } from 'next'
import { adminDb } from '@/lib/firebase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' })

  const data = req.body

  try {
    await adminDb.ref('gemini_logs').push({
      ...data,
      timestamp: Date.now()
    })

    res.status(200).json({ message: 'Log berhasil dikirim.' })
  } catch (err) {
    console.error('Gagal kirim log:', err)
    res.status(500).json({ message: 'Gagal kirim log' })
  }
}
