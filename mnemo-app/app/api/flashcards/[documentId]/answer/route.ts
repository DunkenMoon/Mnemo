import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { flashcards, userProgress } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

function calculateMemoryStrength(
  correctAnswers: number,
  totalAttempts: number,
  lastReviewedAt: Date | null
): number {
  const baseAccuracy = totalAttempts > 0 ? correctAnswers / totalAttempts : 0.5;
  let recencyBoost = 1.0;

  if (lastReviewedAt) {
    const daysSince = (Date.now() - lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 7) recencyBoost = 0.70;
    else if (daysSince > 3) recencyBoost = 0.85;
    else if (daysSince > 1) recencyBoost = 0.95;
  }

  return Math.min(1, Math.max(0, baseAccuracy * 0.7 + recencyBoost * 0.3));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const p = await params;

    const { correct, timeSpent } = await req.json();

    const [card] = await db.select().from(flashcards).where(eq(flashcards.id, p.documentId));
    if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [existing] = await db.select().from(userProgress)
      .where(and(
        eq(userProgress.userId, session.user.id),
        eq(userProgress.nodeId, card.nodeId)
      ));

    const correctAnswers = (existing?.correctAnswers ?? 0) + (correct ? 1 : 0);
    const totalAttempts = (existing?.totalAttempts ?? 0) + 1;
    const timeSpentTotal = (existing?.timeSpentSeconds ?? 0) + (timeSpent ?? 0);
    const memoryStrength = calculateMemoryStrength(correctAnswers, totalAttempts, existing?.lastReviewedAt ?? null);

    if (existing) {
      await db.update(userProgress)
        .set({
          correctAnswers,
          totalAttempts,
          timeSpentSeconds: timeSpentTotal,
          memoryStrength,
          visitCount: (existing.visitCount ?? 0) + 1,
          lastReviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userProgress.id, existing.id));
    } else {
      await db.insert(userProgress).values({
        userId: session.user.id,
        nodeId: card.nodeId,
        documentId: card.documentId,
        correctAnswers,
        totalAttempts,
        timeSpentSeconds: timeSpentTotal,
        memoryStrength,
        visitCount: 1,
        lastReviewedAt: new Date(),
      });
    }

    return NextResponse.json({ memoryStrength, correct });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
