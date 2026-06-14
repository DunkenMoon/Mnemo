import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents } from "@/drizzle/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { youtubeUrl } = await request.json();

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "YouTube URL required" },
        { status: 400 }
      );
    }

    const { extractYouTubeTranscript, getYouTubeVideoTitle } = await import(
      "@/lib/youtube-extractor"
    );

    let transcript: string;
    try {
      transcript = await extractYouTubeTranscript(youtubeUrl);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }

    if (!transcript || transcript.length < 100) {
      return NextResponse.json(
        {
          error:
            "Transcript too short or unavailable. " +
            "Try a video with captions enabled.",
        },
        { status: 422 }
      );
    }

    const title = getYouTubeVideoTitle(youtubeUrl);

    const [doc] = await db
      .insert(documents)
      .values({
        userId: session.user.id,
        title,
        rawText: transcript,
        sourceType: "youtube",
        sourceUrl: youtubeUrl,
        status: "pending",
      })
      .returning();

    return NextResponse.json(doc);
  } catch (err: any) {
    console.error("YouTube upload error:", err);
    return NextResponse.json(
      { error: "Failed: " + err.message },
      { status: 500 }
    );
  }
}
