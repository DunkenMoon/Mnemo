import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { flashcards, userProgress } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { priorityScore } from "@/lib/memory";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { documentId } = await params;
    const cards = await db
      .select()
      .from(flashcards)
      .where(eq(flashcards.documentId, documentId));

    if (!cards.length) {
      return NextResponse.json([]);
    }

    const progress = await db
      .select()
      .from(userProgress)
      .where(
        and(eq(userProgress.documentId, documentId), eq(userProgress.userId, userId))
      );

    const progressMap = new Map(progress.map((p) => [p.nodeId, p]));

    const sorted = [...cards].sort((a, b) => {
      const progA = progressMap.get(a.nodeId);
      const progB = progressMap.get(b.nodeId);
      const scoreA = priorityScore({
        strength: progA?.memoryStrength ?? 0.5,
        interval: progA?.interval ?? 1,
        easeFactor: progA?.easeFactor ?? 2.5,
        repetitions: progA?.repetitions ?? 0,
        lastReviewedAt: progA?.lastReviewedAt ?? null,
      });
      const scoreB = priorityScore({
        strength: progB?.memoryStrength ?? 0.5,
        interval: progB?.interval ?? 1,
        easeFactor: progB?.easeFactor ?? 2.5,
        repetitions: progB?.repetitions ?? 0,
        lastReviewedAt: progB?.lastReviewedAt ?? null,
      });
      return scoreB - scoreA;
    });

    return NextResponse.json(sorted);
  } catch (err: unknown) {
    console.error("[flashcards GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
