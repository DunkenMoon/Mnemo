"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Target, Zap } from "lucide-react"

const DAILY_GOAL = 20

export function DailyGoalWidget() {
  const [todayCount, setTodayCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/progress/today")
      .then((r) => r.json())
      .then((d) => {
        setTodayCount(d.cardsToday ?? 0)
        setStreak(d.streak ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ADDITION 3: Loading skeleton
  if (loading) {
    return (
      <div className="bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-5 mb-6 animate-pulse">
        <div className="h-4 w-32 bg-[#1E1E3F] rounded mb-4" />
        <div className="h-2 w-full bg-[#1E1E3F] rounded-full mb-3" />
        <div className="h-3 w-24 bg-[#1E1E3F] rounded" />
      </div>
    )
  }

  const pct = Math.min(100, (todayCount / DAILY_GOAL) * 100)
  const done = todayCount >= DAILY_GOAL

  return (
    <div className="bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-[#6C63FF]" />
          <span className="text-sm font-semibold text-[#F0F0FF] font-[Space_Grotesk]">
            Daily Goal
          </span>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD93D]/10 border border-[#FFD93D]/20">
            <Zap size={12} className="text-[#FFD93D]" />
            <span className="text-xs font-bold text-[#FFD93D]">
              {streak} day streak
            </span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-[#1E1E3F] rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{
            background: done
              ? "linear-gradient(90deg, #6BCB77, #00D4FF)"
              : "linear-gradient(90deg, #6C63FF, #A78BFA)",
          }}
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-[#8888AA]">
          {todayCount} / {DAILY_GOAL} cards today
        </span>
        {done ? (
          <span className="text-xs font-medium text-[#6BCB77]">
            ✓ Goal complete!
          </span>
        ) : (
          <span className="text-xs text-[#8888AA]">
            {DAILY_GOAL - todayCount} to go
          </span>
        )}
      </div>
    </div>
  )
}
