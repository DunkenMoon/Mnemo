import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { communities, communityMembers } from "@/drizzle/schema";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const allCommunities = await db.select().from(communities);
    return NextResponse.json(allCommunities);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, subject } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const [community] = await db.insert(communities).values({
      name,
      slug,
      description,
      subject,
      createdBy: session.user.id,
      memberCount: 1,
    }).returning();

    await db.insert(communityMembers).values({
      communityId: community.id,
      userId: session.user.id,
      role: "admin",
    });

    return NextResponse.json(community);
  } catch (error: any) {
    if (error.message.includes("unique constraint")) {
      return NextResponse.json({ error: "Community name already taken" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
