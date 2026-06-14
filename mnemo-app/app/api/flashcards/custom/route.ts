import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { flashcards } from "@/drizzle/schema"

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { nodeId, documentId, question, answer, difficulty } = await req.json()

    if (!nodeId || !documentId || !question || !answer) {
      return NextResponse.json(
        { error: "Missing required fields: nodeId, documentId, question, answer" },
        { status: 400 }
      )
    }

    const [card] = await db
      .insert(flashcards)
      .values({
        nodeId,
        documentId,
        userId: session.user.id,
        question,
        answer,
        difficulty: difficulty ?? 3,
      })
      .returning()

    return NextResponse.json(card)
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
