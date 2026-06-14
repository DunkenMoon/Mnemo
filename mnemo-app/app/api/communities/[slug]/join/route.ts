import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { communities, communityMembers } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const [community] = await db
      .select()
      .from(communities)
      .where(eq(communities.slug, slug));

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const [existingMember] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, community.id),
          eq(communityMembers.userId, session.user.id)
        )
      );

    if (existingMember) {
      // Leave community
      await db
        .delete(communityMembers)
        .where(eq(communityMembers.id, existingMember.id));
      
      await db
        .update(communities)
        .set({ memberCount: (community.memberCount || 1) - 1 })
        .where(eq(communities.id, community.id));
        
      return NextResponse.json({ joined: false });
    } else {
      // Join community
      await db.insert(communityMembers).values({
        communityId: community.id,
        userId: session.user.id,
        role: "member",
      });

      await db
        .update(communities)
        .set({ memberCount: (community.memberCount || 0) + 1 })
        .where(eq(communities.id, community.id));

      return NextResponse.json({ joined: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
