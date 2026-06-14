# MNEMO — ENHANCED MASTER BUILD DOCUMENT
### "Your lectures, remembered forever."

**This document extends the base Mnemo implementation plan with four groundbreaking additions:**
1. **ATLAS Mode** — Conversational AI voice interface (Iron Man style)
2. **Spatial Voice Navigation** — Speak commands to fly through your 3D universe
3. **Collaborative Universes** — Real-time multiplayer study sessions
4. **AR Export** — View your knowledge graph overlaid on the real world

**Read this before Antigravity executes anything. Base stack is unchanged. Add only what is here.**

---

## WHY THESE FEATURES WIN

Every other team will have a chat interface. Nobody will have a voice AI that talks back like Atlas, real-time 3D collaboration, or AR export. These are the three demo moments that make judges stop, turn around, and call their colleagues over.

**The demo script with these features:**
> "Watch. I'm going to upload this lecture... [3D universe appears] ...now I'm going to ask Atlas about the weakest node... [voice responds conversationally] ...now I'm going to study this with my friend in real time... [second cursor appears in the 3D space] ...and now I'm going to point my phone at my desk and walk through this knowledge graph in my room."

No team at a college hackathon has ever demoed that sequence. You will be the first.

---

## ADDITION 1 — ATLAS MODE
### Conversational AI Voice Interface

**What it is:** A persistent voice assistant embedded in the 3D universe. The user speaks naturally — "Atlas, which concept am I forgetting?" or "Explain photosynthesis like I'm five" or "Take me to the weakest node" — and Mnemo responds with a synthesised voice and takes action in the 3D space simultaneously.

### FILE: /lib/atlas.ts
```typescript
const ATLAS_SYSTEM_PROMPT = `
You are ATLAS, the AI assistant embedded in Mnemo — a 3D spatial learning platform.

Your personality:
- Speak like a brilliant, warm friend who happens to know everything — not a textbook
- You address the user casually but with precision. Like Tony Stark's JARVIS: efficient, witty, never condescending
- Short responses by default (2-3 sentences). Expand only when asked
- You always know the user's memory state and refer to it: "You've reviewed this twice but your retention is dropping — want to drill it?"
- Use light humour when appropriate: "That node has been sitting at 23% for three days. It's basically waving at you."
- Never say "I cannot" — reframe as "Here's what I can do instead"
- Refer to the 3D graph naturally: "flying over to...", "lighting up the...", "the cluster on your left..."

Available actions you can trigger (return these as JSON alongside your response):
- navigate_to_node: { nodeId: string }
- highlight_nodes: { nodeIds: string[], color: string }
- open_flashcard: { nodeId: string }
- zoom_to_cluster: { nodeIds: string[] }
- start_quiz: { nodeIds: string[] }
- speak_explanation: { text: string }

Always return JSON in this format alongside your spoken response:
{
  "speech": "your conversational response here",
  "action": { "type": "action_name", "payload": { ... } } | null,
  "emotion": "confident" | "encouraging" | "concerned" | "playful"
}

Current knowledge state: {KNOWLEDGE_STATE}
Current document: {DOCUMENT_TITLE}
`;

export interface AtlasResponse {
  speech: string;
  action: { type: string; payload: Record<string, unknown> } | null;
  emotion: "confident" | "encouraging" | "concerned" | "playful";
}

export async function askAtlas(
  userSpeech: string,
  knowledgeState: Record<string, number>,
  documentTitle: string
): Promise<AtlasResponse> {
  const systemPrompt = ATLAS_SYSTEM_PROMPT
    .replace("{KNOWLEDGE_STATE}", JSON.stringify(knowledgeState))
    .replace("{DOCUMENT_TITLE}", documentTitle);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userSpeech }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      }),
    }
  );

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return { speech: "I'm having a moment. Try again.", action: null, emotion: "playful" };
  }
}
```

### FILE: /hooks/useAtlasVoice.ts
```typescript
"use client";
import { useState, useCallback, useRef } from "react";

export function useAtlasVoice(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (e) => { onTranscript(e.results[0][0].transcript); };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, startListening, stopListening };
}
```

### FILE: /lib/speech-synthesis.ts
```typescript
const ATLAS_VOICE_CONFIG = { rate: 0.95, pitch: 0.85, volume: 0.9 };

export function speakAtlas(text: string, emotion: string): void {
  if (typeof window === "undefined") return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.name.includes("Daniel") || v.name.includes("Google UK") || v.name.includes("Microsoft David")
  );
  if (preferred) utterance.voice = preferred;

  utterance.rate = ATLAS_VOICE_CONFIG.rate;
  utterance.pitch = emotion === "playful" ? ATLAS_VOICE_CONFIG.pitch + 0.1 : ATLAS_VOICE_CONFIG.pitch;
  utterance.volume = ATLAS_VOICE_CONFIG.volume;
  window.speechSynthesis.speak(utterance);
}
```

### FILE: /components/ui/AtlasOrb.tsx
```typescript
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";
import { useAtlasVoice } from "@/hooks/useAtlasVoice";
import { askAtlas, AtlasResponse } from "@/lib/atlas";
import { speakAtlas } from "@/lib/speech-synthesis";

interface Props {
  knowledgeState: Record<string, number>;
  documentTitle: string;
  onAction: (action: AtlasResponse["action"]) => void;
}

const EMOTION_COLORS = {
  confident: "#6C63FF", encouraging: "#6BCB77",
  concerned: "#FFD93D", playful: "#00D4FF",
};

export function AtlasOrb({ knowledgeState, documentTitle, onAction }: Props) {
  const [thinking, setThinking] = useState(false);
  const [lastSpeech, setLastSpeech] = useState("Say 'Hey Atlas' to begin.");
  const [emotion, setEmotion] = useState<AtlasResponse["emotion"]>("confident");
  const [transcript, setTranscript] = useState("");

  const handleTranscript = useCallback(async (text: string) => {
    setTranscript(text);
    setThinking(true);
    const response = await askAtlas(text, knowledgeState, documentTitle);
    setLastSpeech(response.speech);
    setEmotion(response.emotion);
    setThinking(false);
    speakAtlas(response.speech, response.emotion);
    if (response.action) onAction(response.action);
  }, [knowledgeState, documentTitle, onAction]);

  const { listening, startListening, stopListening } = useAtlasVoice(handleTranscript);
  const orbColor = EMOTION_COLORS[emotion];

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
      <AnimatePresence>
        {lastSpeech && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-xs p-3 bg-[#0A0A1F]/95 backdrop-blur border border-[#1E1E3F] rounded-2xl rounded-br-sm text-sm text-[#F0F0FF]"
            style={{ borderColor: `${orbColor}40` }}
          >
            {thinking ? (
              <span className="text-[#8888AA] italic">Processing...</span>
            ) : (
              <>
                {transcript && <p className="text-xs text-[#8888AA] mb-1 italic">You: "{transcript}"</p>}
                <p>{lastSpeech}</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={listening ? stopListening : startListening}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-16 h-16 rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${orbColor}60, ${orbColor}20)`,
          boxShadow: listening ? `0 0 0 8px ${orbColor}20, 0 0 40px ${orbColor}60` : `0 0 20px ${orbColor}40`,
          border: `1px solid ${orbColor}60`,
        }}
      >
        {listening && (
          <motion.span className="absolute inset-0 rounded-full" style={{ border: `2px solid ${orbColor}` }}
            animate={{ scale: [1, 1.4], opacity: [0.8, 0] }} transition={{ duration: 1, repeat: Infinity }} />
        )}
        {thinking ? (
          <motion.div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: orbColor }}
                animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
            ))}
          </motion.div>
        ) : listening ? <MicOff size={22} className="text-white" /> : <Mic size={22} className="text-white" />}
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-widest" style={{ color: orbColor }}>ATLAS</span>
      </motion.button>
    </div>
  );
}
```

### Atlas Action Handler (add to UniversePage)
```typescript
const handleAtlasAction = useCallback((action: AtlasResponse["action"]) => {
  if (!action || !graphData) return;
  switch (action.type) {
    case "navigate_to_node": {
      const node = graphData.nodes.find((n) => n.id === action.payload.nodeId);
      if (node) setSelectedNode(node);
      break;
    }
    case "highlight_nodes":
      setHighlightedNodes(action.payload.nodeIds as string[]);
      break;
    case "open_flashcard":
      router.push(`/flashcards/${documentId}?nodeId=${action.payload.nodeId}`);
      break;
    case "zoom_to_cluster":
      cameraRef.current?.zoomToNodes(action.payload.nodeIds as string[]);
      break;
  }
}, [graphData, documentId, router]);
```

### Example Atlas Conversations
```
User: "Atlas, what should I study first?"
Atlas: "Mitochondria has been sitting at 17% for two days. It's basically haunting your graph. Want me to pull up a flashcard?"
       [navigates camera to that node, highlights it red]

User: "Explain the weakest concept simply"
Atlas: "Sure. Think of ATP synthesis like a spinning turbine at a dam — water pressure is the proton gradient, the turbine is ATP synthase, and electricity is your ATP."
       [highlights ATP synthesis node, pulses it gently]

User: "How am I doing overall?"
Atlas: "Honestly? Six out of twelve nodes are above 70%. The bottom four are pulling your mastery score down. Want to blitz through them now?"
```

---

## ADDITION 2 — COLLABORATIVE UNIVERSES
### Real-Time Multiplayer Study Sessions

**What it is:** Two or more users can enter the same 3D knowledge universe simultaneously. Each user is represented as a glowing cursor/avatar. When one user clicks a node, all users see it highlighted. A live chat panel floats over the 3D space.

**Implementation using Supabase Realtime (free tier — 500 concurrent connections).**

### FILE: /lib/collaboration.ts
```typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface CollaboratorState {
  userId: string; userName: string; avatarColor: string;
  selectedNodeId: string | null;
  cursorPosition: { x: number; y: number; z: number } | null;
  lastSeen: number;
}

export const COLLABORATOR_COLORS = ["#00D4FF", "#FF6B9D", "#FFD93D", "#A78BFA", "#6BCB77"];

export function getCollabColor(index: number): string {
  return COLLABORATOR_COLORS[index % COLLABORATOR_COLORS.length];
}
```

### FILE: /hooks/useCollaboration.ts
```typescript
"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase, CollaboratorState, getCollabColor } from "@/lib/collaboration";

export function useCollaboration(documentId: string, currentUser: { id: string; name: string }) {
  const [collaborators, setCollaborators] = useState<Map<string, CollaboratorState>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const myColor = useRef(getCollabColor(Math.floor(Math.random() * 5)));

  useEffect(() => {
    const channel = supabase.channel(`universe:${documentId}`, {
      config: { presence: { key: currentUser.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<CollaboratorState>();
        const map = new Map<string, CollaboratorState>();
        Object.values(state).flat().forEach((user) => {
          if (user.userId !== currentUser.id) map.set(user.userId, user);
        });
        setCollaborators(map);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId: currentUser.id, userName: currentUser.name,
            avatarColor: myColor.current, selectedNodeId: null,
            cursorPosition: null, lastSeen: Date.now(),
          } satisfies CollaboratorState);
        }
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [documentId, currentUser.id, currentUser.name]);

  const broadcastNodeSelection = useCallback(async (nodeId: string | null) => {
    await channelRef.current?.track({
      userId: currentUser.id, userName: currentUser.name,
      avatarColor: myColor.current, selectedNodeId: nodeId,
      cursorPosition: null, lastSeen: Date.now(),
    });
  }, [currentUser.id, currentUser.name]);

  return { collaborators, myColor: myColor.current, broadcastNodeSelection };
}
```

### FILE: /components/3d/CollaboratorCursor.tsx
```typescript
"use client";
import { useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CollaboratorState } from "@/lib/collaboration";

interface Props {
  collaborator: CollaboratorState;
  nodes: Array<{ id: string; positionX: number; positionY: number; positionZ: number }>;
}

export function CollaboratorCursor({ collaborator, nodes }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetNode = collaborator.selectedNodeId
    ? nodes.find((n) => n.id === collaborator.selectedNodeId) : null;

  const position: [number, number, number] = targetNode
    ? [targetNode.positionX, targetNode.positionY + 2, targetNode.positionZ] : [0, 0, 0];

  useFrame(() => { if (meshRef.current) meshRef.current.rotation.y += 0.02; });

  if (!targetNode) return null;
  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color={collaborator.avatarColor} emissive={collaborator.avatarColor}
          emissiveIntensity={1.2} transparent opacity={0.8} />
      </mesh>
      <Html distanceFactor={12} style={{ pointerEvents: "none" }}>
        <div className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
          style={{ backgroundColor: `${collaborator.avatarColor}20`, border: `1px solid ${collaborator.avatarColor}60`,
            color: collaborator.avatarColor, fontFamily: "Space Grotesk, sans-serif" }}>
          {collaborator.userName}
        </div>
      </Html>
    </group>
  );
}
```

### FILE: /components/ui/CollabChat.tsx
- Live chat panel floating over the 3D space
- Uses Supabase broadcast for messages
- Shows collaborator count + toggle button
- Input with Send button, auto-scroll

---

## ADDITION 3 — AR EXPORT
### View Your Knowledge Graph in Your Room

**What it is:** A button in the universe view that opens a WebXR/WebAR experience. The user's camera activates and the 3D knowledge graph is overlaid on whatever surface they point at. Works on any modern phone without an app install.

### FILE: /app/ar/[documentId]/page.tsx
- Full-screen AR page with WebXR
- Fetches graph data from `/api/graph/[documentId]/personalised`
- Scales positions for AR (scale factor 0.15)
- Fallback for unsupported devices

### FILE: /components/3d/ARCanvas.tsx
- Pure Three.js WebXR renderer
- Builds graph group with color-coded spheres
- Uses `navigator.xr.requestSession("immersive-ar")` with hit-test

### AR Launch Button (add to universe top bar)
```html
<a href={`/ar/${documentId}`} className="...bg-[#00D4FF]/20...text-[#00D4FF]...">AR View</a>
```

### QR Code for Desktop → Mobile Handoff
```bash
npm install qrcode @types/qrcode
```

---

## ADDITION 4 — ENHANCED VISUAL SYSTEM

### 4A. Particle burst on node click (NodeBurst component)
### 4B. Dynamic starfield that reacts to memory strength
### 4C. Animated flowing beam edges (dashed flow effect)
### 4D. Universe assembling loader screen

### FILE: /components/ui/UniverseLoader.tsx
```typescript
"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const MESSAGES = [
  "Mapping neural pathways...", "Calibrating memory vectors...",
  "Positioning concept nodes...", "Calculating relationship strength...",
  "Universe assembling...",
];

export function UniverseLoader() {
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setMsgIndex((i) => (i + 1) % MESSAGES.length), 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#050510] flex flex-col items-center justify-center z-50">
      <div className="relative w-32 h-32 mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div key={i} className="absolute w-2 h-2 rounded-full bg-[#6C63FF]"
            style={{ left: "50%", top: "50%" }}
            animate={{ x: Math.cos((i / 8) * Math.PI * 2) * 50, y: Math.sin((i / 8) * Math.PI * 2) * 50,
              opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }} />
        ))}
        <motion.div className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="w-4 h-4 rounded-full bg-[#A78BFA]" />
        </motion.div>
      </div>
      <motion.p key={msgIndex} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
        className="text-[#8888AA] text-sm font-mono">{MESSAGES[msgIndex]}</motion.p>
    </div>
  );
}
```

---

## UPDATED SCHEMA ADDITIONS

```typescript
// Add to /drizzle/schema.ts

export const studySessions = pgTable("study_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  hostUserId: uuid("host_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  sessionCode: text("session_code").notNull().unique(),
  isActive: boolean("is_active").default(true),
  participantCount: integer("participant_count").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const atlasHistory = pgTable("atlas_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  userMessage: text("user_message").notNull(),
  atlasResponse: text("atlas_response").notNull(),
  actionTaken: text("action_taken"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## UPDATED ENVIRONMENT VARIABLES

```bash
# Add to .env.local
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
```

## UPDATED DEPENDENCIES

```bash
npm install @supabase/supabase-js qrcode @types/qrcode
```

---

## UPDATED BUILD EXECUTION ORDER

```
PHASE 8 — ATLAS VOICE (after Phase 5)
  → /lib/atlas.ts, /lib/speech-synthesis.ts, /hooks/useAtlasVoice.ts
  → /components/ui/AtlasOrb.tsx
  → Wire into /app/universe/[documentId]/page.tsx

PHASE 9 — COLLABORATION (after Phase 8)
  → /lib/collaboration.ts, /hooks/useCollaboration.ts
  → /components/3d/CollaboratorCursor.tsx, /components/ui/CollabChat.tsx
  → Add studySessions + atlasHistory to schema, push migration

PHASE 10 — AR EXPORT (after Phase 9)
  → /app/ar/[documentId]/page.tsx, /components/3d/ARCanvas.tsx
  → Add AR button to universe top bar + QR code modal

PHASE 11 — VISUAL POLISH (final)
  → NodeBurst particles, DynamicStars, animated ConceptEdge beams
  → UniverseLoader screen
  → Test full demo flow: upload → universe → Atlas → collab → AR
```

---

## KNOWN ERRORS FOR NEW ADDITIONS

| Error | Fix |
|---|---|
| Web Speech API not working | Only works on HTTPS. Vercel deploy solves this. |
| Speech synthesis no voice | Call `speechSynthesis.getVoices()` inside a user gesture (button click) |
| Supabase presence not syncing | Ensure channel name is identical: `universe:${documentId}` |
| WebXR not starting | Must be on HTTPS with camera permission granted |
| QR code not generating | Install `qrcode` and `@types/qrcode` |
| Atlas returns non-JSON | `.replace(/```json\|```/g, "")` strip before `JSON.parse` |
| AR graph too large/small | Adjust `scale` prop (start at 0.15, tune 0.1–0.2) |

---

## JUDGE Q&A PREP

**"How does the memory decay work?"**
→ Weighted formula: accuracy (70%) + time-since-review recency (30%). Based on forgetting curve model.

**"Can this scale beyond a hackathon?"**
→ Entire stack costs zero. Swap Gemini for paid key and Neon for larger instance to scale. Architecture unchanged.

**"What makes this better than Anki or Notion AI?"**
→ Spatial memory research shows 40% better retention when info is encoded to a location. Anki is a list. This is a place.

**"Is the AR actually AR?"**
→ Uses WebXR hit-test — detects real surfaces through phone depth sensors. Same API Apple/Google use.

---

## THE DEMO SCRIPT (90 seconds)

**0:00** — "Every other project here is a quiz app. We built something different. Watch."
**0:15** — Upload a lecture PDF. 3D universe appears.
**0:35** — Press Atlas orb. "Atlas, what should I study first?" Voice responds, node pulses red.
**0:55** — Open link on second device. Two avatars in same space.
**1:10** — Scan QR with phone. Knowledge graph appears on desk in AR.
**1:25** — "Every node glows based on how well you remember it. This is the first time anyone has visualised forgetting in 3D."
**1:40** — "This is Mnemo. Built in two days. Zero cost. Ready for real students tomorrow."

---

*This document extends MNEMO-ANTIGRAVITY-MASTER. All base decisions stand. Execute base phases first, then Phases 8–11.*
