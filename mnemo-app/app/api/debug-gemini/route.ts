import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY?.replace(/^["']|["']$/g, "")
  
  if (!apiKey) return NextResponse.json({ error: "No API key" })

  try {
    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 10
        })
      }
    )
    const data = await res.json()
    return NextResponse.json({ status: res.status, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message })
  }
}
