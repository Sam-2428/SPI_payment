export interface UserProfile {
  name: string
  knownContacts: string[]
  pastTransactions: { amount: number }[]
  confidenceLevel: "New" | "Comfortable" | "Expert"
}

export interface RiskResult {
  tier: "silent" | "nudge" | "pause"
  signals: string[]
  score: number
}

export const demoUser: UserProfile = {
  name: "Sam",
  knownContacts: ["Priya Sharma", "Local Store", "Rahul Kumar"],
  pastTransactions: [
    { amount: 200 },
    { amount: 500 },
    { amount: 150 },
    { amount: 800 },
    { amount: 300 },
  ],
  confidenceLevel: "New",
}

const SUSPICIOUS_WORDS = ["urgent", "refund", "kyc", "verify", "prize", "winner"]

export function scoreTransaction(
  user: UserProfile,
  transaction: { recipient: string; amount: number; note: string; elapsedSeconds: number },
): RiskResult {
  let score = 0
  const signals: string[] = []

  const isNewRecipient = !user.knownContacts.includes(transaction.recipient)
  if (isNewRecipient) {
    score += 2
    signals.push(`${transaction.recipient} is not in your usual contacts.`)
  }

  const avgAmount =
    user.pastTransactions.reduce((sum, t) => sum + t.amount, 0) / user.pastTransactions.length
  if (avgAmount > 0 && transaction.amount > avgAmount * 2) {
    score += 2
    signals.push(`This amount is much higher than your usual payments (avg ₹${Math.round(avgAmount)}).`)
  }

  const noteLower = transaction.note.toLowerCase()
  const foundWord = SUSPICIOUS_WORDS.find((word) => noteLower.includes(word))
  if (foundWord) {
    score += 2
    signals.push(`The note contains language ("${foundWord}") commonly used in scams.`)
  }

  if (transaction.elapsedSeconds < 2 && transaction.elapsedSeconds > 0) {
    score += 1
    signals.push(`This payment was completed in ${transaction.elapsedSeconds.toFixed(1)}s, which looks rushed.`)
  }

  let tier: RiskResult["tier"] = "silent"
  if (score >= 5) tier = "pause"
  else if (score >= 3) tier = "nudge"

  return { tier, signals, score }
}

export function reframeAmount(amount: number, user: UserProfile): string {
  const avgAmount =
    user.pastTransactions.reduce((sum, t) => sum + t.amount, 0) / user.pastTransactions.length
  const ratio = avgAmount > 0 ? (amount / avgAmount).toFixed(1) : "?"
  return `₹${amount} is about ${ratio}x your usual payment amount.`
}
