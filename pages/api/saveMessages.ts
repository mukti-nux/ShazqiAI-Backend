// pages/api/saveMessages.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import serviceAccount from "@/lib/serviceAccountKey.json" // pastikan path-nya sesuai
import { db } from "@/lib/firebase-admin"

export default async function handler(req, res) {
  const { id, messages } = req.body
  await db.collection("messages").doc(id).set({ messages })
  res.status(200).json({ ok: true })


const app = initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end()

  const { id, messages } = req.body
  if (!id || !Array.isArray(messages)) return res.status(400).json({ error: "Invalid data" })

  await db.collection("conversations").doc(id).set({ messages }, { merge: true })
  res.status(200).json({ success: true })
}
