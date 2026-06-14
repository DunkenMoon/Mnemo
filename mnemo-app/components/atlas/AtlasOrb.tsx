"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Send, X, Volume2, VolumeX, MessageCircle, Sparkles } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  text: string
  timestamp: Date
}

interface Props {
  documentId?: string
  documentTitle?: string
}

export function AtlasOrb({ 
  documentId, 
  documentTitle 
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [micError, setMicError] = useState("")
  const [orbPulse, setOrbPulse] = useState(false)

  const recognizerRef = useRef<any>(null)
  const speakerRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Dynamically import voice engine (client only)
  useEffect(() => {
    if (typeof window === "undefined") return
    import("@/lib/atlas-voice").then(
      ({ AtlasSpeechRecognizer, AtlasSpeaker }) => {
        speakerRef.current = new AtlasSpeaker()
        recognizerRef.current = new AtlasSpeechRecognizer(
          // onResult
          (text) => {
            setInput(text)
            setIsListening(false)
            // Auto-send after voice input
            setTimeout(() => sendMessage(text), 300)
          },
          // onEnd
          () => setIsListening(false),
          // onError
          (err) => {
            setMicError(err)
            setIsListening(false)
            setTimeout(() => setMicError(""), 4000)
          }
        )
      }
    )
    return () => {
      speakerRef.current?.stop()
      recognizerRef.current?.stop()
    }
  }, [])

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome: Message = {
        id: "welcome",
        role: "assistant",
        text: documentTitle
          ? `Hey! I'm Atlas. I've loaded "${documentTitle}" — ask me anything about it, or say "quiz me" to get started.`
          : "Hey! I'm Atlas, your AI study companion. Upload a document and I'll help you master it. What can I help you with?",
        timestamp: new Date(),
      }
      setMessages([welcome])
      if (voiceEnabled) {
        setTimeout(() => {
          speakerRef.current?.speak(
            welcome.text,
            () => setIsSpeaking(true),
            () => setIsSpeaking(false)
          )
        }, 400)
      }
    }
  }, [isOpen])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim()
      if (!text || loading) return

      setInput("")
      setLoading(true)
      setMicError("")

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        text,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, userMsg])

      // Build history (exclude welcome msg)
      const history = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({ role: m.role, text: m.text }))

      try {
        const res = await fetch("/api/atlas/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            documentId,
            history,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(
            data.error ?? 
            `Server error ${res.status}`
          )
        }

        const reply = data.reply ?? 
          "I didn't catch that. Try again!"

        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: reply,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, assistantMsg])

        // Orb pulse on response
        setOrbPulse(true)
        setTimeout(() => setOrbPulse(false), 1000)

        // Speak response
        if (voiceEnabled) {
          speakerRef.current?.speak(
            reply,
            () => setIsSpeaking(true),
            () => setIsSpeaking(false)
          )
        }
      } catch (error) {
        const errMsg = String(error).includes("fetch")
          ? "Network error. Check your connection."
          : String(error).replace("Error: ", "")

        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            text: `Hmm, something went wrong: ${errMsg} Try again?`,
            timestamp: new Date(),
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [input, loading, messages, documentId, voiceEnabled]
  )

  const toggleMic = () => {
    if (!recognizerRef.current) return
    if (isListening) {
      recognizerRef.current.stop()
      setIsListening(false)
    } else {
      speakerRef.current?.stop()
      setIsSpeaking(false)
      recognizerRef.current.start()
      setIsListening(true)
    }
  }

  const toggleVoice = () => {
    if (isSpeaking) speakerRef.current?.stop()
    setVoiceEnabled(v => !v)
    setIsSpeaking(false)
  }

  return (
    <>
      {/* Floating Orb Button */}
      <motion.button
        onClick={() => setIsOpen(o => !o)}
        style={{
          position: "fixed",
          bottom: "24px", 
          right: "24px",
          zIndex: 9999,
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6C63FF, #00D4FF)",
          boxShadow: "0 0 25px rgba(108,99,255,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          border: "none",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={
          orbPulse || isSpeaking
            ? {
                boxShadow: [
                  "0 0 0px rgba(108,99,255,0.4)",
                  "0 0 30px rgba(108,99,255,0.8)",
                  "0 0 0px rgba(108,99,255,0.4)",
                ],
              }
            : {}
        }
        transition={{ duration: 0.8, repeat: isSpeaking ? Infinity : 0 }}
      >
        <motion.div
          animate={isListening ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          <Sparkles size={22} className="text-white" />
        </motion.div>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30 
            }}
            style={{
              position: "fixed",
              bottom: "96px",
              right: "24px", 
              zIndex: 9999,
              width: "380px",
              height: "520px",
            }}
            className="flex flex-col bg-[#0A0A1F]/95 backdrop-blur-xl border border-[#1E1E3F] rounded-2xl shadow-2xl shadow-[#6C63FF]/20 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between 
              px-4 py-3 border-b border-[#1E1E3F]
              bg-gradient-to-r from-[#6C63FF]/10 to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full 
                    bg-gradient-to-br from-[#6C63FF] to-[#00D4FF]
                    flex items-center justify-center">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  {/* Live indicator */}
                  <div className={`absolute -bottom-0.5 -right-0.5 
                    w-2.5 h-2.5 rounded-full border-2 border-[#0A0A1F]
                    ${isSpeaking ? "bg-[#6BCB77] animate-pulse" 
                      : isListening ? "bg-[#FF6B6B] animate-pulse"
                      : "bg-[#6C63FF]"
                    }`} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#F0F0FF]">Atlas</div>
                  <div className="text-xs text-[#8888AA]">AI Study Buddy</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSpeaking && (
                  <button
                    onClick={() => speakerRef.current?.stop()}
                    className="text-xs text-[#00D4FF] hover:text-[#00E4FF]"
                  >
                    stop ▪
                  </button>
                )}
                <button
                  onClick={toggleVoice}
                  className={voiceEnabled ? "text-[#6C63FF]" : "text-[#8888AA]"}
                  title={voiceEnabled ? "Voice on" : "Voice off"}
                >
                  {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#8888AA] hover:text-[#F0F0FF]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-[#6C63FF]/30 flex items-center justify-center text-xs mr-2 mt-1 flex-shrink-0">
                      A
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#6C63FF] text-white rounded-tr-sm"
                        : "bg-[#0F0F2E] text-[#F0F0FF] border border-[#1E1E3F] rounded-tl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full bg-[#6C63FF]/30 flex items-center justify-center text-xs mr-2 mt-1 flex-shrink-0">
                    A
                  </div>
                  <div className="bg-[#0F0F2E] border border-[#1E1E3F] px-4 py-3 rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-[#6C63FF] animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[#1E1E3F] flex gap-2 bg-[#0A0A1F]">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder={isListening ? "🎤 Listening..." : "Ask Atlas anything..."}
                className="flex-1 px-3 py-2 bg-[#0F0F2E] border border-[#1E1E3F] rounded-xl text-sm text-[#F0F0FF] placeholder-[#8888AA] focus:outline-none focus:border-[#6C63FF] transition-all"
              />
              <button
                onClick={toggleMic}
                className={`p-2 rounded-xl border transition-all ${
                  isListening
                    ? "border-red-500 text-red-400 bg-red-500/10 animate-pulse"
                    : "border-[#1E1E3F] text-[#8888AA] hover:text-[#A78BFA] hover:border-[#6C63FF]/50"
                }`}
                title="Voice input"
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="p-2 rounded-xl bg-[#6C63FF] text-white disabled:opacity-40 hover:bg-[#5B52E8] transition-all"
              >
                <Send size={16} />
              </button>
            </div>

            {/* Mic error toast */}
            <AnimatePresence>
              {micError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-20 left-4 right-4 p-3
                    bg-[#FF6B6B]/10 border border-[#FF6B6B]/30
                    rounded-xl text-xs text-[#FF6B6B]"
                >
                  {micError}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
