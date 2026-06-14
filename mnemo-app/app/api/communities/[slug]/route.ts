import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { communities, posts, users, communityMembers } from "@/drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

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

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    let isMember = false;
    if (session?.user) {
      const [membership] = await db
        .select()
        .from(communityMembers)
        .where(
          and(
            eq(communityMembers.communityId, community.id),
            eq(communityMembers.userId, session.user.id)
          )
        );
      isMember = !!membership;
    }

    return NextResponse.json({ ...community, isMember });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
