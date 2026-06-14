import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userProgress, conceptNodes } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { getSuggestions } from "@/lib/ai";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const progress = await db.select().from(userProgress)
      .where(eq(userProgress.userId, userId));

    const nodeIds = [...new Set(progress.map(p => p.nodeId))];
    const nodes = await db.select().from(conceptNodes)
      .where(eq(conceptNodes.documentId, progress[0]?.documentId ?? ""));
    
    const nodeMap = new Map(nodes.map(n => [n.id, n.label]));

    const scores: Record<string, number> = {};
    for (const prog of progress) {
      const label = nodeMap.get(prog.nodeId);
      if (label) scores[label] = prog.memoryStrength ?? 0.5;
    }

    const suggestions = await getSuggestions(scores);
    return NextResponse.json({ suggestions, scores });
  } catch (err: any) {
    console.error("[progress summary]", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
