"use client"

import { motion } from "framer-motion"
import { Flame, X } from "lucide-react"

interface QueueCard {
  id: string
  question: string
  nodeLabel?: string
  memoryStrength: number
  difficulty: number
}

interface Props {
  cards: QueueCard[]
  currentIndex: number
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function FlashcardQueuePanel({
  cards,
  currentIndex,
  mobileOpen = false,
  onMobileClose,
}: Props) {
  const weakCount = cards.filter((c) => c.memoryStrength < 0.3).length

  const panelContent = (
    <>
      {/* Header */}
      <div className="p-4 border-b border-[#1E1E3F]">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-[#8888AA] uppercase tracking-widest font-[Fira_Code]">
            Review Queue
          </p>
          {/* Mobile close button */}
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="lg:hidden text-[#8888AA] hover:text-[#F0F0FF] transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#F0F0FF] font-semibold font-[Space_Grotesk]">
            {Math.max(0, cards.length - currentIndex)} remaining
          </span>
          {weakCount > 0 && (
            <div className="flex items-center gap-1">
              <Flame size={14} className="text-[#FFD93D]" />
              <span className="text-xs text-[#FFD93D]">{weakCount} weak</span>
            </div>
          )}
        </div>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-[#050510] scrollbar-thumb-[#1E1E3F]">
        {cards.map((card, idx) => {
          const isPast = idx < currentIndex
          const isCurrent = idx === currentIndex
          const strengthColor =
            card.memoryStrength < 0.3
              ? "#FF6B6B"
              : card.memoryStrength < 0.6
                ? "#FFD93D"
                : "#6BCB77"

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{
                opacity: isPast ? 0.3 : 1,
                x: 0,
              }}
              className={`
                p-3 border-b border-[#1E1E3F]/50
                transition-all
                ${
                  isCurrent
                    ? "bg-[#6C63FF]/10 border-l-2 border-l-[#6C63FF]"
                    : "hover:bg-[#0F0F2E]"
                }
              `}
            >
              {/* Concept label */}
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: strengthColor }}
                />
                <p className="text-xs text-[#8888AA] font-[Fira_Code] truncate">
                  {card.nodeLabel || "Concept"}
                </p>
              </div>

              {/* Question preview */}
              <p
                className={`text-sm line-clamp-2 ${
                  isCurrent ? "text-[#F0F0FF]" : "text-[#8888AA]"
                }`}
              >
                {card.question}
              </p>

              {/* Difficulty dots */}
              <div className="flex gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: i < card.difficulty ? "#6C63FF" : "#1E1E3F",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>
    </>
  )

  return (
    <>
      {/* Desktop: fixed right panel */}
      <div className="hidden lg:flex fixed right-0 top-0 h-full w-64 bg-[#0A0A1F]/95 backdrop-blur-xl border-l border-[#1E1E3F] flex-col z-10 overflow-hidden">
        {panelContent}
      </div>

      {/* Mobile: bottom drawer */}
      {mobileOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="lg:hidden fixed inset-x-0 bottom-0 h-[60vh] bg-[#0A0A1F]/95 backdrop-blur-xl border-t border-[#1E1E3F] flex flex-col z-30 rounded-t-2xl overflow-hidden"
        >
          {panelContent}
        </motion.div>
      )}
    </>
  )
}
