import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userProgress, documents } from "@/drizzle/schema"
import { eq, and, lt, desc } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user)
    return NextResponse.json({ dueCount: 0, recentDocId: null })

  try {
    // Cards are "due" if memoryStrength < 0.6 (fading or weak)
    const dueCards = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, session.user.id),
          lt(userProgress.memoryStrength, 0.6)
        )
      )

    // Get most recently updated document for the "review" link
    const recentDocs = await db
      .select({ id: documents.id })
      .from(documents)
      .where(eq(documents.userId, session.user.id))
      .orderBy(desc(documents.updatedAt))
      .limit(1)

    return NextResponse.json({
      dueCount: dueCards.length,
      recentDocId: recentDocs[0]?.id ?? null,
    })
  } catch (err: any) {
    console.error("Due count fetch failed:", err.message)
    return NextResponse.json({ dueCount: 0, recentDocId: null })
  }
}
