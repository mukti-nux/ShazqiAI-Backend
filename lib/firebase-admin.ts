// lib/firebaseAdmin.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: 'https://shazqi-ai-data.firebaseio.com/'
  })
}

export const adminDb = getDatabase()
