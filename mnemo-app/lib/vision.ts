export async function extractTextFromImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY not configured")
  }

  const validMimes: Record<string, string> = {
    "image/jpeg": "image/jpeg",
    "image/jpg":  "image/jpeg",
    "image/png":  "image/png",
    "image/webp": "image/webp",
    "image/gif":  "image/gif",
  }
  const safeMime = validMimes[mimeType] ?? "image/jpeg"
  const base64Data = imageBuffer.toString("base64")

  if (base64Data.length > 4_500_000) {
    throw new Error(
      "Image too large. Please use an image under 3MB."
    )
  }

  const ocrPrompt = `You are an advanced OCR system. Extract ALL text from this image with high accuracy.

EXTRACTION RULES:
1. Handwritten text: Transcribe exactly as written. Preserve line breaks and structure.
2. Printed text: Extract every word exactly.
3. Mixed content (text + diagrams): Extract all text first, then describe diagram structure briefly.
4. Mathematical notation: Write as plain text e.g. "x squared" or "x^2".
5. Tables: Preserve table structure using | separators
6. Headers and bullets: Keep the hierarchy visible

CRITICAL: Output ONLY the extracted content. Do NOT add commentary.`

  const requestBody = {
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: ocrPrompt,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${safeMime};base64,${base64Data}`,
            },
          },
        ],
      },
    ],
    max_tokens: 4096,
  }

  let response: Response
  try {
    response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      }
    )
  } catch (networkError) {
    throw new Error(
      `Network error: ${networkError}. Check your internet connection.`
    )
  }

  if (!response.ok) {
    const body = await response.text()
    console.error("[VISION]", response.status, body.slice(0, 300))
    if (response.status === 400) {
      throw new Error(
        "Image format not supported. Use JPG, PNG, or WebP. Max size: 3MB."
      )
    }
    if (response.status === 401) {
      throw new Error(
        "Groq API key invalid. Check GROQ_API_KEY in .env.local"
      )
    }
    if (response.status === 429) {
      throw new Error(
        "Too many requests. Wait 60 seconds and retry."
      )
    }
    throw new Error(
      `Vision API error ${response.status}. ${body.slice(0, 200)}`
    )
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content?.trim() ?? ""

  if (!text || text.length < 5) {
    throw new Error(
      "No text found in image. Ensure the image contains visible text."
    )
  }

  console.log(`[VISION] Extracted ${text.length} chars from image`)
  return text
}
