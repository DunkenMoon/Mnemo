import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { documents, conceptNodes, userProgress } from "@/drizzle/schema"
import { eq, and, asc } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    // Get all user's documents
    const userDocs = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.userId, session.user.id),
          eq(documents.status, "complete")
        )
      )

    // Get all user progress
    const allProgress = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, session.user.id))

    // Get all concept nodes for user's documents
    const docIds = userDocs.map((d) => d.id)
    const allNodes =
      docIds.length > 0
        ? await db.select().from(conceptNodes)
        : []

    // Build per-document mastery
    const docs = userDocs.map((doc) => {
      const docNodes = allNodes.filter((n) => n.documentId === doc.id)
      const docProgress = allProgress.filter((p) => p.documentId === doc.id)
      const progressMap = new Map(docProgress.map((p) => [p.nodeId, p.memoryStrength ?? 0.5]))

      const strengths = docNodes.map((n) => progressMap.get(n.id) ?? 0.5)
      const avgStrength =
        strengths.length > 0
          ? strengths.reduce((a, b) => a + b, 0) / strengths.length
          : 0.5
      const weakNodes = strengths.filter((s) => s < 0.3).length

      return {
        id: doc.id,
        title: doc.title,
        avgStrength,
        totalNodes: docNodes.length,
        weakNodes,
      }
    })

    // Find 3 weakest concepts across all docs
    const weakest = allProgress
      .filter((p) => (p.memoryStrength ?? 0.5) < 0.5)
      .sort((a, b) => (a.memoryStrength ?? 0.5) - (b.memoryStrength ?? 0.5))
      .slice(0, 3)
      .map((p) => {
        const node = allNodes.find((n) => n.id === p.nodeId)
        return {
          label: node?.label ?? "Unknown concept",
          strength: p.memoryStrength ?? 0,
          nodeId: p.nodeId,
          documentId: p.documentId,
        }
      })

    return NextResponse.json({ docs, weakest })
  } catch (err: any) {
    console.error("Progress overview error:", err.message)
    return NextResponse.json({ docs: [], weakest: [] })
  }
}
