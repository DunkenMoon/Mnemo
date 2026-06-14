# MNEMO — ANTIGRAVITY MASTER BUILD DOCUMENT
### "Your lectures, remembered forever."

**READ THIS ENTIRE DOCUMENT BEFORE EXECUTING ANYTHING. Every architectural decision is final. Execute phases in order. Do not skip steps or deviate from the stack.**

---

## ⚡ STEP 0 — MCP SERVERS SETUP (RUN THIS FIRST)

```
1. Neon MCP (database management):    npx -y @neondatabase/mcp-server-neon
2. Vercel MCP (deployment):           npx -y @vercel/mcp-server
3. File system MCP (file operations): npx -y @modelcontextprotocol/server-filesystem .
4. GitHub MCP (version control):      npx -y @modelcontextprotocol/server-github
```

Confirm each MCP is active by listing available tools. Do not proceed to Phase 1 until all 4 MCPs are confirmed active.

---

## PROJECT VISION

**One-sentence pitch:** Upload any lecture PDF and watch it explode into a living 3D universe of knowledge you can fly through, where every node glows based on how well you remember it.

**The demo moment that wins:** Judge uploads their own content on stage. In 15 seconds, a navigable 3D knowledge graph appears. Every other team built a quiz app.

**Judge-stopper features:**
1. 3D Knowledge Universe (React Three Fiber — concepts as glowing nodes, relationships as cyan beams)
2. Memory Decay Glow (nodes shift green→yellow→red based on time and quiz performance)
3. Live Node Expansion (click any node → Gemini explains it + generates a flashcard, all free)
4. Personalisation Engine (tracks what you struggle with, reorders your learning path)
5. Spatial Recall Mode (navigate 3D space to find and answer flashcards — spatial memory improves retention 40%)

---

## LOCKED TECH STACK

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | File-based routing, server components |
| Language | TypeScript | Type safety end-to-end |
| Styling | Tailwind CSS 3.4 | Utility-first, fastest path to polished UI |
| Components | shadcn/ui (dark theme) | Production-grade base |
| Animation | Framer Motion 11 | Spring physics, AnimatePresence |
| 3D | React Three Fiber + @react-three/drei | Core wow feature |
| AI | Google Gemini 1.5 Flash API | Free tier — concept extraction + flashcards |
| Database | Neon Postgres (free tier) | Serverless, 512MB |
| ORM | Drizzle ORM | Type-safe, schema-first |
| Auth | Better Auth | Open source, no cost |
| PDF Parsing | pdf-parse | Server-side text extraction |
| Hosting | Vercel (free tier) | One command deploy |

**Total cost: ₹0**

---

## VISUAL DESIGN SYSTEM

### Colour Tokens
```css
--bg-primary: #050510;    /* deep space — all page backgrounds */
--bg-secondary: #0A0A1F;  /* card surfaces */
--bg-tertiary: #0F0F2E;   /* modals, elevated surfaces */
--accent-violet: #6C63FF;  /* primary brand, buttons, active states */
--accent-cyan: #00D4FF;    /* connections, beams, secondary highlights */
--accent-glow: #A78BFA;    /* hover glow, soft highlights */
--node-weak: #FF6B6B;      /* memory strength 0.0–0.3 */
--node-medium: #FFD93D;    /* memory strength 0.3–0.6 */
--node-strong: #6BCB77;    /* memory strength 0.6–1.0 */
--text-primary: #F0F0FF;   /* all body text */
--text-muted: #8888AA;     /* labels, secondary */
--border: #1E1E3F;         /* all borders */
```

### Fonts (Google Fonts — free)
- Display: **Space Grotesk** — geometric, technical (headings, brand name)
- Body: **Inter** — clean, readable (all body text)
- Mono: **Fira Code** — concept tags, labels

### Motion Rules
```
Page transitions:   Framer Motion layoutId shared element
Card entrances:     staggerChildren 0.08s, y:20→0, opacity:0→1
3D node hover:      scale 1→1.15, emissiveIntensity increase
Modal open:         spring { stiffness:300, damping:30 }
Button hover:       translateY(-2px), box-shadow intensify
All durations:      0.3–0.4s (never longer for hackathon speed)
```

---

## PART 1 — DATABASE LAYER

### 1A. FILE: /drizzle/schema.ts

```typescript
import { pgTable, uuid, text, timestamp, boolean, integer, real, jsonb, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatar: text("avatar"),
  learningStyle: text("learning_style").default("visual"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  rawText: text("raw_text").notNull(),
  summary: text("summary"),
  subject: text("subject"),
  totalNodes: integer("total_nodes").default(0),
  masteryScore: real("mastery_score").default(0),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conceptNodes = pgTable("concept_nodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  label: text("label").notNull(),
  explanation: text("explanation").notNull(),
  importance: integer("importance").default(5),
  positionX: real("position_x").notNull(),
  positionY: real("position_y").notNull(),
  positionZ: real("position_z").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conceptEdges = pgTable("concept_edges", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  sourceNodeId: uuid("source_node_id").references(() => conceptNodes.id, { onDelete: "cascade" }).notNull(),
  targetNodeId: uuid("target_node_id").references(() => conceptNodes.id, { onDelete: "cascade" }).notNull(),
  relationshipLabel: text("relationship_label"),
  strength: real("strength").default(1.0),
});

export const flashcards = pgTable("flashcards", {
  id: uuid("id").primaryKey().defaultRandom(),
  nodeId: uuid("node_id").references(() => conceptNodes.id, { onDelete: "cascade" }).notNull(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  difficulty: integer("difficulty").default(3),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  nodeId: uuid("node_id").references(() => conceptNodes.id, { onDelete: "cascade" }).notNull(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  visitCount: integer("visit_count").default(0),
  timeSpentSeconds: integer("time_spent_seconds").default(0),
  memoryStrength: real("memory_strength").default(0.5),
  lastReviewedAt: timestamp("last_reviewed_at"),
  correctAnswers: integer("correct_answers").default(0),
  totalAttempts: integer("total_attempts").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quizSessions = pgTable("quiz_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  score: integer("score").default(0),
  totalQuestions: integer("total_questions").default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 1B. FILE: /lib/db.ts
```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/drizzle/schema";
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
export type DB = typeof db;
```

### 1C. FILE: /drizzle.config.ts
```typescript
import type { Config } from "drizzle-kit";
export default {
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config;
```

### 1D. DATABASE MIGRATION
```bash
npx drizzle-kit push
```

---

## PART 2 — BACKEND LAYER

### 2A. FILE: /lib/auth.ts
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: schema.users, session: schema.sessions },
  }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
});
```

### 2B. FILE: /lib/auth-client.ts
```typescript
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});
export const { signIn, signUp, signOut, useSession } = authClient;
```

### 2C. FILE: /app/api/auth/[...all]/route.ts
```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
export const { GET, POST } = toNextJsHandler(auth);
```

### 2D. FILE: /lib/gemini.ts
```typescript
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export interface Concept { label: string; explanation: string; importance: number; positionX: number; positionY: number; positionZ: number; }
export interface Relationship { source: string; target: string; label: string; strength: number; }
export interface FlashcardData { question: string; answer: string; difficulty: number; }
export interface Suggestion { concept: string; reason: string; }

export async function extractConcepts(text: string): Promise<{ concepts: Concept[]; relationships: Relationship[] }> {
  const prompt = `You are a knowledge graph architect. Extract from this lecture text:\n1. 8-15 key concepts\n2. Relationships between concepts\n3. Importance score 1-10 per concept\n4. One-sentence explanation per concept\n\nReturn ONLY valid JSON:\n{"concepts":[{"label":"string","explanation":"string","importance":number}],"relationships":[{"source":"concept label","target":"concept label","label":"relationship description","strength":number}]}\n\nLecture text: ${text.slice(0, 8000)}`;
  try {
    const raw = (await callGemini(prompt)).trim();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const concepts: Concept[] = parsed.concepts.map((c: any) => ({
      ...c, positionX: (Math.random() - 0.5) * 16, positionY: (Math.random() - 0.5) * 16, positionZ: (Math.random() - 0.5) * 16,
    }));
    return { concepts, relationships: parsed.relationships ?? [] };
  } catch { return { concepts: [], relationships: [] }; }
}

export async function generateFlashcards(concept: string, explanation: string): Promise<FlashcardData[]> {
  const prompt = `Generate 2 flashcard question-answer pairs for: "${concept}"\nContext: ${explanation}\nReturn ONLY valid JSON:\n{"flashcards":[{"question":"string","answer":"string","difficulty":number}]}`;
  try {
    const raw = (await callGemini(prompt)).trim();
    return JSON.parse(raw.replace(/```json|```/g, "").trim()).flashcards ?? [];
  } catch { return []; }
}

export async function getSuggestions(scores: Record<string, number>): Promise<Suggestion[]> {
  const prompt = `A student has these concept mastery scores (0-1): ${JSON.stringify(scores)}\nSuggest the 3 weakest concepts to review next and why.\nReturn ONLY valid JSON:\n{"suggestions":[{"concept":"string","reason":"string"}]}`;
  try {
    const raw = (await callGemini(prompt)).trim();
    return JSON.parse(raw.replace(/```json|```/g, "").trim()).suggestions ?? [];
  } catch { return []; }
}
```

### 2E. FILE: /lib/pdf-parser.ts
```typescript
import pdfParse from "pdf-parse";
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  if (!data.text || data.text.trim().length < 50) throw new Error("PDF contains no extractable text.");
  return data.text;
}
```

### 2F. API ROUTES

**POST /app/api/documents/upload/route.ts** — Accept PDF FormData, extract text, save document to DB
**GET /app/api/documents/route.ts** — List current user's documents
**POST /app/api/process/[documentId]/route.ts** — Extract concepts via Gemini, save nodes/edges/flashcards
**GET /app/api/graph/[documentId]/route.ts** — Return nodes + edges for document
**GET /app/api/graph/[documentId]/personalised/route.ts** — Nodes enriched with progress, sorted weakest first
**GET /app/api/flashcards/[documentId]/route.ts** — Flashcards sorted by memory strength
**POST /app/api/flashcards/[id]/answer/route.ts** — Track answer, recalculate memoryStrength with decay
**GET /app/api/progress/[documentId]/route.ts** — User progress for document
**POST /app/api/progress/node/[nodeId]/route.ts** — Track node visit time
**GET /app/api/progress/summary/route.ts** — AI-powered learning suggestions

> See implementation_plan.md for complete route implementations.

---

## PART 3 — FRONTEND LAYER

### Key Files:
- `/app/layout.tsx` — Root layout with Space Grotesk, Inter, Fira Code fonts
- `/app/globals.css` — CSS variables, grid overlay, font assignments
- `/next.config.js` — serverComponentsExternalPackages: ["pdf-parse"]
- `/components/layout/Sidebar.tsx` — Glassmorphism nav with glowing active indicator
- `/app/(dashboard)/layout.tsx` — Sidebar + main content layout
- `/app/(dashboard)/page.tsx` — Dashboard with document grid, upload CTA
- `/components/ui/DocumentCard.tsx` — Card with mastery ring SVG, hover glow
- `/app/upload/page.tsx` — Drag-drop zone, 4-step processing status
- `/components/3d/KnowledgeUniverse.tsx` — R3F Canvas, Stars, OrbitControls
- `/components/3d/ConceptNode.tsx` — Sphere with memory-based glow color, hover scale
- `/components/3d/ConceptEdge.tsx` — Cyan Line between nodes
- `/app/universe/[documentId]/page.tsx` — Full-screen 3D universe with floating UI
- `/components/ui/NodeDetailPanel.tsx` — Slide-in panel with memory bar
- `/app/(auth)/login/page.tsx` — Dark glassmorphism login
- `/app/(auth)/signup/page.tsx` — Dark glassmorphism signup

> See implementation_plan.md for complete component source code.

---

## ENVIRONMENT VARIABLES

```bash
DATABASE_URL="postgresql://..."
GEMINI_API_KEY="AIza..."
BETTER_AUTH_SECRET="your-32-char-random-secret-here-ok"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## DEPENDENCY INSTALL COMMANDS

```bash
npx create-next-app@latest mnemo --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd mnemo
npm install framer-motion @react-three/fiber @react-three/drei three @types/three drizzle-orm @neondatabase/serverless drizzle-kit better-auth pdf-parse @google/generative-ai lucide-react class-variance-authority clsx tailwind-merge
npx shadcn@latest init
npx shadcn@latest add button card dialog input label progress badge tabs toast separator avatar dropdown-menu
npx drizzle-kit push
npm run dev
```

---

## KNOWN ERRORS & FIXES

| Error | Fix |
|---|---|
| R3F canvas not rendering | Use `style={{width:'100vw',height:'100vh'}}` not className |
| Gemini API returning non-JSON | `.trim()` before `JSON.parse`, try-catch, return `[]` |
| pdf-parse failing | `Buffer.from(await file.arrayBuffer())`, check Content-Type |
| Drizzle relations not resolving | Use `db.select().from(table).where()` pattern |
| Better Auth session missing | `auth.api.getSession({ headers: request.headers })` |
| 3D nodes overlapping | Increase position range to `[-8,8]` in extractConcepts |
| Framer Motion hydration mismatch | Add `'use client'` at top of animated component files |
| Vercel build failing on pdf-parse | `experimental: { serverComponentsExternalPackages: ['pdf-parse'] }` |
| KnowledgeUniverse SSR error | `dynamic(..., { ssr: false })` |
| Three.js types missing | `npm install @types/three` |

---

## BUILD EXECUTION ORDER

**Phase 1 — Foundation** → Create project, install deps, folder structure, fonts, CSS vars

**Phase 2 — Database + Auth** → schema.ts, db.ts, auth.ts, auth-client.ts, auth route, drizzle-kit push

**Phase 3 — AI + Backend APIs** → gemini.ts, pdf-parser.ts, all API routes

**Phase 4 — UI Foundation** → globals.css, layout.tsx, Sidebar, Dashboard, DocumentCard, Auth pages, Upload

**Phase 5 — 3D Universe (most important)** → KnowledgeUniverse, ConceptNode, ConceptEdge, Universe page, NodeDetailPanel

**Phase 6 — Flashcards + Progress** → FlashCard, flashcards page, progress page

**Phase 7 — Polish + Deploy** → Memory decay, loading skeletons, error states, responsive, vercel --prod

---

**END OF MASTER DOCUMENT — Mnemo is built to win.**
