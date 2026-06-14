"use client"

// ─── SPEECH RECOGNITION (Voice Input)
export class AtlasSpeechRecognizer {
  private recognition: SpeechRecognition | null = null
  private isListening = false

  constructor(
    private onResult: (text: string) => void,
    private onEnd: () => void,
    private onError: (err: string) => void
  ) {
    const SpeechRecognition =
      window.SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      this.onError(
        "Speech recognition not supported. " +
        "Use Chrome or Edge."
      )
      return
    }

    this.recognition = new SpeechRecognition()
    this.recognition.continuous = false
    this.recognition.interimResults = false
    this.recognition.lang = "en-US"
    this.recognition.maxAlternatives = 1

    this.recognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript.trim()
      if (transcript) this.onResult(transcript)
    }

    this.recognition.onend = () => {
      this.isListening = false
      this.onEnd()
    }

    this.recognition.onerror = (event) => {
      this.isListening = false
      if (event.error === "not-allowed") {
        this.onError(
          "Microphone access denied. " +
          "Allow mic in browser settings."
        )
      } else if (event.error === "no-speech") {
        this.onError("No speech detected. Try again.")
      } else {
        this.onError(`Recognition error: ${event.error}`)
      }
      this.onEnd()
    }
  }

  start() {
    if (!this.recognition || this.isListening) return
    try {
      this.recognition.start()
      this.isListening = true
    } catch (e) {
      console.error("[RECOGNIZER]", e)
    }
  }

  stop() {
    if (!this.recognition || !this.isListening) return
    try {
      this.recognition.stop()
    } catch (e) {
      console.error("[RECOGNIZER STOP]", e)
    }
  }

  get active() {
    return this.isListening
  }
}

// ─── SPEECH SYNTHESIS (Voice Output — Human TTS)
export class AtlasSpeaker {
  private utterance: SpeechSynthesisUtterance | null = null
  private isSpeaking = false
  private preferredVoice: SpeechSynthesisVoice | null = null

  constructor() {
    // Load voices (async in Chrome)
    if (typeof window !== "undefined") {
      const loadVoice = () => {
        const voices = speechSynthesis.getVoices()
        // Priority order: most human-sounding English voices
        const preferred = [
          "Google US English",
          "Google UK English Female",
          "Microsoft Aria Online (Natural) - English (United States)",
          "Microsoft Jenny Online (Natural) - English (United States)",
          "Karen",    // macOS
          "Samantha", // macOS
          "Daniel",   // macOS UK
        ]
        for (const name of preferred) {
          const found = voices.find(v => v.name === name)
          if (found) {
            this.preferredVoice = found
            break
          }
        }
        // Fallback: first English voice
        if (!this.preferredVoice) {
          this.preferredVoice =
            voices.find(v => v.lang.startsWith("en")) ??
            voices[0] ?? null
        }
      }
      loadVoice()
      speechSynthesis.onvoiceschanged = loadVoice
    }
  }

  speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ) {
    if (typeof window === "undefined") return
    // Cancel any current speech
    speechSynthesis.cancel()

    // Strip markdown for cleaner TTS
    const cleaned = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/\n\n/g, ". ")
      .replace(/\n/g, " ")
      .trim()

    this.utterance = new SpeechSynthesisUtterance(cleaned)

    if (this.preferredVoice) {
      this.utterance.voice = this.preferredVoice
    }

    // Jarvis-like voice settings
    this.utterance.rate = 1.0   // natural pace
    this.utterance.pitch = 1.0  // natural pitch
    this.utterance.volume = 1.0

    this.utterance.onstart = () => {
      this.isSpeaking = true
      onStart?.()
    }

    this.utterance.onend = () => {
      this.isSpeaking = false
      onEnd?.()
    }

    this.utterance.onerror = (e) => {
      this.isSpeaking = false
      console.error("[TTS ERROR]", e)
      onEnd?.()
    }

    speechSynthesis.speak(this.utterance)
  }

  stop() {
    speechSynthesis.cancel()
    this.isSpeaking = false
  }

  get speaking() {
    return this.isSpeaking
  }
}
