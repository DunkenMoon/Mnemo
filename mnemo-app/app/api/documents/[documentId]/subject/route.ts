import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { documents } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params
    const session = await auth.api.getSession({
      headers: req.headers,
    })
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { subject } = await req.json()

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 }
      )
    }

    await db
      .update(documents)
      .set({ subject: subject.trim() })
      .where(eq(documents.id, documentId))

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
