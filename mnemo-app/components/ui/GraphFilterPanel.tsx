"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { SlidersHorizontal, X } from "lucide-react"

export interface FilterState {
  minMemory: number
  maxMemory: number
  minImportance: number
  showOrphans: boolean
  highlightWeak: boolean
}

export const DEFAULT_FILTERS: FilterState = {
  minMemory: 0,
  maxMemory: 1,
  minImportance: 1,
  showOrphans: true,
  highlightWeak: true,
}

interface Props {
  onFilterChange: (filters: FilterState) => void
}

export function GraphFilterPanel({ onFilterChange }: Props) {
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS })

  const update = (patch: Partial<FilterState>) => {
    const next = { ...filters, ...patch }
    setFilters(next)
    onFilterChange(next)
  }

  return (
    <div className="absolute bottom-6 left-6 z-20">
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#0A0A1F]/90 backdrop-blur-xl border border-[#1E1E3F] hover:border-[#6C63FF]/50 rounded-full text-sm text-[#8888AA] hover:text-[#F0F0FF] transition-all"
      >
        <SlidersHorizontal size={16} />
        Filters
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-12 left-0 w-72 bg-[#0A0A1F]/95 backdrop-blur-xl border border-[#1E1E3F] rounded-2xl p-5 shadow-2xl shadow-[#050510]/50"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-[#F0F0FF] font-[Space_Grotesk]">
                Graph Filters
              </p>
              <button
                onClick={() => setOpen(false)}
                className="text-[#8888AA] hover:text-[#F0F0FF]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Memory Strength Range */}
            <div className="mb-5">
              <div className="flex justify-between mb-2">
                <label className="text-xs text-[#8888AA] font-[Fira_Code] uppercase tracking-wider">
                  Memory Strength
                </label>
                <span className="text-xs text-[#A78BFA] font-[Fira_Code]">
                  {Math.round(filters.minMemory * 100)}% –{" "}
                  {Math.round(filters.maxMemory * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={filters.minMemory * 100}
                onChange={(e) =>
                  update({ minMemory: +e.target.value / 100 })
                }
                className="w-full accent-[#6C63FF] bg-[#1E1E3F] rounded-full h-1"
              />
            </div>

            {/* Min Importance */}
            <div className="mb-5">
              <div className="flex justify-between mb-2">
                <label className="text-xs text-[#8888AA] font-[Fira_Code] uppercase tracking-wider">
                  Min Importance
                </label>
                <span className="text-xs text-[#A78BFA] font-[Fira_Code]">
                  {filters.minImportance}/10
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={filters.minImportance}
                onChange={(e) =>
                  update({ minImportance: +e.target.value })
                }
                className="w-full accent-[#6C63FF] bg-[#1E1E3F] rounded-full h-1"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              {[
                { key: "showOrphans" as const, label: "Show isolated nodes" },
                { key: "highlightWeak" as const, label: "Highlight weak memory" },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="text-sm text-[#8888AA]">{label}</span>
                  <div
                    onClick={() => update({ [key]: !filters[key] })}
                    className={`w-10 h-5 rounded-full transition-all relative ${
                      filters[key] ? "bg-[#6C63FF]" : "bg-[#1E1E3F]"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                        filters[key] ? "left-5" : "left-0.5"
                      }`}
                    />
                  </div>
                </label>
              ))}
            </div>

            {/* Reset */}
            <button
              onClick={() => {
                const defaults = { ...DEFAULT_FILTERS }
                setFilters(defaults)
                onFilterChange(defaults)
              }}
              className="w-full mt-4 py-2 text-xs text-[#8888AA] hover:text-[#F0F0FF] border border-[#1E1E3F] rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
