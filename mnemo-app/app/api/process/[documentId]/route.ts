import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { documents, conceptNodes, conceptEdges, flashcards } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { extractConcepts, generateFlashcards } from "@/lib/ai"

export const maxDuration = 120

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params

  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const [doc] = await db.select().from(documents)
      .where(eq(documents.id, documentId))

    if (!doc || doc.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    console.log("[PROCESS] Starting for doc:", doc.title)
    console.log("[PROCESS] rawText length:", doc.rawText?.length)

    await db.update(documents)
      .set({ status: "processing" })
      .where(eq(documents.id, documentId))

    const { concepts, relationships } = await extractConcepts(doc.rawText)

    console.log("[PROCESS] Concepts:", concepts.length)

    if (concepts.length === 0) {
      await db.update(documents)
        .set({ status: "error" })
        .where(eq(documents.id, documentId))
      return NextResponse.json(
        { error: "No concepts extracted. Check your API keys in .env.local" },
        { status: 422 }
      )
    }

    // Clear old data
    await db.delete(conceptNodes)
      .where(eq(conceptNodes.documentId, documentId))
    await db.delete(conceptEdges)
      .where(eq(conceptEdges.documentId, documentId))

    // Save nodes
    const nodeMap = new Map<string, string>()
    for (const c of concepts) {
      const [node] = await db.insert(conceptNodes).values({
        documentId,
        label: c.label,
        explanation: c.explanation,
        importance: c.importance,
        positionX: c.positionX,
        positionY: c.positionY,
        positionZ: c.positionZ,
      }).returning()
      nodeMap.set(c.label, node.id)
    }

    // Save edges
    for (const r of relationships) {
      const sourceId = nodeMap.get(r.source)
      const targetId = nodeMap.get(r.target)
      if (!sourceId || !targetId) continue
      await db.insert(conceptEdges).values({
        documentId,
        sourceNodeId: sourceId,
        targetNodeId: targetId,
        relationshipLabel: r.label,
        strength: r.strength,
      })
    }

    // Generate flashcards
    let flashcardCount = 0
    for (const c of concepts) {
      const nodeId = nodeMap.get(c.label)
      if (!nodeId) continue
      const cards = await generateFlashcards(c.label, c.explanation)
      for (const card of cards) {
        await db.insert(flashcards).values({
          nodeId,
          documentId,
          userId,
          question: card.question,
          answer: card.answer,
          difficulty: card.difficulty,
        })
        flashcardCount++
      }
    }

    await db.update(documents).set({
      status: "complete",
      totalNodes: concepts.length,
      updatedAt: new Date(),
    }).where(eq(documents.id, documentId))

    console.log("[PROCESS] Done. Nodes:", concepts.length, "Flashcards:", flashcardCount)

    return NextResponse.json({
      success: true,
      nodeCount: concepts.length,
      edgeCount: relationships.length,
      flashcardCount,
    })
  } catch (err: any) {
    console.error("[PROCESS] Fatal error:", err.message)
    await db.update(documents)
      .set({ status: "error" })
      .where(eq(documents.id, documentId))
    return NextResponse.json(
      { error: err.message ?? "Processing failed" },
      { status: 500 }
    )
  }
}
