// pages/api/log.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { adminDb } from '@/lib/firebase-admin'
import { ref, push } from 'firebase-admin/database'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' })

  const data = req.body

  try {
    const logRef = ref(adminDb, 'gemini_logs')
    await push(logRef, data)

    res.status(200).json({ message: 'Log berhasil dikirim.' })
  } catch (err) {
    console.error('Gagal kirim log:', err)
    res.status(500).json({ message: 'Gagal kirim log' })
  }
}