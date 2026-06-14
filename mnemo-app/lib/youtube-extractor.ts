export async function extractYouTubeTranscript(
  url: string
): Promise<string> {
  // Extract video ID from URL
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ];

  let videoId: string | null = null;
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      videoId = match[1];
      break;
    }
  }

  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  // Fetch transcript via YouTube's timedtext API
  // This is free and requires no API key
  const transcriptUrl =
    `https://www.youtube.com/api/timedtext` +
    `?lang=en&v=${videoId}&fmt=json3`;

  const response = await fetch(transcriptUrl);

  if (!response.ok) {
    // Try alternate endpoint
    const altUrl =
      `https://www.youtube.com/api/timedtext` +
      `?lang=en&v=${videoId}`;
    const altResponse = await fetch(altUrl);
    if (!altResponse.ok) {
      throw new Error(
        "Could not fetch transcript. " +
          "Video may not have captions."
      );
    }
    const text = await altResponse.text();
    return parseXMLTranscript(text);
  }

  const data = await response.json();
  return parseJSON3Transcript(data);
}

function parseJSON3Transcript(data: any): string {
  const events = data.events ?? [];
  return events
    .filter((e: any) => e.segs)
    .map((e: any) => e.segs.map((s: any) => s.utf8).join(""))
    .join(" ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 15000);
}

function parseXMLTranscript(xml: string): string {
  const matches = xml.match(/<text[^>]*>(.*?)<\/text>/gs) ?? [];
  return matches
    .map((m) => m.replace(/<[^>]+>/g, "").trim())
    .join(" ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .substring(0, 15000);
}

export function getYouTubeVideoTitle(url: string): string {
  const videoId = url.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];
  return videoId ? `YouTube: ${videoId}` : "YouTube Video";
}
