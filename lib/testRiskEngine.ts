import { scoreTransaction, demoUser } from "./riskEngine"

console.log("Test 1 (should be silent):", scoreTransaction(demoUser, {
  recipient: "Priya Sharma",
  amount: 300,
  note: "",
  elapsedSeconds: 5,
}))

console.log("Test 2 (should be pause):", scoreTransaction(demoUser, {
  recipient: "asas@bank",
  amount: 8000,
  note: "urgent refund",
  elapsedSeconds: 1.1,
}))