// lib/firebase-admin.ts
import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

const serviceAccount = {
  type: "service_account",
  project_id: "xxx",
  private_key_id: "xxx",
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: "xxx@xxx.iam.gserviceaccount.com",
  client_id: "xxx",
  // dan seterusnya...
}

const app = !getApps().length
  ? initializeApp({ credential: cert(serviceAccount as any) })
  : getApps()[0]

export const db = getFirestore()
