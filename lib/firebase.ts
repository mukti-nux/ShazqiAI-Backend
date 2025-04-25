// lib/firebase.ts
import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyDSC8fyua3IJ1jJzCmesor469MqVHnEvfY",
  authDomain: "shazqiai.firebaseapp.com",
  projectId: "shazqiai",
  storageBucket: "shazqiai.firebasestorage.app",
  messagingSenderId: "675357194374",
  appId: "1:675357194374:web:0996e63861a8c7ec68f907",
  measurementId: "G-30QBJJX43W"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export { db }
