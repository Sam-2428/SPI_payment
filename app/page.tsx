"use client"

import { UpiPaymentScreen, type PaymentData } from "@/components/upi-payment-screen"

export default function Page() {
  const handlePaymentSubmit = (data: PaymentData) => {
    // Parent receives the bundled payment object here.
    console.log("[v0] Parent received payment:", data)
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <UpiPaymentScreen
        recipientName="Aarav Sharma"
        recipientPhone="+91 98765 43210"
        onPaymentSubmit={handlePaymentSubmit}
      />
    </main>
  )
}
