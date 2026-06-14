import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conceptNodes, conceptEdges, documents } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const p = await params;

    const nodes = await db.select().from(conceptNodes)
      .where(eq(conceptNodes.documentId, p.documentId));
    const edges = await db.select().from(conceptEdges)
      .where(eq(conceptEdges.documentId, p.documentId));

    const [document] = await db.select().from(documents)
      .where(eq(documents.id, p.documentId));

    return NextResponse.json({ nodes, edges, document });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
