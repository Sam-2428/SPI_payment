import {
  doc,
  getDoc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore"
import { db } from "./firebase"

const COLLECTION_NAME = "scamBlacklist"
export const PAUSE_THRESHOLD = 3

export function isCommunityPaused(entry) {
  return Boolean(entry && Number(entry.reportCount || 0) >= PAUSE_THRESHOLD)
}

function normalizeUpiId(upiId) {
  if (typeof upiId !== "string" || !upiId.trim()) {
    throw new TypeError("upiId must be a non-empty string")
  }

  return upiId.trim().toLowerCase().replaceAll("/", "_")
}

function blacklistRef(upiId) {
  return doc(db, COLLECTION_NAME, normalizeUpiId(upiId))
}

export async function reportScam(upiId, reason) {
  const recipientId = normalizeUpiId(upiId)
  const message = typeof reason === "string" ? reason.trim() : ""

  await setDoc(
    blacklistRef(recipientId),
    {
      recipientId,
      reason: message,
      reportCount: increment(1),
      lastReported: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function checkBlacklist(upiId) {
  const snapshot = await getDoc(blacklistRef(upiId))

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

export function watchRecipient(upiId, callback) {
  return onSnapshot(blacklistRef(upiId), (snapshot) => {
    callback(
      snapshot.exists()
        ? { id: snapshot.id, ...snapshot.data() }
        : null,
    )
  })
}

export { normalizeUpiId }
