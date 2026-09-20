import { getApp, getApps, initializeApp } from "firebase/app"
import { collection, getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.apiKey_2,
  authDomain: "spi-nudge.firebaseapp.com",
  projectId: "spi-nudge",
  storageBucket: "spi-nudge.firebasestorage.app",
  messagingSenderId: "401036677483",
  appId: "1:401036677483:web:2eff8c0b2718d22177fc2e",
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const scamBlacklist = collection(db, "scamBlacklist")
