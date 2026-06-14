import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { topicNodes, topicEdges, documents } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const session = await auth.api.getSession({
    headers: req.headers,
  })
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const p = await params;
  const { documentId } = p;

  try {
    const existingNodes = await db
      .select()
      .from(topicNodes)
      .where(eq(topicNodes.documentId, documentId))

    const existingEdges = await db
      .select()
      .from(topicEdges)
      .where(eq(topicEdges.documentId, documentId))

    // Return existing data if found
    if (existingNodes.length > 0) {
      return NextResponse.json({
        nodes: existingNodes,
        edges: existingEdges,
      })
    }

    // No topic data: extract now on-demand
    console.log(
      `[TOPICMAP] No data for ${documentId}, extracting now...`
    )

    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    if (!doc.rawText || doc.rawText.trim().length < 50) {
      return NextResponse.json(
        { 
          error: "Document has no text content. " +
            "Please reprocess the document." 
        },
        { status: 422 }
      )
    }

    if (doc.status !== "complete") {
      return NextResponse.json(
        {
          error: `Document is not ready (status: ${doc.status}). ` +
            "Wait for processing to complete."
        },
        { status: 422 }
      )
    }

    // Extract topic hierarchy
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      )
    }

    const { extractTopicHierarchy } = 
      await import("@/lib/ai")
    
    const { nodes: tNodes, edges: tEdges } =
      await extractTopicHierarchy(doc.rawText)

    if (tNodes.length === 0) {
      return NextResponse.json(
        { 
          error: "Could not extract topics from " +
            "this document. The content may be " +
            "too short or unclear." 
        },
        { status: 422 }
      )
    }

    // Save nodes
    const savedNodes = []
    for (const n of tNodes) {
      const [saved] = await db
        .insert(topicNodes)
        .values({
          documentId,
          label: n.label,
          type: n.type,
          explanation: n.explanation,
          importance: n.importance,
          depth: n.depth,
          parentId: n.parentId ?? null,
          positionX: n.positionX,
          positionY: n.positionY,
          positionZ: n.positionZ,
        })
        .returning()
      savedNodes.push(saved)
    }

    // Save edges
    const savedEdges = []
    for (const e of tEdges) {
      const src = savedNodes.find(n => n.label === e.sourceId)?.id
      const tgt = savedNodes.find(n => n.label === e.targetId)?.id
      if (!src || !tgt) continue
      
      const [saved] = await db
        .insert(topicEdges)
        .values({
          documentId,
          sourceNodeId: src,
          targetNodeId: tgt,
          label: e.label ?? "",
          edgeType: e.edgeType ?? "contains",
        })
        .returning()
      savedEdges.push(saved)
    }

    console.log(
      `[TOPICMAP] Extracted ${savedNodes.length} nodes on-demand for ${documentId}`
    )

    return NextResponse.json({
      nodes: savedNodes,
      edges: savedEdges,
    })
  } catch (err: unknown) {
    console.error("[topicmap GET]", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
