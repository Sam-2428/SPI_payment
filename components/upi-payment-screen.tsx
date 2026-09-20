"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { X, MoreVertical, Delete, ArrowRight } from "lucide-react"

export interface PaymentData {
  recipient: string
  amount: number
  note: string
  elapsedSeconds: number
}

interface UpiPaymentScreenProps {
  recipientName?: string
  recipientPhone?: string
  onPaymentSubmit?: (data: PaymentData) => void
  onClose?: () => void
}

const KEYPAD_KEYS = ["1", "2", "3", "backspace", "4", "5", "6", "0", "7", "8", "9", "."] as const

export function UpiPaymentScreen({
  recipientName = "Aarav Sharma",
  recipientPhone = "+91 00000 00000",
  onPaymentSubmit,
  onClose,
}: UpiPaymentScreenProps) {
  const [amount, setAmount] = useState("0")
  const [note, setNote] = useState("")
  const [startTime, setStartTime] = useState<number | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)

  const numericAmount = Number.parseFloat(amount) || 0

  const handleKeyPress = useCallback((key: string) => {
    // Capture the moment the first digit is tapped
    setStartTime((prev) => prev ?? Date.now())

    setAmount((current) => {
      if (key === "backspace") {
        const next = current.slice(0, -1)
        return next === "" ? "0" : next
      }

      if (key === ".") {
        if (current.includes(".")) return current
        return current + "."
      }

      // Prevent more than 2 decimal places
      if (current.includes(".")) {
        const [, decimals] = current.split(".")
        if (decimals.length >= 2) return current
      }

      // Replace leading zero unless entering a decimal
      if (current === "0") return key

      return current + key
    })
  }, [])

  const handleReview = () => {
    if (numericAmount <= 0) return
    setIsReviewing(true)
  }

  const handleConfirmPay = () => {
    const confirmTime = Date.now()
    const elapsedSeconds = startTime ? (confirmTime - startTime) / 1000 : 0

    const data: PaymentData = {
      recipient: recipientName,
      amount: numericAmount,
      note: note.trim(),
      elapsedSeconds,
    }

    console.log("[v0] Payment submitted:", data)
    onPaymentSubmit?.(data)
  }

  const initial = recipientName.trim().charAt(0).toUpperCase() || "?"

  const formattedAmount = numericAmount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-4">
        <button
          type="button"
          onClick={isReviewing ? () => setIsReviewing(false) : onClose}
          aria-label={isReviewing ? "Back to amount entry" : "Close"}
          className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100"
        >
          <X className="h-6 w-6" />
        </button>
        <button
          type="button"
          aria-label="More options"
          className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100"
        >
          <MoreVertical className="h-6 w-6" />
        </button>
      </header>

      {/* Recipient + amount */}
      <div className="flex flex-1 flex-col items-center px-6 pt-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <span className="text-2xl font-semibold text-blue-600">{initial}</span>
        </div>
        <p className="mt-4 text-base text-gray-500">
          Paying <span className="font-medium text-gray-700">{recipientName}</span>
        </p>
        <p className="mt-1 text-sm text-gray-400">{recipientPhone}</p>

        {/* Amount */}
        <div className="mt-8 flex items-start justify-center">
          <span className="mt-2 text-4xl font-bold text-gray-900">₹</span>
          <span className="ml-1 text-6xl font-bold leading-none tracking-tight text-gray-900">
            {formattedAmount}
          </span>
        </div>

        {/* Note field */}
        <div className="mt-8 w-full">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note"
            className="w-full rounded-full bg-gray-100 px-5 py-3 text-center text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Keypad (hidden in review state) */}
      {!isReviewing && (
        <div className="mt-6 bg-gray-50 px-3 pb-3 pt-4">
          {/* Continue arrow, right-aligned above the keypad */}
          <div className="mb-4 flex justify-end px-1">
            <button
              type="button"
              onClick={handleReview}
              disabled={numericAmount <= 0}
              aria-label="Continue to review"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowRight className="h-6 w-6" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {KEYPAD_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeyPress(key)}
                aria-label={key === "backspace" ? "Backspace" : key}
                className="flex h-14 items-center justify-center rounded-full bg-white text-2xl font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100 active:bg-gray-200"
              >
                {key === "backspace" ? <Delete className="h-6 w-6 text-gray-700" /> : key}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action area */}
      <div className="px-4 pb-4 pt-3">
        {isReviewing && numericAmount > 0 && (
          <button
            type="button"
            onClick={handleConfirmPay}
            className="w-full rounded-full bg-blue-600 py-4 text-center text-base font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
          >
            Pay ₹{formattedAmount}
          </button>
        )}
        <p className="mt-3 text-center text-xs text-gray-400">Payments are secure and encrypted</p>
      </div>
    </div>
  )
}
