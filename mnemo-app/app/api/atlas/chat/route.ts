import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { documents, conceptNodes } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { atlasChat } from "@/lib/ai"

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { documentId, message, history } = await req.json()

  const [doc] = await db.select().from(documents)
    .where(eq(documents.id, documentId))
  const nodes = await db.select().from(conceptNodes)
    .where(eq(conceptNodes.documentId, documentId))

  const context = `Document: "${doc?.title}"
Concepts: ${nodes.map((n) => n.label).join(", ")}
Content: ${doc?.rawText?.slice(0, 2000) ?? ""}`

  const reply = await atlasChat(message, context, history ?? [])
  return NextResponse.json({ reply })
}
