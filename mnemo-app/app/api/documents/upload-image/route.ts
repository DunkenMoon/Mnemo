import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents } from "@/drizzle/schema";
import { extractTextFromImage } from "@/lib/image-ocr";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];

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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Only JPG, PNG, WEBP images accepted",
        },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image too large. Max 10MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText: string;
    try {
      extractedText = await extractTextFromImage(buffer, file.type);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }

    const title =
      file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]/g, " ")
        .trim() || "Handwritten Notes";

    const [doc] = await db
      .insert(documents)
      .values({
        userId: session.user.id,
        title,
        rawText: extractedText,
        sourceType: "handwriting",
        status: "pending",
      })
      .returning();

    return NextResponse.json(doc);
  } catch (err: any) {
    console.error("Image upload error:", err);
    return NextResponse.json(
      { error: "Failed: " + err.message },
      { status: 500 }
    );
  }
}
