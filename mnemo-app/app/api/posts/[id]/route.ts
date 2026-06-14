import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, users, documents, comments } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [postData] = await db
      .select({
        post: posts,
        user: {
          id: users.id,
          name: users.name,
          username: users.username,
          image: users.image,
        },
        document: {
          id: documents.id,
          title: documents.title,
          totalNodes: documents.totalNodes,
        }
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .leftJoin(documents, eq(posts.documentId, documents.id))
      .where(eq(posts.id, id));

    if (!postData) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const postComments = await db
      .select({
        comment: comments,
        user: {
          id: users.id,
          name: users.name,
          username: users.username,
          image: users.image,
        }
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, id))
      .orderBy(desc(comments.createdAt));

    return NextResponse.json({ ...postData, comments: postComments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
