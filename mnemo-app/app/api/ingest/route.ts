import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { YoutubeTranscript } from 'youtube-transcript';

async function extractYouTubeText(url: string): Promise<string> {
  const videoId = url.match(
    /(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/
  )?.[1]
  if (!videoId) throw new Error('Invalid YouTube URL')

  const transcript = await YoutubeTranscript.fetchTranscript(videoId)
  if (!transcript?.length) throw new Error('No transcript available for this video')

  return transcript
    .map(t => t.text)
    .join(' ')
    .replace(/\[.*?\]/g, '')  // strip [Music] [Applause] etc
    .trim()
}

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  let session: any;
  try {
    session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch (err: any) {
    console.error("[INGEST] Session check failed:", err);
    return NextResponse.json({ error: "Session check failed" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const type = formData.get("type") as string;
    const title = formData.get("title") as string ?? "Untitled";
    let rawText = "";
    let sourceType = type;

    // Normalise type — handle all variants
    const normalisedType = (() => {
      if (type === "pdf") return "pdf";
      if (type === "youtube") return "youtube";
      if (
        type === "image" || 
        type === "notes" || 
        type === "handwriting" ||
        type === "handwritten"
      ) return "image";
      return null;
    })();

    if (!normalisedType) {
      return NextResponse.json(
        { 
          error: `Unknown content type: "${type}". Valid types: pdf, youtube, image, notes` 
        },
        { status: 400 }
      );
    }

    if (normalisedType === "pdf") {
      const file = formData.get("file") as File;
      if (!file) throw new Error("No file provided");
      if (file.type !== "application/pdf") {
        throw new Error("File must be a PDF");
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const { extractTextFromPDF } = await import("@/lib/pdf-parser");
      rawText = await extractTextFromPDF(buffer);
    } else if (normalisedType === "youtube") {
      const url = formData.get("url") as string;
      if (!url || !url.trim()) {
        return NextResponse.json(
          { error: "YouTube URL is required" },
          { status: 400 }
        )
      }
      
      // Validate URL format before hitting API
      const urlPattern = /youtube\.com|youtu\.be/
      if (!urlPattern.test(url)) {
        return NextResponse.json(
          { 
            error: "Invalid URL. Must be a YouTube link." 
          },
          { status: 400 }
        )
      }

      try {
        rawText = await extractYouTubeText(url.trim())
      } catch (e) {
        return NextResponse.json(
          { error: String(e) },
          { status: 422 }
        )
      }
    } else if (normalisedType === "image") {
      const file = formData.get("file") as File | null
      if (!file) {
        return NextResponse.json(
          { error: "No image file provided" },
          { status: 400 }
        )
      }

      const allowedTypes = [
        "image/jpeg", "image/jpg",
        "image/png", "image/webp",
      ]
      
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error: `Unsupported file type: ${file.type}. ` +
              `Use JPG, PNG, or WebP.`,
          },
          { status: 400 }
        )
      }

      // Size check BEFORE reading buffer
      const MAX_SIZE = 3.5 * 1024 * 1024 // 3.5MB
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          {
            error: 
              `Image too large (${(file.size/1024/1024)
                .toFixed(1)}MB). Maximum: 3.5MB. ` +
              `Compress or resize before uploading.`,
          },
          { status: 400 }
        )
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const { extractTextFromImage } = 
          await import("@/lib/vision")
        rawText = await extractTextFromImage(
          buffer,
          file.type
        )
      } catch (e) {
        return NextResponse.json(
          { error: String(e) },
          { status: 422 }
        )
      }
    } else {
      throw new Error(`Unknown type: ${type}`);
    }

    if (!rawText || rawText.trim().length < 50) {
      throw new Error(
        "Extracted content too short. " + "Check source quality."
      );
    }

    const [doc] = await db
      .insert(documents)
      .values({
        userId: session.user.id,
        title,
        rawText: rawText.trim(),
        status: "pending",
        subject:
          type === "youtube"
            ? "Video Lecture"
            : type === "notes"
            ? "Handwritten Notes"
            : type === "image"
            ? "Image/Diagram"
            : "PDF Document",
      })
      .returning();

    return NextResponse.json(doc);
  } catch (error) {
    console.error("[INGEST]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
