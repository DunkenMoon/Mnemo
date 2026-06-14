import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, posts } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { body, nodeId, parentId } = await request.json();
    
    if (!body) {
      return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
    }

    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const [comment] = await db.insert(comments).values({
      postId: id,
      userId: session.user.id,
      body,
      nodeId,
      parentId,
    }).returning();

    await db.update(posts)
      .set({ commentCount: (post.commentCount || 0) + 1 })
      .where(eq(posts.id, id));

    return NextResponse.json(comment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
