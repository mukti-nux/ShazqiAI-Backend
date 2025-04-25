import { db } from "@/lib/firebase"
import { collection, doc, setDoc } from "firebase/firestore"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  const { id, title, created } = req.body
  try {
    await setDoc(doc(collection(db, "conversations"), id), {
      id,
      title,
      created,
    })
    res.status(200).json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Gagal menyimpan metadata." })
  }
}
