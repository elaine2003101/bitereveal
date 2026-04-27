import { useEffect, useState } from 'react'
import { Flame, Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STREAK_KEY = 'bitereveal-streak-v1'

type StreakData = {
  dates: string[] // ISO date strings (YYYY-MM-DD), deduplicated
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const sorted = [...new Set(dates)].sort().reverse()
  const today = todayKey()

  // If most recent date is neither today nor yesterday, streak is broken
  const msPerDay = 86_400_000
  let streak = 0
  let cursor = today

  for (const date of sorted) {
    if (date === cursor) {
      streak++
      const prev = new Date(new Date(cursor).getTime() - msPerDay)
      cursor = prev.toISOString().slice(0, 10)
    } else {
      break
    }
  }
  return streak
}

export function StreakBadge() {
  const [streak, setStreak] = useState(0)
  const [scannedToday, setScannedToday] = useState(false)
  const [notifStatus, setNotifStatus] = useState<
    'idle' | 'granted' | 'denied' | 'unsupported'
  >('idle')

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STREAK_KEY)
      const data: StreakData = raw ? (JSON.parse(raw) as StreakData) : { dates: [] }
      setStreak(computeStreak(data.dates))
      setScannedToday(data.dates.includes(todayKey()))
    } catch {
      // ignore
    }

    if (!('Notification' in window)) {
      setNotifStatus('unsupported')
    } else if (Notification.permission === 'granted') {
      setNotifStatus('granted')
    } else if (Notification.permission === 'denied') {
      setNotifStatus('denied')
    }
  }, [])

  const requestNotifications = async () => {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setNotifStatus(result === 'granted' ? 'granted' : 'denied')
    if (result === 'granted') {
      new Notification('BiteReveal', {
        body: "You're all set! We'll nudge you to scan daily.",
        icon: '/favicon.ico',
      })
    }
  }

  const flameColor =
    streak >= 7
      ? 'text-rose-500'
      : streak >= 3
        ? 'text-amber-500'
        : 'text-slate-400'

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Streak pill */}
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold',
          streak >= 3
            ? 'border-amber-200 bg-amber-50 text-amber-800'
            : 'border-slate-200 bg-white text-slate-700',
        )}
      >
        <Flame className={cn('h-4 w-4', flameColor)} />
        {streak} day streak
      </div>

      {/* Today badge */}
      <div
        className={cn(
          'rounded-full border px-3 py-1.5 text-xs font-medium',
          scannedToday
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-dashed border-slate-300 text-slate-500',
        )}
      >
        {scannedToday ? 'Scanned today' : 'No scan today yet'}
      </div>

      {/* Notification toggle */}
      {notifStatus !== 'unsupported' && (
        <Button
          size="sm"
          variant="outline"
          className="rounded-full text-xs"
          onClick={requestNotifications}
          disabled={notifStatus === 'granted' || notifStatus === 'denied'}
        >
          {notifStatus === 'granted' ? (
            <><Bell className="h-3.5 w-3.5" /> Nudges on</>
          ) : notifStatus === 'denied' ? (
            <><BellOff className="h-3.5 w-3.5" /> Blocked</>
          ) : (
            <><Bell className="h-3.5 w-3.5" /> Enable daily nudge</>
          )}
        </Button>
      )}
    </div>
  )
}

/** Call this after a successful scan to record today's date. */
export function recordScanToday() {
  try {
    const raw = window.localStorage.getItem(STREAK_KEY)
    const data: StreakData = raw ? (JSON.parse(raw) as StreakData) : { dates: [] }
    const today = todayKey()
    if (!data.dates.includes(today)) {
      data.dates = [today, ...data.dates].slice(0, 90)
      window.localStorage.setItem(STREAK_KEY, JSON.stringify(data))
    }
  } catch {
    // ignore
  }
}
