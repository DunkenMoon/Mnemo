import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userProgress, conceptNodes } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const p = await params;

    const { timeSpent } = await req.json();

    const [node] = await db.select().from(conceptNodes).where(eq(conceptNodes.id, p.nodeId));
    if (!node) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [existing] = await db.select().from(userProgress)
      .where(and(
        eq(userProgress.userId, userId),
        eq(userProgress.nodeId, p.nodeId)
      ));

    if (existing) {
      await db.update(userProgress).set({
        visitCount: (existing.visitCount ?? 0) + 1,
        timeSpentSeconds: (existing.timeSpentSeconds ?? 0) + (timeSpent ?? 0),
        updatedAt: new Date(),
      }).where(eq(userProgress.id, existing.id));
    } else {
      await db.insert(userProgress).values({
        userId,
        nodeId: p.nodeId,
        documentId: node.documentId,
        visitCount: 1,
        timeSpentSeconds: timeSpent ?? 0,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
