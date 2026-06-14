import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await params;
    const { isPublic, communityId } = await request.json();

    const [doc] = await db.select().from(documents).where(eq(documents.id, documentId));
    if (!doc || doc.userId !== session.user.id) {
      return NextResponse.json({ error: "Document not found or unauthorized" }, { status: 404 });
    }

    const updateData: any = {};
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (communityId !== undefined) updateData.communityId = communityId;

    const [updatedDoc] = await db
      .update(documents)
      .set(updateData)
      .where(eq(documents.id, documentId))
      .returning();

    return NextResponse.json(updatedDoc);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
