import { GoogleGenerativeAI } from "@google/generative-ai";

export async function extractTextFromImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY not configured")
  }

  const base64 = imageBuffer.toString("base64")

  const ocrPrompt = `Extract ALL text from this handwritten note or image exactly as written. Preserve structure and headings. If it is a diagram, describe each component and its relationships in detail. Return only the extracted text content. No explanations.`

  const res = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
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
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
      }),
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Groq API error ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim() ?? ""

  if (!text || text.length < 10) {
    throw new Error(
      "No text found in image. Please ensure the image is clear."
    );
  }
  return text.substring(0, 15000);
}
