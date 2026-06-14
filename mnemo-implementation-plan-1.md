# MNEMO — COMPLETE IMPLEMENTATION PLAN
### "Your lectures, remembered forever."
**For Antigravity: Read this document fully before executing. Every decision is already made. Execute phases in order. Do not deviate from the stack or schema defined here.**

---

## PROJECT VISION

**Problem:** Students lose 70% of lecture content within 24 hours because passive reading creates no lasting memory structure.

**Solution:** Mnemo transforms any lecture PDF or text into a hyper-personalised 3D memory universe — with AI-generated spatial mind maps, concept node navigation, smart flashcards, and a learning path tuned to how the individual user thinks and retains information.

**The above-and-beyond angle:** Every other team will build a quiz app or a summariser. Mnemo is the only project in the room where judges can upload their own content and watch it explode into a living, navigable 3D knowledge graph in real time. That is the demo moment that wins.

**Judge-stopper features (no other team will have these):**
1. 3D Knowledge Universe — React Three Fiber graph where concepts are glowing nodes, relationships are visible beams, and the user flies through their own lecture content
2. Hyper-Personalisation Engine — Mnemo tracks which nodes you've visited, how long you spent, what you struggled with, and reorders your learning path accordingly using Gemini AI
3. Live Concept Expansion — click any node in the 3D graph, it pulses open into a full explanation, examples, and a generated flashcard — all from Gemini Flash, free
4. Memory Strength Visualisation — nodes glow brighter as you review them, fade as memory decays, creating a living visual of what you know vs what you're forgetting
5. Spatial Recall Mode — instead of a list of flashcards, you navigate the 3D space to find and answer cards — spatial memory is proven to improve retention by 40%

---

## LOCKED TECH STACK
**No decisions left open. Antigravity uses exactly this.**

| Layer | Technology | Version | Why |
|---|---|---|---|
| Framework | Next.js | 14 (App Router) | File-based routing, server components, zero config |
| Language | TypeScript | Latest | Type safety end-to-end, catches errors before runtime |
| Styling | Tailwind CSS | 3.4 | Fastest path to polished UI |
| Components | shadcn/ui | Latest | Production-grade base components |
| Animation | Framer Motion | 11 | Spring physics, AnimatePresence for all transitions |
| 3D Engine | React Three Fiber + @react-three/drei | Latest | 3D knowledge graph — the core wow feature |
| AI — Text & Structure | Google Gemini 1.5 Flash API | Free tier | Concept extraction, flashcard generation, explanations |
| AI — Embeddings | Google Gemini Embedding API | Free tier | Semantic similarity for personalisation |
| Database | Neon Postgres | Free tier (512MB) | Serverless Postgres, instant setup |
| ORM | Drizzle ORM | Latest | Type-safe schema-first, matches our schema exactly |
| Auth | Better Auth | Latest | Production-grade, open source, no cost |
| File Parsing | pdf-parse | Latest | Extract text from uploaded PDFs server-side |
| Hosting | Vercel | Free tier | One command deploy, automatic HTTPS |

**Total cost: ₹0**

---

## VISUAL DESIGN SYSTEM
**Antigravity applies this to every component it builds.**

### Colour Palette
```
Background Primary:    #050510  (deep space navy — not plain black)
Background Secondary:  #0A0A1F  (card surfaces)
Background Tertiary:   #0F0F2E  (elevated surfaces, modals)
Accent Primary:        #6C63FF  (electric violet — brand colour)
Accent Secondary:      #00D4FF  (cyan — for connections and beams)
Accent Glow:           #A78BFA  (soft violet glow on hover)
Node Colours:          #FF6B6B (weak memory), #FFD93D (medium), #6BCB77 (strong)
Text Primary:          #F0F0FF  (near white with violet tint)
Text Secondary:        #8888AA  (muted, for labels)
Border:                #1E1E3F  (subtle, barely visible)
```

### Typography
```
Display Font:   'Space Grotesk' — geometric, technical, premium feel
Body Font:      'Inter' — clean, readable, neutral
Mono Font:      'Fira Code' — for concept tags and code-like labels
Import via Google Fonts — free, no cost
```

### Motion System
```
All page transitions:     Framer Motion layoutId shared element transitions
Card entrances:           staggerChildren 0.08s, y: 20 → 0, opacity 0 → 1
3D node hover:            scale 1 → 1.15, emissive intensity increase
Modal open:               spring { stiffness: 300, damping: 30 }
Node expansion:           AnimatePresence with scale + opacity
Button hover:             subtle translateY(-2px), box-shadow intensify
```

### Signature Design Element
**The Memory Decay Glow System** — every concept node in the 3D space has a coloured glow that shifts from green (strong memory) to yellow (fading) to red (forgotten) based on time since last review and quiz performance. This is the single most memorable visual judges will see — a literal visualisation of memory itself.

---

## COMPLETE DATA SCHEMA
**Antigravity creates this exactly. All other code references these tables.**

```typescript
// drizzle/schema.ts — COMPLETE SCHEMA, DO NOT MODIFY STRUCTURE

import { pgTable, uuid, text, timestamp, boolean, integer, real, jsonb } from "drizzle-orm/pg-core";

// USERS TABLE
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatar: text("avatar"),
  learningStyle: text("learning_style").default("visual"), // visual | auditory | reading
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SESSIONS TABLE (Better Auth managed)
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// DOCUMENTS TABLE (uploaded lectures)
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  rawText: text("raw_text").notNull(),         // extracted PDF text
  summary: text("summary"),                    // Gemini-generated summary
  subject: text("subject"),                    // auto-detected subject
  totalNodes: integer("total_nodes").default(0),
  masteryScore: real("mastery_score").default(0), // 0–100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CONCEPT NODES TABLE (3D graph nodes)
export const conceptNodes = pgTable("concept_nodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  label: text("label").notNull(),              // concept name e.g. "Photosynthesis"
  explanation: text("explanation").notNull(),  // Gemini-generated explanation
  importance: integer("importance").default(5), // 1–10, affects node size in 3D
  positionX: real("position_x").notNull(),     // 3D coordinates
  positionY: real("position_y").notNull(),
  positionZ: real("position_z").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// CONCEPT EDGES TABLE (3D graph connections)
export const conceptEdges = pgTable("concept_edges", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  sourceNodeId: uuid("source_node_id").references(() => conceptNodes.id, { onDelete: "cascade" }).notNull(),
  targetNodeId: uuid("target_node_id").references(() => conceptNodes.id, { onDelete: "cascade" }).notNull(),
  relationshipLabel: text("relationship_label"), // e.g. "leads to", "requires", "contrasts with"
  strength: real("strength").default(1.0),      // connection strength, affects beam thickness
});

// FLASHCARDS TABLE
export const flashcards = pgTable("flashcards", {
  id: uuid("id").primaryKey().defaultRandom(),
  nodeId: uuid("node_id").references(() => conceptNodes.id, { onDelete: "cascade" }).notNull(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  difficulty: integer("difficulty").default(3), // 1–5
  createdAt: timestamp("created_at").defaultNow(),
});

// USER PROGRESS TABLE (personalisation engine)
export const userProgress = pgTable("user_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  nodeId: uuid("node_id").references(() => conceptNodes.id, { onDelete: "cascade" }).notNull(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  visitCount: integer("visit_count").default(0),
  timeSpentSeconds: integer("time_spent_seconds").default(0),
  memoryStrength: real("memory_strength").default(0.5), // 0–1, drives glow colour
  lastReviewedAt: timestamp("last_reviewed_at"),
  correctAnswers: integer("correct_answers").default(0),
  totalAttempts: integer("total_attempts").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// QUIZ SESSIONS TABLE
export const quizSessions = pgTable("quiz_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  score: integer("score").default(0),
  totalQuestions: integer("total_questions").default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// INDEXES — defined before any queries run
// CREATE INDEX idx_documents_user ON documents(user_id);
// CREATE INDEX idx_nodes_document ON concept_nodes(document_id);
// CREATE INDEX idx_edges_document ON concept_edges(document_id);
// CREATE INDEX idx_progress_user_node ON user_progress(user_id, node_id);
// CREATE INDEX idx_flashcards_node ON flashcards(node_id);
// CREATE INDEX idx_flashcards_user ON flashcards(user_id);
```

---

## COMPLETE API CONTRACT
**Every endpoint typed. Antigravity implements all of these.**

```
AUTH ENDPOINTS (Better Auth handles internally):
POST   /api/auth/sign-up        { name, email, password } → { user, session }
POST   /api/auth/sign-in        { email, password } → { user, session }
POST   /api/auth/sign-out       {} → { success }
GET    /api/auth/session        → { user | null }

DOCUMENT ENDPOINTS:
POST   /api/documents/upload    FormData { file: PDF, title: string } → Document
GET    /api/documents           → Document[]  (current user only)
GET    /api/documents/:id       → Document + ConceptNodes + ConceptEdges
DELETE /api/documents/:id       → { success }

AI PROCESSING ENDPOINTS:
POST   /api/process/:documentId → triggers Gemini processing, returns { nodes, edges, flashcards }
GET    /api/process/:documentId/status → { status: "pending"|"processing"|"complete"|"error" }

GRAPH ENDPOINTS:
GET    /api/graph/:documentId   → { nodes: ConceptNode[], edges: ConceptEdge[] }
GET    /api/graph/:documentId/personalised → nodes reordered by user memory strength

FLASHCARD ENDPOINTS:
GET    /api/flashcards/:documentId → Flashcard[]
POST   /api/flashcards/:id/answer  { correct: boolean, timeSpent: number } → updated UserProgress

PROGRESS ENDPOINTS:
GET    /api/progress/:documentId   → UserProgress[] for all nodes
POST   /api/progress/node/:nodeId  { timeSpent: number } → updated UserProgress
GET    /api/progress/summary       → { masteryScore, weakNodes, strongNodes, suggestedNext }

USER ENDPOINTS:
GET    /api/user/profile          → User + stats
PATCH  /api/user/preferences      { learningStyle } → updated User
```

---

## COMPONENT ARCHITECTURE
**Visual treatment specified per component. Antigravity applies exactly this.**

```
app/
├── (auth)/
│   ├── login/page.tsx          — Dark glassmorphism card, Space Grotesk headline,
│   │                             violet accent inputs, Framer entrance animation
│   └── signup/page.tsx         — Same treatment, 3-field form, no clutter
│
├── (dashboard)/
│   ├── layout.tsx              — Sidebar nav with glowing active indicator,
│   │                             document list, user avatar, Space Grotesk labels
│   └── page.tsx                — Dashboard home: upload CTA hero + document grid
│
├── upload/page.tsx             — Drag-and-drop zone with animated border,
│                                 progress bar with Framer animation,
│                                 live status: "Extracting → Mapping → Done"
│
├── universe/[documentId]/
│   └── page.tsx                — MAIN EXPERIENCE: full-screen R3F canvas (3D graph)
│                                 + floating overlay panel for node details
│
├── flashcards/[documentId]/
│   └── page.tsx                — Spatial card flip UI, memory strength indicator,
│                                 progress ring, Framer card flip animation
│
└── progress/[documentId]/
    └── page.tsx                — Mastery dashboard: node grid with glow colours,
                                  time-spent chart, suggested review nodes

components/
├── 3d/
│   ├── KnowledgeUniverse.tsx   — R3F Canvas wrapper, camera controls, starfield bg
│   ├── ConceptNode.tsx         — Sphere mesh, emissive glow by memory strength,
│   │                             scale on hover, click handler
│   ├── ConceptEdge.tsx         — Line/tube between nodes, animated dash flow,
│   │                             colour by relationship strength
│   └── NodeLabel.tsx           — Html overlay from @react-three/drei, Space Grotesk
│
├── ui/
│   ├── DocumentCard.tsx        — shadcn card + Aceternity hover border gradient,
│   │                             mastery ring, subject badge, stagger entrance
│   ├── FlashCard.tsx           — 3D CSS flip card, question/answer, difficulty badge
│   ├── MemoryGlow.tsx          — Reusable glow indicator component, colour by strength
│   ├── UploadZone.tsx          — Animated dashed border, drag state, file preview
│   ├── ProcessingStatus.tsx    — Step indicator: Extract → Map → Generate → Done
│   └── NodeDetailPanel.tsx     — Slide-in panel from right, concept explanation,
│                                 flashcard preview, time spent, memory strength
│
└── layout/
    ├── Sidebar.tsx             — Document list, nav links, user info, dark glassmorphism
    └── PageTransition.tsx      — Framer Motion wrapper for all page transitions
```

---

## GEMINI AI INTEGRATION
**Antigravity implements this exactly. Free API, no cost.**

```typescript
// lib/gemini.ts — THREE FUNCTIONS ANTIGRAVITY IMPLEMENTS

// 1. EXTRACT CONCEPTS FROM LECTURE TEXT
// Input: raw lecture text
// Output: structured JSON of concepts + relationships
const EXTRACT_PROMPT = `
You are a knowledge graph architect. Given lecture text, extract:
1. 8-15 key concepts (single words or short phrases)
2. Relationships between concepts
3. Importance score 1-10 for each concept
4. One-sentence explanation for each concept

Return ONLY valid JSON in this exact structure:
{
  "concepts": [
    { "label": "string", "explanation": "string", "importance": number }
  ],
  "relationships": [
    { "source": "concept label", "target": "concept label", "label": "relationship description", "strength": number 0-1 }
  ]
}
Lecture text: {TEXT}
`;

// 2. GENERATE FLASHCARDS FOR A CONCEPT
const FLASHCARD_PROMPT = `
Generate 2 flashcard question-answer pairs for the concept: "{CONCEPT}"
Context: {EXPLANATION}
Return ONLY valid JSON:
{ "flashcards": [{ "question": "string", "answer": "string", "difficulty": number 1-5 }] }
`;

// 3. PERSONALISED LEARNING SUGGESTION
const SUGGESTION_PROMPT = `
A student has these concept mastery scores (0-1): {SCORES}
Suggest the 3 weakest concepts they should review next and why.
Return ONLY valid JSON:
{ "suggestions": [{ "concept": "string", "reason": "string" }] }
`;

// API CALL PATTERN — use this for all Gemini calls:
// Model: gemini-1.5-flash (free tier)
// Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
// Auth: ?key=GEMINI_API_KEY (env variable)
```

---

## ENVIRONMENT VARIABLES
**Antigravity creates .env.local with these. User fills in values.**

```bash
# .env.local

# Neon Postgres — get from neon.tech free signup
DATABASE_URL="postgresql://..."

# Gemini API — get from aistudio.google.com free signup  
GEMINI_API_KEY="AIza..."

# Better Auth — generate any random 32-char string
BETTER_AUTH_SECRET="your-random-secret-here"
BETTER_AUTH_URL="http://localhost:3000"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
```

---

## PHASE-BY-PHASE EXECUTION PLAN

---

### PHASE 1 — PROJECT FOUNDATION
**Antigravity executes this entire phase before moving to Phase 2.**

```
ANTIGRAVITY PROMPT — PHASE 1:

You are building Mnemo, a 3D spatial learning platform. Execute Phase 1 exactly:

1. Initialise a Next.js 14 project with TypeScript and App Router. Command: npx create-next-app@latest mnemo --typescript --tailwind --app --no-src-dir --import-alias "@/*"

2. Install all dependencies in one command:
npm install framer-motion @react-three/fiber @react-three/drei three drizzle-orm @neondatabase/serverless drizzle-kit better-auth pdf-parse @google/generative-ai lucide-react class-variance-authority clsx tailwind-merge

3. Install shadcn/ui: npx shadcn@latest init (choose dark theme, slate base colour, yes to CSS variables)

4. Install these shadcn components: npx shadcn@latest add button card dialog input label progress badge tabs toast separator avatar dropdown-menu

5. Create the folder structure:
/app/(auth)/login
/app/(auth)/signup
/app/(dashboard)
/app/upload
/app/universe/[documentId]
/app/flashcards/[documentId]
/app/progress/[documentId]
/components/3d
/components/ui
/components/layout
/lib
/drizzle
/server

6. Add Google Fonts to app/layout.tsx: import Space Grotesk (weights 400,500,600,700) and Inter (weights 400,500) and Fira Code (weight 400) from next/font/google

7. Set up global CSS variables in app/globals.css:
--background: #050510
--background-secondary: #0A0A1F
--background-tertiary: #0F0F2E
--accent-primary: #6C63FF
--accent-secondary: #00D4FF
--accent-glow: #A78BFA
--text-primary: #F0F0FF
--text-secondary: #8888AA
--border: #1E1E3F

8. Create .env.local with the environment variable keys shown in the implementation plan (leave values as placeholders)

9. Create drizzle.config.ts pointing to /drizzle/schema.ts with dialect: "postgresql"

Confirm Phase 1 complete by showing the folder structure.
```

---

### PHASE 2 — DATABASE & AUTH
**Antigravity executes this after Phase 1 is confirmed complete.**

```
ANTIGRAVITY PROMPT — PHASE 2:

Phase 1 is complete. Execute Phase 2 — Database and Auth:

1. Create /drizzle/schema.ts with the COMPLETE schema from the implementation plan:
- users table (id, name, email, passwordHash, avatar, learningStyle, createdAt, updatedAt)
- sessions table (id, userId→users.id cascade, token unique, expiresAt, createdAt)
- documents table (id, userId→users.id cascade, title, rawText, summary, subject, totalNodes, masteryScore, createdAt, updatedAt)
- conceptNodes table (id, documentId→documents.id cascade, label, explanation, importance, positionX, positionY, positionZ, createdAt)
- conceptEdges table (id, documentId→documents.id cascade, sourceNodeId→conceptNodes.id cascade, targetNodeId→conceptNodes.id cascade, relationshipLabel, strength)
- flashcards table (id, nodeId→conceptNodes.id cascade, documentId→documents.id cascade, userId→users.id cascade, question, answer, difficulty, createdAt)
- userProgress table (id, userId→users.id cascade, nodeId→conceptNodes.id cascade, documentId→documents.id cascade, visitCount, timeSpentSeconds, memoryStrength, lastReviewedAt, correctAnswers, totalAttempts, updatedAt)
- quizSessions table (id, userId→users.id cascade, documentId→documents.id cascade, score, totalQuestions, completedAt, createdAt)

2. Create /lib/db.ts:
- Import neon from @neondatabase/serverless
- Import drizzle from drizzle-orm/neon-http
- Export db instance using DATABASE_URL env variable

3. Set up Better Auth in /lib/auth.ts:
- Import betterAuth from better-auth
- Use drizzle adapter with our db instance
- Enable emailAndPassword provider
- Export auth instance

4. Create /app/api/auth/[...all]/route.ts that handles all Better Auth routes

5. Create /lib/auth-client.ts exporting createAuthClient() for client-side use

6. Run: npx drizzle-kit push to create all tables in Neon

Confirm Phase 2 complete by showing successful drizzle-kit push output.
```

---

### PHASE 3 — AI PROCESSING ENGINE
**Antigravity executes this after Phase 2 is confirmed complete.**

```
ANTIGRAVITY PROMPT — PHASE 3:

Phase 2 complete. Execute Phase 3 — AI Processing Engine:

1. Create /lib/gemini.ts with three exported async functions:

extractConcepts(text: string): Promise<{concepts: Concept[], relationships: Relationship[]}>
- Call Gemini 1.5 Flash API with the extraction prompt from the implementation plan
- Parse JSON response
- Generate random 3D positions for each concept: x,y,z each random between -5 and 5
- Return typed result

generateFlashcards(concept: string, explanation: string): Promise<Flashcard[]>
- Call Gemini 1.5 Flash with the flashcard prompt
- Return array of flashcard objects

getSuggestions(scores: Record<string, number>): Promise<Suggestion[]>
- Call Gemini 1.5 Flash with the suggestion prompt
- Return array of suggestion objects

All functions handle API errors gracefully and return empty arrays on failure.

2. Create /lib/pdf-parser.ts:
- Import pdf-parse
- Export async function extractTextFromPDF(buffer: Buffer): Promise<string>
- Returns extracted text, throws on failure

3. Create /app/api/documents/upload/route.ts:
- Accept POST with FormData containing file and title
- Validate session using Better Auth
- Extract text using pdf-parser
- Save document to DB with rawText
- Return document object with id

4. Create /app/api/process/[documentId]/route.ts (POST):
- Validate session
- Fetch document rawText from DB
- Call extractConcepts(rawText)
- Save all concept nodes to DB with 3D positions
- Save all concept edges to DB
- For each node, call generateFlashcards and save to DB
- Update document totalNodes count
- Return { success: true, nodeCount, edgeCount, flashcardCount }

5. Create /app/api/graph/[documentId]/route.ts (GET):
- Validate session
- Return all nodes and edges for documentId

6. Create /app/api/progress/node/[nodeId]/route.ts (POST):
- Accept { timeSpent: number }
- Upsert userProgress record
- Calculate memoryStrength: increases with visits and correct answers, decays over time
- Return updated progress

Confirm Phase 3 complete by showing all created files.
```

---

### PHASE 4 — CORE UI PAGES
**Antigravity executes this after Phase 3 is confirmed complete.**

```
ANTIGRAVITY PROMPT — PHASE 4:

Phase 3 complete. Execute Phase 4 — Core UI Pages.

DESIGN SYSTEM TO APPLY EVERYWHERE:
- Background: #050510, cards: #0A0A1F, elevated: #0F0F2E
- Accent violet: #6C63FF, cyan: #00D4FF
- Font: Space Grotesk for headings, Inter for body
- All entrance animations: Framer Motion, y:20→0 opacity:0→1, duration 0.4s
- All buttons: violet background, white text, subtle hover glow shadow

1. Create /components/layout/Sidebar.tsx:
- Dark glassmorphism panel (backdrop-blur, border #1E1E3F)
- Mnemo logo in Space Grotesk bold violet
- Nav links: Dashboard, Upload, Progress
- Active link: violet left border glow indicator
- Bottom: user avatar + name + sign out button
- Framer Motion: slide in from left on mount

2. Create /app/(dashboard)/layout.tsx:
- Sidebar left, main content right
- Main content scrollable, bg #050510

3. Create /app/(dashboard)/page.tsx (Dashboard):
- Hero section: "Your Knowledge Universe" in Space Grotesk 48px
- Upload CTA card with dashed border animated gradient
- Grid of DocumentCard components (fetch from /api/documents)
- Empty state: illustration + "Upload your first lecture" CTA

4. Create /components/ui/DocumentCard.tsx:
- Card bg #0A0A1F, border #1E1E3F
- Hover: border colour shifts to #6C63FF with glow
- Document title in Space Grotesk
- Subject badge in cyan
- Mastery score ring (SVG circle, fill by percentage)
- "Open Universe" button → links to /universe/[id]
- Framer Motion: stagger entrance with parent staggerChildren 0.08s

5. Create /app/(auth)/login/page.tsx and /app/(auth)/signup/page.tsx:
- Full page dark bg #050510
- Centered card bg #0A0A1F, border #1E1E3F, border-radius 16px
- Space Grotesk "Welcome to Mnemo" headline
- shadcn Input components with violet focus ring
- Submit button full width, violet, Framer hover animation
- Link between login/signup
- Better Auth client for form submission

6. Create /app/upload/page.tsx:
- Upload zone: dashed border, animated gradient on drag-over
- Accept PDF files only
- On file select: show filename, size, start button
- On submit: POST to /api/documents/upload then POST to /api/process/[id]
- ProcessingStatus component showing 4 steps: Extracting Text → Mapping Concepts → Generating Flashcards → Complete
- Each step animates in with checkmark on completion
- On complete: redirect to /universe/[documentId]

Confirm Phase 4 complete by showing all created files and components.
```

---

### PHASE 5 — 3D KNOWLEDGE UNIVERSE
**This is the judge-stopper feature. Antigravity executes this with full precision.**

```
ANTIGRAVITY PROMPT — PHASE 5:

Phase 4 complete. Execute Phase 5 — The 3D Knowledge Universe. This is the core feature of Mnemo.

1. Create /components/3d/KnowledgeUniverse.tsx:
- Import Canvas from @react-three/fiber
- Import OrbitControls, Stars from @react-three/drei
- Canvas: full screen (width 100vw, height 100vh), camera position [0,0,15]
- Background: Stars component (count=3000, depth=50, fade) for space feel
- Ambient light intensity 0.3, point light at [10,10,10] intensity 0.8, colour #6C63FF
- OrbitControls: enableDamping, dampingFactor 0.05, maxDistance 30
- Render all ConceptNode and ConceptEdge components
- Accept props: nodes, edges, userProgress, onNodeClick

2. Create /components/3d/ConceptNode.tsx:
- Import useFrame, useThree from @react-three/fiber
- Sphere geometry radius based on node importance (importance/10 * 0.8 + 0.3)
- Material: MeshStandardMaterial with emissive colour based on memoryStrength:
  0.0-0.3 → emissive #FF6B6B (forgotten, red glow)
  0.3-0.6 → emissive #FFD93D (fading, yellow glow)
  0.6-1.0 → emissive #6BCB77 (strong, green glow)
- emissiveIntensity: 0.4 normally, 1.2 on hover
- On hover: scale 1.15 with useSpring from @react-spring/three
- On click: call onNodeClick(node)
- Html overlay from @react-three/drei showing node label in Space Grotesk

3. Create /components/3d/ConceptEdge.tsx:
- Import Line from @react-three/drei
- Draw line between source and target node positions
- Colour: #00D4FF (cyan) with opacity based on edge strength
- Animated dash using dashOffset useFrame for flowing effect

4. Create /app/universe/[documentId]/page.tsx:
- Fetch graph data from /api/graph/[documentId]
- Fetch user progress from /api/progress/[documentId]
- Full screen layout, no padding
- Render KnowledgeUniverse component
- Floating top bar (glassmorphism): document title, back button, flashcard button
- NodeDetailPanel slides in from right when node is clicked

5. Create /components/ui/NodeDetailPanel.tsx:
- Fixed panel, right side, width 380px
- Framer Motion: x: 400→0 slide in animation
- Shows: concept label (Space Grotesk 24px), explanation text, memory strength bar
- Memory strength bar: gradient from red to green, fills by percentage
- "Practice Flashcard" button → opens flashcard for this specific node
- Time spent counter
- Close button

Confirm Phase 5 complete. This is the most important phase.
```

---

### PHASE 6 — FLASHCARDS & PROGRESS
**Antigravity executes this after Phase 5 is confirmed complete.**

```
ANTIGRAVITY PROMPT — PHASE 6:

Phase 5 complete. Execute Phase 6 — Flashcards and Progress System:

1. Create /components/ui/FlashCard.tsx:
- CSS 3D flip card (perspective 1000px, rotateY on flip)
- Front: question text in Space Grotesk, question mark icon, difficulty badge
- Back: answer text, correct/incorrect buttons
- Framer Motion rotateY animation for flip
- Correct button: green, Incorrect: red
- On answer: POST to /api/flashcards/:id/answer with { correct, timeSpent }

2. Create /app/flashcards/[documentId]/page.tsx:
- Fetch all flashcards for document
- Sort by memoryStrength (weakest first — personalisation)
- Show current card with FlashCard component
- Progress bar: cards completed / total
- Skip button, shuffle button
- Session summary on completion: score, time taken, nodes improved
- Framer AnimatePresence for card transitions (swipe out left/right)

3. Create /app/progress/[documentId]/page.tsx:
- Page title: document name + overall mastery percentage
- Mastery ring: large SVG circle, percentage fill in violet
- Concept grid: all nodes shown as small cards
- Each card: concept name, memory strength glow colour, last reviewed time
- Colour coding: red (needs review), yellow (fading), green (strong)
- "Weakest Concepts" section: top 3 nodes with lowest memoryStrength
- "Study Suggestion" section: call /api/progress/summary, show Gemini suggestions
- Framer Motion: stagger grid entrance

4. Create /app/api/flashcards/[id]/answer/route.ts:
- Accept POST { correct: boolean, timeSpent: number }
- Update userProgress: increment visitCount, timeSpent, correctAnswers, totalAttempts
- Recalculate memoryStrength:
  base = correctAnswers / totalAttempts
  recency boost = decay function based on daysSinceReview
  final = base * 0.7 + recency * 0.3
- Return updated progress

5. Create /app/api/progress/[documentId]/route.ts:
- Return all userProgress records for documentId + userId
- Include node labels for display

6. Create /app/api/progress/summary/route.ts:
- Fetch all progress for user
- Build scores object: { conceptLabel: memoryStrength }
- Call getSuggestions(scores) from gemini.ts
- Return suggestions array

Confirm Phase 6 complete.
```

---

### PHASE 7 — POLISH, PERSONALISATION & DEPLOY
**Final phase. This is what takes Mnemo from good to Porsche-level.**

```
ANTIGRAVITY PROMPT — PHASE 7:

Phase 6 complete. Execute Phase 7 — Polish, Personalisation and Deploy:

1. PERSONALISATION ENGINE:
- Update /app/api/graph/[documentId]/personalised/route.ts:
  Fetch nodes + user progress
  Sort nodes: lowest memoryStrength first
  Return reordered nodes with progress data merged
- In KnowledgeUniverse: add "Personalised View" toggle button
  When on: nodes float toward camera in order of review priority
  Weak nodes (red) pulse with subtle animation to draw attention

2. MEMORY DECAY SYSTEM:
- In /app/api/flashcards/[id]/answer/route.ts add decay:
  If lastReviewedAt > 24 hours ago: memoryStrength *= 0.95
  If lastReviewedAt > 72 hours ago: memoryStrength *= 0.85
  If lastReviewedAt > 7 days ago: memoryStrength *= 0.70
- This makes the glow colours shift dynamically over time

3. ONBOARDING FLOW:
- Create /app/onboarding/page.tsx for new users after signup:
  Step 1: "How do you learn best?" — Visual / Reading / Mixed (3 cards with icons)
  Step 2: "Upload your first lecture" — direct to upload
  Framer Motion page transitions between steps
  Save learningStyle to user profile

4. LOADING STATES — add to every async operation:
- Skeleton loaders for DocumentCard grid (shadcn Skeleton)
- Spinner overlay on 3D canvas while graph loads
- Optimistic UI on flashcard answers (don't wait for API)

5. ERROR STATES — add to every component:
- Upload fail: show error message with retry button
- AI processing fail: show "Try again" with partial results if available
- Network error: toast notification bottom-right

6. RESPONSIVE DESIGN:
- Dashboard: 1-col on mobile, 2-col on tablet, 3-col on desktop
- Sidebar: bottom nav on mobile, side nav on desktop
- Universe page: pinch-to-zoom on mobile via OrbitControls touch support
- Flashcards: swipe left/right gesture support on mobile

7. FINAL VISUAL POLISH:
- Add subtle grid pattern overlay to all page backgrounds (CSS background-image)
- Add violet radial gradient glow behind the 3D canvas
- Ensure all interactive elements have hover states
- Confirm all fonts loading correctly (Space Grotesk, Inter, Fira Code)
- Add favicon: simple violet hexagon SVG

8. DEMO DATA:
- Create /lib/seed.ts with 10 seeded concept nodes for subject "Machine Learning"
- Include edges between nodes and sample flashcards
- Add seed button on dashboard for demo purposes only

9. DEPLOY:
- Run: vercel --prod
- Set all environment variables in Vercel dashboard
- Confirm live URL works end-to-end

Confirm Phase 7 complete and provide the live Vercel URL.
```

---

## JUDGE PITCH SCRIPT
**Memorise this. Deliver in under 90 seconds.**

```
"Most students forget 70% of their lectures within 24 hours.
Not because they're not trying — but because reading is passive.

Mnemo changes how memory works.

Watch this — I'll upload a lecture PDF right now.
[UPLOAD — 10 seconds]

Mnemo's AI reads the entire lecture, extracts every key concept,
maps the relationships between them, and builds this —
[SHOW 3D UNIVERSE — pause for reaction]

A living 3D universe of knowledge. Every node is a concept.
Every beam is a connection. And every colour tells you
how well you remember it right now.

Click a node — you get an instant explanation and a flashcard.
Review it — the node glows brighter.
Forget it — it fades back to red. Your memory, visualised.

And Mnemo personalises this for you — tracking what you struggle with
and surfacing those concepts first, every time.

This isn't a study tool. It's a memory system.
Built on proven spatial learning research.
Completely free. Works on any subject."
```

---

## COMMON ERRORS & FIXES
**Antigravity references this if it hits issues.**

```
ERROR: R3F canvas not rendering
FIX: Ensure Canvas has explicit width/height style, not just className. Use style={{width:'100vw',height:'100vh'}}

ERROR: Gemini API returning non-JSON
FIX: Add response.trim() before JSON.parse. Wrap in try-catch, return empty array on failure.

ERROR: pdf-parse failing on some PDFs
FIX: Use buffer directly from file.arrayBuffer(). Ensure Content-Type check before parsing.

ERROR: Drizzle relations not resolving
FIX: Always use db.select().from(table).where() pattern. Avoid relational queries in Phase 1.

ERROR: Better Auth session not available in API routes
FIX: Use auth.api.getSession({ headers: request.headers }) in every protected route.

ERROR: 3D nodes overlapping
FIX: Increase position range from [-5,5] to [-8,8] in gemini.ts extractConcepts function.

ERROR: Framer Motion hydration mismatch
FIX: Wrap animated components in <ClientOnly> or add 'use client' directive at top of file.

ERROR: Vercel build failing on pdf-parse
FIX: Add to next.config.js: experimental: { serverComponentsExternalPackages: ['pdf-parse'] }
```

---

**END OF IMPLEMENTATION PLAN**
**Mnemo — Built to win.**
