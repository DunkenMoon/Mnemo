import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userProgress, conceptNodes } from "@/drizzle/schema";
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

    const progress = await db.select().from(userProgress)
      .where(and(
        eq(userProgress.documentId, p.documentId),
        eq(userProgress.userId, userId)
      ));

    const nodes = await db.select().from(conceptNodes)
      .where(eq(conceptNodes.documentId, p.documentId));
    
    const nodeMap = new Map(nodes.map(n => [n.id, n.label]));

    const enriched = progress.map(p => ({
      ...p,
      nodeLabel: nodeMap.get(p.nodeId) ?? "Unknown",
    }));

    return NextResponse.json(enriched);
  } catch (err: any) {
    console.error("[progress documentId]", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
