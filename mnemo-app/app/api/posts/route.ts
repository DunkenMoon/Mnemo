import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, documents } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { communityId, title, body, type, documentId } = await request.json();
    if (!communityId || !title) {
      return NextResponse.json({ error: "Community ID and title are required" }, { status: 400 });
    }

    if (documentId) {
      // Verify document ownership
      const [doc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId));
        
      if (!doc || doc.userId !== session.user.id) {
        return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
      }
      
      // Make document public and assign to community
      await db
        .update(documents)
        .set({ isPublic: true, communityId })
        .where(eq(documents.id, documentId));
    }

    const [post] = await db.insert(posts).values({
      communityId,
      userId: session.user.id,
      title,
      body,
      type: type || "universe",
      documentId,
    }).returning();

    return NextResponse.json(post);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
