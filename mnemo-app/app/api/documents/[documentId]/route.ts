import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await params;

    const result = await db
      .delete(documents)
      .where(
        and(eq(documents.id, documentId), eq(documents.userId, session.user.id))
      )
      .returning({ id: documents.id });

    if (!result.length) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[documents DELETE]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
