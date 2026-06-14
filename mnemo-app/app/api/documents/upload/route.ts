import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents } from "@/drizzle/schema";
import { extractTextFromPDF } from "@/lib/pdf-parser";

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to upload" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      );
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Extract text
    const buffer = Buffer.from(await file.arrayBuffer());
    const rawText = await extractTextFromPDF(buffer);

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json(
        { error: "PDF has no readable text. Try a different file." },
        { status: 400 }
      );
    }

    // Save to database
    const [doc] = await db
      .insert(documents)
      .values({
        userId: session.user.id,
        title: title || file.name.replace(".pdf", ""),
        rawText,
        status: "pending",
      })
      .returning();

    console.log(`[UPLOAD] Document ${doc.id} created, ${rawText.length} chars`);
    return NextResponse.json(doc);
  } catch (err: any) {
    console.error("[UPLOAD] Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Upload failed. Try again." },
      { status: 500 }
    );
  }
}
