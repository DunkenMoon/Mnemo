import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userProgress } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Get all progress records for this user
    const allProgress = await db
      .select({ lastReviewedAt: userProgress.lastReviewedAt })
      .from(userProgress)
      .where(eq(userProgress.userId, session.user.id))

    // Count cards reviewed today
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const cardsToday = allProgress.filter(
      (p) => p.lastReviewedAt && new Date(p.lastReviewedAt) >= startOfDay
    ).length

    // Calculate consecutive-day streak
    const dates = [
      ...new Set(
        allProgress
          .filter((p) => p.lastReviewedAt)
          .map((p) => new Date(p.lastReviewedAt!).toISOString().split("T")[0])
      ),
    ]
      .sort()
      .reverse() // newest first

    let streak = 0
    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

    // Must have studied today or yesterday to have a streak
    if (dates.length > 0 && (dates[0] === today || dates[0] === yesterday)) {
      // If most recent is yesterday, start checking from yesterday
      const startOffset = dates[0] === today ? 0 : 1
      for (let i = 0; i < dates.length; i++) {
        const expected = new Date(Date.now() - (i + startOffset) * 86400000)
          .toISOString()
          .split("T")[0]
        if (dates[i] === expected) {
          streak++
        } else {
          break
        }
      }
    }

    return NextResponse.json({ cardsToday, streak })
  } catch (err: any) {
    console.error("[progress today]", err)
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 })
  }
}
