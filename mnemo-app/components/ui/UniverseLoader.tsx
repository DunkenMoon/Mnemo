"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

const MESSAGES = [
  "Mapping neural pathways...",
  "Calibrating memory vectors...",
  "Positioning concept nodes in space...",
  "Calculating gravitational relationships...",
  "Charging energy beams...",
  "Universe assembling...",
]

const NODE_COUNT = 8

export function UniverseLoader() {
  const [msgIndex, setMsgIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [stars, setStars] = useState<{ left: string; top: string; duration: number; delay: number }[]>([])

  useEffect(() => {
    setStars(
      Array.from({ length: 80 }).map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 3,
      }))
    )

    const msgInterval = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length)
    }, 1200)

    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 
        Math.random() * 8, 95))
    }, 300)

    return () => {
      clearInterval(msgInterval)
      clearInterval(progressInterval)
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-[#050510] 
      flex flex-col items-center justify-center 
      z-50 overflow-hidden">

      {/* Background star dots */}
      <div className="absolute inset-0">
        {stars.map((star, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 
              rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Orbital system */}
      <div className="relative w-48 h-48 mb-10">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: "1px solid rgba(108,99,255,0.2)",
          }}
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />

        {/* Middle ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            inset: "20px",
            border: "1px solid rgba(0,212,255,0.25)",
          }}
          animate={{ rotate: -360 }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />

        {/* Inner ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            inset: "40px",
            border: "1px solid rgba(167,139,250,0.3)",
          }}
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />

        {/* Orbiting nodes */}
        {Array.from({ length: NODE_COUNT }).map(
          (_, i) => {
            const angle = (i / NODE_COUNT) * Math.PI * 2
            const orbitRadius = i % 3 === 0 
              ? 90 
              : i % 3 === 1 
              ? 64 
              : 38
            const colors = [
              "#FF6B6B",
              "#FFD93D", 
              "#6BCB77",
              "#6C63FF",
              "#00D4FF",
              "#A78BFA",
              "#6BCB77",
              "#FFD93D",
            ]
            const color = colors[i]
            const duration = 3 + (i % 3) * 2

            return (
              <motion.div
                key={i}
                className="absolute w-3 h-3 
                  rounded-full"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 8px ${color}, 0 0 16px ${color}60`,
                  left: "50%",
                  top: "50%",
                  marginLeft: "-6px",
                  marginTop: "-6px",
                }}
                animate={{
                  x: [
                    Math.cos(angle) * orbitRadius,
                    Math.cos(angle + Math.PI * 2) 
                      * orbitRadius,
                  ],
                  y: [
                    Math.sin(angle) * orbitRadius,
                    Math.sin(angle + Math.PI * 2) 
                      * orbitRadius,
                  ],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  x: { 
                    duration, 
                    repeat: Infinity, 
                    ease: "linear" 
                  },
                  y: { 
                    duration, 
                    repeat: Infinity, 
                    ease: "linear" 
                  },
                  scale: {
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }
                }}
              />
            )
          }
        )}

        {/* Center core */}
        <div className="absolute inset-0 
          flex items-center justify-center">
          <motion.div
            className="w-6 h-6 rounded-full"
            style={{
              background: "radial-gradient(circle, #A78BFA, #6C63FF)",
              boxShadow: "0 0 20px #6C63FF, 0 0 40px #6C63FF60",
            }}
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>

      {/* Loading message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={msgIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-[#8888AA] text-sm 
            font-mono tracking-wide mb-6"
        >
          {MESSAGES[msgIndex]}
        </motion.p>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="w-64 h-0.5 
        bg-[#1E1E3F] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #6C63FF, #00D4FF)",
            boxShadow: "0 0 8px #6C63FF",
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      <p className="text-[#1E1E3F] text-xs mt-3 
        font-mono">
        {Math.round(progress)}%
      </p>
    </div>
  )
}
