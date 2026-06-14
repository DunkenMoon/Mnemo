import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  try {
    const docs = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(documents.createdAt)
    return NextResponse.json(docs ?? [])
  } catch (err: any) {
    console.error("[DOCUMENTS] Error:", err.message)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}
