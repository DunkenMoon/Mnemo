import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { communities, posts, users, documents } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const [community] = await db
      .select()
      .from(communities)
      .where(eq(communities.slug, slug));

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const communityPosts = await db
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
      .where(eq(posts.communityId, community.id))
      .orderBy(desc(posts.createdAt));

    return NextResponse.json(communityPosts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
