import { db } from "@/lib/firebase"
import { collection, doc, setDoc } from "firebase/firestore"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  const { convId, messages } = req.body
  try {
    await setDoc(doc(collection(db, "messages"), convId), { messages })
    res.status(200).json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Gagal menyimpan pesan." })
  }
}
