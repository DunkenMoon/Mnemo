import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { flashcards, userProgress } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { calculateNextState } from "@/lib/memory";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ flashcardId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { flashcardId } = await params;

    const body = await req.json();
    const responseQuality = Math.max(1, Math.min(5, Math.round(body.responseQuality ?? 3)));
    const correct = body.correct !== undefined ? Boolean(body.correct) : responseQuality >= 3;
    const timeSpent = Number(body.timeSpent ?? 0);

    const [card] = await db.select().from(flashcards).where(eq(flashcards.id, flashcardId));
    if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [existing] = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, session.user.id), eq(userProgress.nodeId, card.nodeId)));

    const nextState = calculateNextState(
      {
        strength: existing?.memoryStrength ?? 0.5,
        interval: existing?.interval ?? 1,
        easeFactor: existing?.easeFactor ?? 2.5,
        repetitions: existing?.repetitions ?? 0,
        lastReviewedAt: existing?.lastReviewedAt ?? null,
      },
      correct,
      responseQuality
    );

    const correctAnswers = (existing?.correctAnswers ?? 0) + (correct ? 1 : 0);
    const totalAttempts = (existing?.totalAttempts ?? 0) + 1;
    const timeSpentTotal = (existing?.timeSpentSeconds ?? 0) + timeSpent;

    if (existing) {
      await db
        .update(userProgress)
        .set({
          correctAnswers,
          totalAttempts,
          timeSpentSeconds: timeSpentTotal,
          memoryStrength: nextState.strength,
          interval: nextState.interval,
          easeFactor: nextState.easeFactor,
          repetitions: nextState.repetitions,
          visitCount: (existing.visitCount ?? 0) + 1,
          lastReviewedAt: nextState.lastReviewedAt,
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
        memoryStrength: nextState.strength,
        interval: nextState.interval,
        easeFactor: nextState.easeFactor,
        repetitions: nextState.repetitions,
        visitCount: 1,
        lastReviewedAt: nextState.lastReviewedAt,
      });
    }

    return NextResponse.json({
      memoryStrength: nextState.strength,
      interval: nextState.interval,
      easeFactor: nextState.easeFactor,
      repetitions: nextState.repetitions,
      correct,
      responseQuality,
    });
  } catch (err: unknown) {
    console.error("[flashcards answer]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
