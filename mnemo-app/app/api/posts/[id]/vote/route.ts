import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts, votes } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

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
    const { value } = await request.json(); // 1 for upvote, -1 for downvote, 0 to remove
    
    if (![-1, 0, 1].includes(value)) {
      return NextResponse.json({ error: "Invalid vote value" }, { status: 400 });
    }

    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id));

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const [existingVote] = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.postId, id),
          eq(votes.userId, session.user.id)
        )
      );

    let upvotesDiff = 0;
    let downvotesDiff = 0;

    if (existingVote) {
      // Revert existing vote effect
      if (existingVote.value === 1) upvotesDiff -= 1;
      if (existingVote.value === -1) downvotesDiff -= 1;

      if (value === 0) {
        await db.delete(votes).where(eq(votes.id, existingVote.id));
      } else {
        await db.update(votes).set({ value }).where(eq(votes.id, existingVote.id));
        if (value === 1) upvotesDiff += 1;
        if (value === -1) downvotesDiff += 1;
      }
    } else if (value !== 0) {
      await db.insert(votes).values({
        postId: id,
        userId: session.user.id,
        value,
      });
      if (value === 1) upvotesDiff += 1;
      if (value === -1) downvotesDiff += 1;
    }

    const newUpvotes = (post.upvotes || 0) + upvotesDiff;
    const newDownvotes = (post.downvotes || 0) + downvotesDiff;

    await db
      .update(posts)
      .set({ upvotes: newUpvotes, downvotes: newDownvotes })
      .where(eq(posts.id, id));

    return NextResponse.json({ upvotes: newUpvotes, downvotes: newDownvotes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
