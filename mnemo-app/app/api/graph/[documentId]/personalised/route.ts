import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conceptNodes, userProgress } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const p = await params;

    const nodes = await db.select().from(conceptNodes)
      .where(eq(conceptNodes.documentId, p.documentId));

    const progress = await db.select().from(userProgress)
      .where(
        and(
          eq(userProgress.documentId, p.documentId),
          eq(userProgress.userId, userId)
        )
      );

    const progressMap = new Map(progress.map(p => [p.nodeId, p]));

    const enriched = nodes.map(n => ({
      ...n,
      memoryStrength: progressMap.get(n.id)?.memoryStrength ?? 0.5,
      visitCount: progressMap.get(n.id)?.visitCount ?? 0,
    })).sort((a, b) => a.memoryStrength - b.memoryStrength); // weakest first

    return NextResponse.json(enriched);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
