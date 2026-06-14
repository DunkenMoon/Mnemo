import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, documents, posts, communities } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        image: users.image,
        learningStyle: users.learningStyle,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.username, username));

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userPosts = await db
      .select({
        post: posts,
        community: communities,
        document: {
          id: documents.id,
          title: documents.title,
          totalNodes: documents.totalNodes,
        }
      })
      .from(posts)
      .leftJoin(communities, eq(posts.communityId, communities.id))
      .leftJoin(documents, eq(posts.documentId, documents.id))
      .where(eq(posts.userId, user.id))
      .orderBy(desc(posts.createdAt));

    return NextResponse.json({ ...user, posts: userPosts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
