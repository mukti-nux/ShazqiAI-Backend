import { database } from "@/lib/firebase";
import { ref, set } from "firebase/database";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { id, title, created } = req.body;

  try {
    // Simpan data ke path: /conversations/{id}
    await set(ref(database, `conversations/${id}`), {
      id,
      title,
      created,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menyimpan metadata." });
  }
}
