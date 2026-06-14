import { Innertube } from "youtubei.js"

export function extractVideoId(url: string): 
  string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
    /(?:youtu\.be\/)([^?\s]+)/,
    /(?:youtube\.com\/embed\/)([^?\s]+)/,
    /(?:youtube\.com\/shorts\/)([^?\s]+)/,
    /(?:youtube\.com\/live\/)([^?\s]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m?.[1]) return m[1]
  }
  return null
}

export async function extractYouTubeTranscript(
  url: string
): Promise<string> {
  const videoId = extractVideoId(url)
  if (!videoId) {
    throw new Error(
      "Invalid YouTube URL. Supported formats: " +
      "youtube.com/watch?v=ID, youtu.be/ID, " +
      "youtube.com/shorts/ID"
    )
  }

  // Method 1: youtubei.js (most reliable)
  try {
    const yt = await Innertube.create({
      retrieve_player: false,
    })
    const info = await yt.getInfo(videoId)
    const transcriptData = await info.getTranscript()
    
    const segments = transcriptData
      ?.transcript
      ?.content
      ?.body
      ?.initial_segments

    if (segments && segments.length > 0) {
      const text = segments
        .map((s: any) => 
          s.snippet?.text ?? 
          s.snippet?.runs?.[0]?.text ?? ""
        )
        .filter(Boolean)
        .join(" ")
        .trim()

      if (text.length > 100) {
        console.log(
          `[YOUTUBE] Extracted ${text.length} chars ` +
          `via youtubei.js for ${videoId}` 
        )
        return text
      }
    }
    throw new Error("Empty transcript from youtubei.js")
  } catch (e) {
    console.warn("[YOUTUBE Method 1 failed]", 
      String(e).slice(0, 200))
  }

  // Method 2: Direct timedtext API fallback
  try {
    const pageRes = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }
    )

    if (!pageRes.ok) {
      throw new Error(`YouTube page fetch failed: ${pageRes.status}`)
    }

    const html = await pageRes.text()

    // Extract captions URL from page data
    const captionMatch = html.match(
      /"captionTracks":\s*\[.*?"baseUrl":\s*"([^"]+)"/
    )
    if (!captionMatch) {
      throw new Error(
        "No captions found. This video may not have " +
        "subtitles enabled."
      )
    }

    const captionUrl = captionMatch[1]
      .replace(/\\u0026/g, "&")
      .replace(/\\\//g, "/")

    // Add English language param
    const finalUrl = captionUrl.includes("&lang=")
      ? captionUrl
      : captionUrl + "&lang=en&fmt=json3"

    const captionRes = await fetch(finalUrl)
    const captionText = await captionRes.text()

    let text = ""

    // Try JSON3 format first
    try {
      const json = JSON.parse(captionText)
      text = (json.events ?? [])
        .filter((e: any) => e.segs)
        .flatMap((e: any) => e.segs)
        .map((s: any) => s.utf8 ?? "")
        .join(" ")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    } catch {
      // Try XML format
      text = captionText
        .replace(/<[^>]+>/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, " ")
        .trim()
    }

    if (text.length < 100) {
      throw new Error("Extracted transcript too short")
    }

    console.log(
      `[YOUTUBE] Extracted ${text.length} chars ` +
      `via timedtext fallback for ${videoId}`
    )
    return text
  } catch (e) {
    console.warn("[YOUTUBE Method 2 failed]",
      String(e).slice(0, 200))
  }

  // Final: throw clear user-facing error
  throw new Error(
    "Could not extract transcript from this video. " +
    "Reasons: (1) Video has no captions/subtitles, " +
    "(2) Video is private or age-restricted, " +
    "(3) Auto-generated captions are disabled. " +
    "Try a video with CC button in YouTube player, " +
    "or paste the transcript as a PDF instead."
  )
}
