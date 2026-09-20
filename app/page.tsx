'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Bell, ChevronRight, FileText, Grid2X2, Home, MoreHorizontal, QrCode, Search, Send, ShieldCheck, Smartphone, Users, WalletCards, X } from 'lucide-react'
import { checkBlacklist, isCommunityPaused, PAUSE_THRESHOLD, reportScam, watchRecipient } from '@/lib/blacklist'
import { demoUser, scoreTransaction } from '@/components/RiskEngine'

type Screen = 'home' | 'payment' | 'review'
type Status = 'silent' | 'nudge' | 'pause'
type BlacklistEntry = { id?: string; reportCount?: number; recipientId?: string; reason?: string } | null

const quickActions = [
  { label: 'Scan QR', icon: QrCode },
  { label: 'Pay contacts', icon: Users },
  { label: 'Phone number', icon: Smartphone },
  { label: 'Bank transfer', icon: Send },
  { label: 'Self transfer', icon: WalletCards },
  { label: 'Pay bills', icon: FileText },
  { label: 'Recharge', icon: Smartphone },
  { label: 'More', icon: Grid2X2 },
]

export default function Page() {
  const [screen, setScreen] = useState<Screen>('home')
  const [upiId, setUpiId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isReporting, setIsReporting] = useState(false)
  const [status, setStatus] = useState<Status>('silent')
  const [blacklistEntry, setBlacklistEntry] = useState<BlacklistEntry>(null)
  const [feedback, setFeedback] = useState('')
  const paymentStartedAt = useRef(Date.now())

  useEffect(() => {
    if (!upiId.trim()) return

    return watchRecipient(upiId, (entry: BlacklistEntry) => {
      setBlacklistEntry(entry)
      if (entry && isCommunityPaused(entry)) {
        setStatus('pause')
      } else if (status === 'pause') {
        setStatus('silent')
      }
    })
  }, [upiId])

  function selectRecipient(value = '') {
    paymentStartedAt.current = Date.now()
    setUpiId(value)
    setAmount('')
    setNote('')
    setStatus('silent')
    setBlacklistEntry(null)
    setFeedback('')
    setScreen('payment')
  }

  function handleKey(value: string) {
    setAmount((current) => value === 'backspace' ? current.slice(0, -1) : `${current}${value}`.slice(0, 8))
  }

  async function handleProceed(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedUpiId = upiId.trim()
    const trimmedAmount = amount.trim()

    if (!trimmedUpiId) {
      setFeedback('Please enter a UPI ID')
      return
    }

    if (!trimmedUpiId.includes('@') || trimmedUpiId.startsWith('@') || trimmedUpiId.endsWith('@')) {
      setFeedback('Please enter a valid UPI ID')
      return
    }

    const numericAmount = Number(trimmedAmount)
    if (!trimmedAmount || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFeedback('Please enter a valid amount')
      return
    }

    setFeedback('')
    setIsChecking(true)
    try {
      const entry = await checkBlacklist(trimmedUpiId)
      const riskResult = scoreTransaction(demoUser, {
        recipient: trimmedUpiId,
        amount: Number(trimmedAmount),
        note,
        elapsedSeconds: (Date.now() - paymentStartedAt.current) / 1000,
      })
      setBlacklistEntry(entry)
      setStatus(isCommunityPaused(entry) ? 'pause' : riskResult.tier)
      setScreen('review')
    } catch (error) {
      console.error('[v0] Scam blacklist check failed:', error)
      setFeedback('The safety check could not be completed. Please try again.')
    } finally {
      setIsChecking(false)
    }
  }

  async function handleReportScam() {
    if (!upiId.trim() || isReporting) return
    setIsReporting(true)
    try {
      await reportScam(upiId)
      setFeedback('Reported to Scam Radar')
    } catch (error) {
      console.error('[v0] Scam report failed:', error)
      setFeedback('The scam report could not be submitted. Please try again.')
    } finally {
      setIsReporting(false)
    }
  }

  const formattedAmount = Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
  const recipientName = upiId ? upiId.split('@')[0].replace(/[._-]/g, ' ') : 'New recipient'
  const displayName = recipientName.replace(/\b\w/g, (letter) => letter.toUpperCase())

  return (
    <main className="min-h-screen bg-[#edf3f8] px-4 py-6 text-[#132238] sm:px-8 lg:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center">
        <div className="w-full max-w-[410px] rounded-[3rem] bg-[#12263b] p-2.5 shadow-[0_24px_70px_rgba(20,45,70,0.22)] ring-1 ring-white/70">
          <section className="relative flex min-h-[720px] flex-col overflow-hidden rounded-[2.45rem] bg-[#f8fbfd]">
            <div className="absolute left-1/2 top-0 z-20 h-7 w-32 -translate-x-1/2 rounded-b-2xl bg-[#12263b]" />
            <div className="flex items-center justify-between px-7 pb-2 pt-4 text-[11px] font-semibold text-[#1e3349]">
              <span>9:41</span><span className="flex items-center gap-1.5"><span>5G</span><span className="h-2.5 w-4 rounded-sm border border-[#1e3349]" /></span>
            </div>

            <div className="flex flex-1 flex-col px-6 pb-6 pt-4">
              {screen === 'home' && <HomeScreen onSelect={selectRecipient} />}
              {screen === 'payment' && <PaymentScreen upiId={upiId} displayName={displayName} amount={amount} note={note} setAmount={setAmount} setNote={setNote} onBack={() => setScreen('home')} onKey={handleKey} onProceed={handleProceed} isChecking={isChecking} feedback={feedback} />}
              {screen === 'review' && <ReviewScreen upiId={upiId} displayName={displayName} amount={formattedAmount} note={note} status={status} blacklistEntry={blacklistEntry} feedback={feedback} onBack={() => setScreen('payment')} onReport={handleReportScam} isReporting={isReporting} onPay={() => setFeedback('Payment ready for confirmation in your banking app.')} />}
            </div>
            <nav className="grid grid-cols-3 border-t border-[#e6edf2] bg-white/90 px-5 py-3 text-center text-[10px] font-semibold text-[#8a9aaa]">
              <button type="button" onClick={() => setScreen('home')} className={screen === 'home' ? 'text-[#1769d1]' : ''}><Home className="mx-auto mb-1 size-4" />Home</button>
              <button type="button" onClick={() => selectRecipient()} className={screen !== 'home' ? 'text-[#1769d1]' : ''}><Send className="mx-auto mb-1 size-4" />Pay</button>
              <button type="button"><FileText className="mx-auto mb-1 size-4" />Activity</button>
            </nav>
            <div className="absolute bottom-1 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-[#bfcbd5]" aria-hidden="true" />
          </section>
        </div>
      </div>
    </main>
  )
}

function HomeScreen({ onSelect }: { onSelect: (value?: string) => void }) {
  const [search, setSearch] = useState('')
  return <>
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-2xl bg-[#1769d1] text-xs font-black text-white shadow-lg shadow-[#1769d1]/20">SN</span><div><p className="text-sm font-bold tracking-tight text-[#16304b]">SPI-Nudge</p><p className="text-[10px] text-[#8091a1]">Safer payments together</p></div></div>
      <button type="button" aria-label="Notifications" className="rounded-full bg-white p-2.5 text-[#526a80] shadow-sm"><Bell className="size-4" /></button>
    </header>
    <div className="mt-8"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8596a5]">Good morning</p><h1 className="mt-1 text-[27px] font-semibold tracking-[-0.04em] text-[#142e4a]">Who would you like to pay?</h1></div>
    <button type="button" onClick={() => onSelect(search)} className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-[#e1eaf1] bg-white px-4 py-3.5 text-left shadow-sm"><Search className="size-4 text-[#1769d1]" /><input value={search} onChange={(event) => setSearch(event.target.value)} onClick={(event) => event.stopPropagation()} placeholder="Name, phone number or UPI ID" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#9aabb8]" /><ChevronRight className="size-4 text-[#a1afba]" /></button>
    <div className="mt-6 grid grid-cols-4 gap-y-5">{quickActions.map(({ label, icon: Icon }) => <button type="button" key={label} onClick={() => label === 'Pay contacts' ? onSelect() : undefined} className="text-center text-[10px] font-medium text-[#526a80]"><span className="mx-auto mb-2 flex size-11 items-center justify-center rounded-2xl bg-white text-[#1769d1] shadow-sm"><Icon className="size-5" /></span>{label}</button>)}</div>
    <div className="mt-7 rounded-2xl bg-[#e8f2ff] p-4"><div className="flex items-start gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-white text-[#1769d1]"><ShieldCheck className="size-5" /></span><div><p className="text-xs font-bold text-[#17467d]">Safer way to pay</p><p className="mt-1 text-[11px] leading-4 text-[#527398]">Community-powered scam detection for every UPI payment.</p></div></div></div>
    <div className="mt-7 flex items-center justify-between"><p className="text-xs font-bold text-[#29445e]">Recent people</p><button type="button" className="text-[11px] font-semibold text-[#1769d1]">See all</button></div>
    <button type="button" onClick={() => onSelect('ananya@upi')} className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-sm"><span className="flex size-10 items-center justify-center rounded-full bg-[#ffe8d8] text-xs font-bold text-[#a95021]">A</span><span className="flex-1"><span className="block text-xs font-bold text-[#29445e]">Ananya Mehta</span><span className="mt-0.5 block text-[10px] text-[#8b9aa7]">ananya@upi</span></span><ChevronRight className="size-4 text-[#a1afba]" /></button>
  </>
}

function PaymentScreen({ upiId, displayName, amount, note, setAmount, setNote, onBack, onKey, onProceed, isChecking, feedback }: { upiId: string; displayName: string; amount: string; note: string; setAmount: (v: string) => void; setNote: (v: string) => void; onBack: () => void; onKey: (v: string) => void; onProceed: (e: React.FormEvent<HTMLFormElement>) => void; isChecking: boolean; feedback: string }) {
  return <><header className="flex items-center justify-between"><button type="button" onClick={onBack} aria-label="Back" className="rounded-full bg-white p-2 text-[#526a80] shadow-sm"><ArrowLeft className="size-4" /></button><p className="text-sm font-bold text-[#29445e]">Pay securely</p><button type="button" aria-label="More options" className="rounded-full p-2 text-[#526a80]"><MoreHorizontal className="size-5" /></button></header><div className="mt-7 flex items-center gap-3"><span className="flex size-12 items-center justify-center rounded-full bg-[#dcecff] text-sm font-bold text-[#1769d1]">{upiId ? upiId[0].toUpperCase() : '?'}</span><div><p className="text-sm font-bold text-[#213b57]">{upiId ? displayName : 'New recipient'}</p><p className="text-[11px] text-[#8091a1]">{upiId || 'UPI recipient'}</p></div></div><form onSubmit={onProceed} className="flex flex-1 flex-col"><div className="py-9 text-center"><p className="text-[11px] font-semibold text-[#8a9aaa]">Enter amount</p><div className="mt-2 flex items-center justify-center text-5xl font-semibold tracking-[-0.06em] text-[#16304b]"><span className="mr-1 text-3xl">₹</span><span>{amount || '0'}</span></div><input value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" aria-label="Amount" className="sr-only" /></div><div className="rounded-2xl border border-[#e1eaf1] bg-white px-4 py-3"><label htmlFor="note" className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a9aaa]">Add a note</label><input id="note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="What is this for?" className="mt-1 w-full bg-transparent text-xs outline-none placeholder:text-[#aab7c1]" /></div><div className="mt-auto grid grid-cols-3 gap-2.5 pt-6">{['1','2','3','4','5','6','7','8','9','.','0','backspace'].map((key) => <button type="button" key={key} onClick={() => onKey(key)} className="h-11 rounded-xl bg-white text-base font-semibold text-[#29445e] shadow-sm transition hover:bg-[#eef5ff]">{key === 'backspace' ? '⌫' : key}</button>)}</div>{feedback && <p role="alert" className="mt-3 text-center text-[11px] font-semibold text-[#b4533c]">{feedback}</p>}<button type="submit" disabled={isChecking} className="mt-4 h-13 rounded-2xl bg-[#1769d1] text-sm font-bold text-white shadow-lg shadow-[#1769d1]/20 disabled:opacity-60">{isChecking ? 'Checking recipient...' : 'Proceed to pay'}<ChevronRight className="ml-1 inline size-4" /></button></form></>
}

function ReviewScreen({ upiId, displayName, amount, note, status, blacklistEntry, feedback, onBack, onReport, isReporting, onPay }: { upiId: string; displayName: string; amount: string; note: string; status: Status; blacklistEntry: BlacklistEntry; feedback: string; onBack: () => void; onReport: () => void; isReporting: boolean; onPay: () => void }) {
  const reportCount = Number(blacklistEntry?.reportCount || 0)
  const paused = reportCount >= PAUSE_THRESHOLD || status === 'pause'
  return <><header className="flex items-center justify-between"><button type="button" onClick={onBack} aria-label="Back" className="rounded-full bg-white p-2 text-[#526a80] shadow-sm"><ArrowLeft className="size-4" /></button><p className="text-sm font-bold text-[#29445e]">Review payment</p><button type="button" aria-label="Close" className="rounded-full p-2 text-[#526a80]"><X className="size-4" /></button></header><div className="mt-7 text-center"><span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#dcecff] text-lg font-bold text-[#1769d1]">{upiId[0]?.toUpperCase()}</span><p className="mt-3 text-sm font-bold text-[#213b57]">{displayName}</p><p className="mt-1 text-[11px] text-[#8091a1]">{upiId}</p><p className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[#16304b]">₹{amount}</p>{note && <p className="mt-1 text-[11px] text-[#8091a1]">For: {note}</p>}</div><div className={`mt-7 rounded-2xl border p-4 ${paused ? 'border-[#f5c9c1] bg-[#fff3f0]' : 'border-[#bfe8d8] bg-[#effaf5]'}`}><div className="flex items-start gap-3"><span className={`flex size-9 items-center justify-center rounded-xl ${paused ? 'bg-[#ffe0da] text-[#c2412d]' : 'bg-white text-[#11805d]'}`}>{paused ? '!' : '✓'}</span><div><p className={`text-xs font-bold ${paused ? 'text-[#b63d2c]' : 'text-[#14785b]'}`}>{paused ? 'Payment paused' : reportCount === 2 ? '2 community reports' : reportCount === 1 ? '1 community report' : 'Recipient checked'}</p><p className={`mt-1 text-[11px] leading-4 ${paused ? 'text-[#a85649]' : 'text-[#4d806e]'}`}>{paused ? `This recipient has been reported by the community · ${reportCount} community report${reportCount === 1 ? '' : 's'}. Do not continue with this payment.` : reportCount === 2 ? 'Multiple users have reported this recipient. Please verify before paying.' : reportCount === 1 ? 'This recipient has been reported once. Continue with caution.' : 'No reports found in the community.'}</p></div></div></div>{feedback && <p role="status" className="mt-3 text-center text-[11px] font-semibold text-[#14785b]">{feedback}</p>}<div className="mt-auto pt-6"><button type="button" onClick={onReport} disabled={isReporting} className="mb-4 block w-full text-center text-xs font-semibold text-[#b63d2c] underline underline-offset-4 disabled:opacity-60">{isReporting ? 'Reporting...' : 'Report as Scam'}</button><button type="button" onClick={onPay} disabled={paused} className="h-13 w-full rounded-2xl bg-[#1769d1] text-sm font-bold text-white shadow-lg shadow-[#1769d1]/20 disabled:cursor-not-allowed disabled:bg-[#c7d2dd]">{paused ? 'Payment paused' : `Pay ₹${amount}`}<ChevronRight className="ml-1 inline size-4" /></button></div></>
}
