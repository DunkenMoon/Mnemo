import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function callAI(prompt: string, maxTokens = 4096): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: maxTokens,
    })
    const text = completion.choices[0]?.message?.content ?? ""
    console.log("[AI] Response length:", text.length)
    if (!text) throw new Error("Empty response from Groq")
    return text
  } catch (err: any) {
    console.error("[AI] Groq call failed:", err?.message)
    throw err
  }
}

function parseJSON(raw: string): any {
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("No JSON object found in response")
  return JSON.parse(match[0])
}

export interface Concept {
  label: string
  explanation: string
  importance: number
  positionX: number
  positionY: number
  positionZ: number
}

export interface Relationship {
  source: string
  target: string
  label: string
  strength: number
}

export async function extractConcepts(
  text: string
): Promise<{ concepts: Concept[]; relationships: Relationship[] }> {
  const trimmed = text.slice(0, 5000)

  const prompt = `You are a knowledge graph builder. Analyze the text below.

CRITICAL: Return ONLY a raw JSON object. No markdown. No backticks. No explanation. Start your response with { and end with }

Format:
{
  "concepts": [
    { "label": "Concept Name", "explanation": "One clear sentence.", "importance": 8 }
  ],
  "relationships": [
    { "source": "Concept Name", "target": "Other Concept", "label": "relates to", "strength": 0.7 }
  ]
}

Requirements:
- Extract 8 to 12 concepts
- importance: integer 1-10
- strength: decimal 0.1-1.0
- All concepts must have all three fields
- relationships source and target must exactly match concept labels

TEXT TO ANALYZE:
${trimmed}`

  try {
    const raw = await callAI(prompt, 4096)
    const parsed = parseJSON(raw)

    const concepts: Concept[] = (parsed.concepts ?? []).map((c: any) => ({
      label: String(c.label ?? "Unknown"),
      explanation: String(c.explanation ?? "No explanation"),
      importance: Math.min(10, Math.max(1, Number(c.importance) || 5)),
      positionX: (Math.random() - 0.5) * 16,
      positionY: (Math.random() - 0.5) * 16,
      positionZ: (Math.random() - 0.5) * 16,
    }))

    const relationships: Relationship[] = (parsed.relationships ?? []).map((r: any) => ({
      source: String(r.source ?? ""),
      target: String(r.target ?? ""),
      label: String(r.label ?? "relates to"),
      strength: Math.min(1, Math.max(0.1, Number(r.strength) || 0.5)),
    })).filter((r) => r.source && r.target)

    console.log("[CONCEPTS] Extracted:", concepts.length, "concepts,", relationships.length, "relationships")

    if (concepts.length === 0) {
      throw new Error("Groq returned 0 concepts — check API key and model availability")
    }

    return { concepts, relationships }
  } catch (err: any) {
    console.error("[CONCEPTS] Failed:", err?.message)
    return { concepts: [], relationships: [] }
  }
}

export interface FlashcardData {
  question: string
  answer: string
  difficulty: number
}

export async function generateFlashcards(
  concept: string,
  explanation: string
): Promise<FlashcardData[]> {
  const prompt = `Generate exactly 2 flashcard Q&A pairs for this concept.

Concept: "${concept}"
Context: "${explanation}"

CRITICAL: Return ONLY raw JSON starting with { and ending with }. No markdown. No backticks.

{
  "flashcards": [
    { "question": "Question text?", "answer": "Answer text.", "difficulty": 3 }
  ]
}

difficulty is integer 1-5.`

  try {
    const raw = await callAI(prompt, 1024)
    const parsed = parseJSON(raw)
    return (parsed.flashcards ?? []).map((f: any) => ({
      question: String(f.question ?? ""),
      answer: String(f.answer ?? ""),
      difficulty: Math.min(5, Math.max(1, Number(f.difficulty) || 3)),
    })).filter((f) => f.question && f.answer)
  } catch (err: any) {
    console.error("[FLASHCARDS] Failed for concept:", concept, err?.message)
    return []
  }
}

export interface Suggestion {
  concept: string
  reason: string
}

export async function getSuggestions(
  scores: Record<string, number>
): Promise<Suggestion[]> {
  const prompt = `Student mastery scores (0-1): ${JSON.stringify(scores)}

Return ONLY raw JSON starting with {. No markdown. No backticks.
{
  "suggestions": [
    { "concept": "name", "reason": "one sentence why to review" }
  ]
}

Pick the 3 lowest scoring concepts.`

  try {
    const raw = await callAI(prompt, 512)
    const parsed = parseJSON(raw)
    return parsed.suggestions ?? []
  } catch {
    return []
  }
}

export async function atlasChat(
  message: string,
  context: string,
  history: { role: string; content: string }[]
): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are Atlas, a friendly AI study buddy. Answer in 2-3 sentences max. Be encouraging and clear.
Document context: ${context.slice(0, 1500)}`,
        },
        ...history.slice(-6).map((m) => ({
          role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 256,
    })
    return completion.choices[0]?.message?.content ?? "Could not process. Try again."
  } catch (err: any) {
    console.error("[ATLAS] Chat failed:", err?.message)
    return "I'm having trouble connecting. Please try again."
  }
}

export interface TopicNode {
  id: string;
  label: string;
  type: "root" | "branch" | "leaf";
  explanation: string;
  importance: number;
  depth: number;
  parentId: string | null;
  positionX: number;
  positionY: number;
  positionZ: number;
}

export interface TopicEdge {
  sourceId: string;
  targetId: string;
  label: string;
  edgeType: string;
}

export async function extractTopicHierarchy(
  text: string
): Promise<{ nodes: TopicNode[]; edges: TopicEdge[] }> {
  const prompt = `You are a curriculum architect mapping lecture content.
Extract a strict 3-level topic hierarchy.

RULES (you must follow all):
- Exactly 1 root node (depth:0, parentId:null)
- 3 to 5 branch nodes (depth:1, parentId: root id)
- 2 to 4 leaf nodes per branch (depth:2, parentId: that branch id)
- label: maximum 4 words
- Every id must be unique short strings like 'root', 'b1', 'b2', 'l1', 'l2' etc
- importance must be a NUMBER between 1 and 10

Return ONLY this JSON, no markdown:
{
  nodes: [
    { id, label, type, explanation, importance, depth, parentId }
  ],
  edges: [
    { sourceId, targetId, label, edgeType }
  ]
}

edgeType options: contains, leads_to, related

Lecture text: ${text.slice(0, 6000)}`;

  try {
    const raw = (await callAI(prompt)).trim();
    console.log("[AI RAW topic]", raw.substring(0, 500));
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const startIdx = cleaned.indexOf("{");
    const endIdx = cleaned.lastIndexOf("}");
    if (startIdx === -1 || endIdx === -1) return { nodes: [], edges: [] };
    const parsed = JSON.parse(cleaned.substring(startIdx, endIdx + 1));

    const nodes: TopicNode[] = (parsed.nodes ?? []).map((n: Record<string, unknown>, i: number) => ({
      id: String(n.id ?? `node_${i}`),
      label: String(n.label ?? `Topic ${i + 1}`),
      type: (n.type as TopicNode["type"]) ?? "leaf",
      explanation: String(n.explanation ?? ""),
      importance: Math.min(10, Math.max(1, Number(n.importance ?? 5))),
      depth: Number(n.depth ?? 0),
      parentId: n.parentId ? String(n.parentId) : null,
      positionX: 0,
      positionY: 0,
      positionZ: 0,
    }));

    const edges: TopicEdge[] = (parsed.edges ?? []).map((e: Record<string, unknown>) => ({
      sourceId: String(e.sourceId),
      targetId: String(e.targetId),
      label: String(e.label ?? ""),
      edgeType: String(e.edgeType ?? "contains"),
    }));

    console.log("[AI] Topic hierarchy extracted:", nodes.length, "nodes,", edges.length, "edges");
    return { nodes, edges };
  } catch (err: any) {
    console.error("[AI] Topic hierarchy error:", err);
    return { nodes: [], edges: [] };
  }
}
