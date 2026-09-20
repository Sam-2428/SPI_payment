"use client"

interface NudgeModalProps {
  tier: "silent" | "nudge" | "pause"
  signals: string[]
  recipient: string
  amount: number
  reframedAmount?: string
  onCancel: () => void
  onProceed: () => void
}

export function NudgeModal({
  tier,
  signals,
  recipient,
  amount,
  reframedAmount,
  onCancel,
  onProceed,
}: NudgeModalProps) {
  if (tier === "silent") return null

  if (tier === "nudge") {
    return (
      <div className="mx-4 mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <p className="text-sm text-amber-800">
          {signals[0] || "Quick check before you continue."}
        </p>
      </div>
    )
  }

  // tier === "pause"
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-sm rounded-t-3xl bg-slate-900 p-6 sm:rounded-3xl">
        <p className="text-sm font-bold tracking-wide text-teal-400">NUDGE</p>
        <h2 className="mt-1 text-xl font-bold text-white">Let's double check this</h2>
        <p className="mt-2 text-sm text-gray-400">
          This payment looks unusual for a few reasons.
        </p>

        <div className="mt-4 space-y-1 rounded-lg bg-slate-800 p-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Sending to</span>
            <span className="text-white">{recipient}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Amount</span>
            <span className="text-white">₹{amount}</span>
          </div>
        </div>

        {reframedAmount && (
          <p className="mt-3 text-xs text-gray-400">{reframedAmount}</p>
        )}

        <ul className="mt-4 space-y-1.5">
          {signals.map((signal, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-300">
              <span className="text-teal-400">•</span>
              <span>{signal}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onCancel}
          className="mt-5 w-full rounded-full bg-teal-400 py-3 font-bold text-slate-900 transition-colors hover:bg-teal-300"
        >
          Cancel
        </button>
        <button
          onClick={onProceed}
          className="mt-2 w-full rounded-full border border-gray-600 py-3 text-gray-300 transition-colors hover:bg-slate-800"
        >
          Proceed
        </button>
      </div>
    </div>
  )
}