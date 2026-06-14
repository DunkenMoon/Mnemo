import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { documents, conceptNodes } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await auth.api.getSession({
    headers: req.headers,
  })
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  // 2. Validate env
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY not configured on server" },
      { status: 500 }
    )
  }

  // 3. Parse body safely
  let body: {
    message: string
    documentId?: string
    history?: { role: string; text: string }[]
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    )
  }

  const { message, documentId, history = [] } = body

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    )
  }

  // 4. Build document context if documentId provided
  let documentContext = ""
  if (documentId) {
    try {
      const [doc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId))

      if (doc && doc.userId === session.user.id) {
        const nodes = await db
          .select()
          .from(conceptNodes)
          .where(eq(conceptNodes.documentId, documentId))

        const conceptList = nodes
          .map(n => `- ${n.label}: ${n.explanation}`)
          .join("\n")

        documentContext = 
`CURRENT DOCUMENT: "${doc.title}"
SUBJECT: ${doc.subject ?? "General"}

KEY CONCEPTS FROM THIS DOCUMENT:
${conceptList || "No concepts extracted yet."}

FULL LECTURE TEXT (first 4000 chars):
${(doc.rawText ?? "").slice(0, 4000)}
`
      }
    } catch (e) {
      console.error("[ATLAS] Failed to fetch doc context:", e)
      // Non-fatal: continue without context
    }
  }

  // 5. Build Gemini conversation history
  const conversationHistory = history
    .slice(-10) // last 10 turns max
    .map(h => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.text }],
    }))

  // 6. System instruction
  const systemInstruction = `You are Atlas, an AI study 
companion built into Mnemo — a 3D knowledge learning app.

Your personality:
- Warm, encouraging, slightly witty — like a brilliant 
  senior friend who actually wants you to understand
- Direct and clear — no padding, no "Certainly!" or 
  "Great question!"
- Confident — never say "I cannot provide" or 
  "I don't have access". Work with what you have.
- When you don't know something, say "I'm not sure 
  about that, but here's what I think..." and reason it

Your capabilities:
- Explain any concept from the current document
- Quiz the user on what they've studied
- Give memory tips and study strategies
- Connect concepts to real-world examples
- Suggest what to study next based on weak areas

${documentContext ? `CONTEXT:\n${documentContext}` : 
  "No document selected. Answer general study questions."}

CRITICAL RULES:
- NEVER say "response cannot be provided"
- NEVER say "I don't have access to your documents"
- NEVER refuse a study-related question
- If asked something off-topic, redirect kindly:
  "I'm best at helping you study — want to quiz 
   on [topic] instead?"
- Keep responses under 120 words unless explaining 
  a complex concept
- Use simple formatting: no markdown headers, 
  minimal bullets
- End with a follow-up question when appropriate 
  to keep learning active`

  // 7. Call Gemini
  try {
    const geminiBody = {
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        ...conversationHistory,
        {
          role: "user",
          parts: [{ text: message.trim() }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
        topP: 0.9,
      },
    }

    const geminiRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 512
        }),
      }
    )

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error("[ATLAS GROQ ERROR]", 
        geminiRes.status, errText)
      return NextResponse.json(
        {
          error: `Groq API error: ${geminiRes.status}`,
          detail: errText,
        },
        { status: 502 }
      )
    }

    const geminiData = await geminiRes.json()
    const reply = geminiData.choices?.[0]?.message?.content?.trim()

    if (!reply) {
      return NextResponse.json(
        { reply: "I lost my train of thought. Ask me again!" }
      )
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("[ATLAS ROUTE ERROR]", error)
    return NextResponse.json(
      {
        reply: "I'm having a technical moment. Try again in a second!",
        error: String(error),
      },
      { status: 500 }
    )
  }
}
