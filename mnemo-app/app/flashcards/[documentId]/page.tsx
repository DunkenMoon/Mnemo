"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { CanvasRevealEffect } from "@/components/ui/aceternity/CanvasRevealEffect";
import { isFeatureEnabled } from "@/lib/features";

const KnowledgeUniverse = dynamic(
  () => import("@/components/3d/KnowledgeUniverse"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#050510] animate-pulse rounded-xl" />
    ),
  }
);

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  nodeId: string;
  difficulty: number;
}

interface GraphNode {
  id: string;
  label: string;
  memoryStrength?: number;
}

const QUALITY_BUTTONS = [
  { q: 1, label: "Blackout", color: "#FF6B6B", desc: "Complete blank" },
  { q: 2, label: "Wrong", color: "#FF9B6B", desc: "Wrong but familiar" },
  { q: 3, label: "Hard", color: "#FFD93D", desc: "Correct with effort" },
  { q: 4, label: "Good", color: "#6BCB77", desc: "Correct, slight hesitation" },
  { q: 5, label: "Easy", color: "#00D4FF", desc: "Perfect recall" },
];

const qualityContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const qualityItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

function MemoryBar({ strength }: { strength: number }) {
  const color = strength < 0.3 ? "#FF6B6B" : strength < 0.6 ? "#FFD93D" : "#6BCB77";

  return (
    <div className="w-full max-w-lg mt-4">
      <div className="flex justify-between text-xs text-[#8888AA] mb-1">
        <span>Memory strength</span>
        <span>{Math.round(strength * 100)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#0F0F2E] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${strength * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}

export default function FlashcardsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { documentId } = useParams() as { documentId: string };

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<{ id: string; sourceNodeId: string; targetNodeId: string }[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [memoryMap, setMemoryMap] = useState<Record<string, number>>({});
  const [shake, setShake] = useState(false);
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => {
    if (session === null) router.push("/login");
  }, [session, router]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`/api/flashcards/${documentId}`, { credentials: "include" }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(`Flashcards ${r.status}`))
      ),
      fetch(`/api/graph/${documentId}/personalised`, { credentials: "include" }).then((r) =>
        r.ok ? r.json() : []
      ),
      fetch(`/api/graph/${documentId}`, { credentials: "include" }).then((r) =>
        r.ok ? r.json() : { edges: [] }
      ),
    ])
      .then(([cardsData, nodesData, graphRes]) => {
        if (cancelled) return;
        setCards(Array.isArray(cardsData) ? cardsData : []);
        setNodes(Array.isArray(nodesData) ? nodesData : []);
        setEdges(graphRes.edges ?? []);
        const mem: Record<string, number> = {};
        (Array.isArray(nodesData) ? nodesData : []).forEach((n: GraphNode) => {
          mem[n.id] = n.memoryStrength ?? 0.5;
        });
        setMemoryMap(mem);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      setSelectedNodeId(node.id);
      const cardIdx = cards.findIndex((c) => c.nodeId === node.id);
      if (cardIdx >= 0) {
        setIndex(cardIdx);
        setFlipped(false);
        setDone(false);
        setShake(false);
      }
    },
    [cards]
  );

  const advanceCard = useCallback(() => {
    if (index + 1 >= cards.length) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setFlipped(false);
    setSelectedNodeId(null);
  }, [cards.length, index]);

  const handleAnswer = useCallback(
    async (responseQuality: number) => {
      const card = cards[index];
      if (!card) return;

      const correct = responseQuality >= 3;

      try {
        const res = await fetch(`/api/flashcards/answer/${card.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ correct, responseQuality, timeSpent: 10 }),
        });
        if (res.ok) {
          const data = await res.json();
          setMemoryMap((prev) => ({ ...prev, [card.nodeId]: data.memoryStrength ?? prev[card.nodeId] }));
        }
      } catch (err: unknown) {
        console.error("[flashcards page]", err);
      }

      if (correct) {
        setShowReveal(true);
        setTimeout(() => {
          setShowReveal(false);
          advanceCard();
        }, 400);
      } else {
        setShake(true);
        setTimeout(() => {
          setShake(false);
          advanceCard();
        }, 350);
      }
    },
    [cards, index, advanceCard]
  );

  if (!session?.user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050510] text-[#8888AA]">
        Loading flashcards...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#050510] gap-4">
        <p className="text-[#FF6B6B]">{error}</p>
        <button
          onClick={() => router.push("/home")}
          className="px-5 py-2.5 border border-[#1E1E3F] rounded-xl text-[#8888AA]"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#050510] gap-4">
        <p className="text-[#8888AA] text-center">
          No flashcards found.
          <br />
          <span className="text-xs">Try reprocessing the document.</span>
        </p>
        <button
          onClick={() =>
            fetch(`/api/process/${documentId}`, { method: "POST", credentials: "include" }).then(
              () => window.location.reload()
            )
          }
          className="px-5 py-2.5 bg-[#6C63FF] rounded-xl text-white font-medium"
        >
          Reprocess Document
        </button>
        <button
          onClick={() => router.push("/home")}
          className="px-5 py-2.5 border border-[#1E1E3F] rounded-xl text-[#8888AA]"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col items-center justify-center h-screen bg-[#050510] gap-6"
      >
        <CheckCircle size={48} className="text-[#6BCB77]" />
        <h2 className="text-2xl font-bold text-[#F0F0FF]">Session Complete!</h2>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setIndex(0);
              setFlipped(false);
              setDone(false);
              setSelectedNodeId(null);
            }}
            className="px-4 py-2 bg-[#6C63FF] text-white rounded-xl"
          >
            Review Again
          </motion.button>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(`/universe/${documentId}`)}
            className="px-4 py-2 border border-[#1E1E3F] text-[#8888AA] rounded-xl"
          >
            Back to Universe
          </motion.button>
        </div>
      </motion.div>
    );
  }

  const card = cards[index];
  const memoryStrength = memoryMap[card.nodeId] ?? 0.5;
  const progress = ((index + 1) / cards.length) * 100;
  const splitEnabled = isFeatureEnabled("splitPanel");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="h-screen flex bg-[#050510] overflow-hidden"
    >
      <CanvasRevealEffect active={showReveal} />

      {splitEnabled && (
        <div className="relative w-1/2 h-full border-r border-[#1E1E3F]">
          <div className="absolute top-4 left-4 z-10 bg-[#0A0A1F]/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-[#8888AA] border border-[#1E1E3F]">
            Click a node to study it
          </div>
          <KnowledgeUniverse
            nodes={nodes}
            edges={edges}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNodeId}
            autoRotate={!selectedNodeId}
            cameraFov={75}
          />
        </div>
      )}

      <div className={`${splitEnabled ? "w-1/2" : "w-full"} h-full flex flex-col bg-[#050510]`}>
        <div className="flex items-center justify-between p-6 border-b border-[#1E1E3F]">
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#8888AA] hover:text-[#F0F0FF]"
          >
            <ArrowLeft size={16} /> Back
          </motion.button>
          <div className="flex items-center gap-4">
            <div className="w-32">
              <Progress value={progress} className="gap-0">
                <ProgressTrack className="h-1 bg-[#0F0F2E]">
                  <ProgressIndicator className="bg-[#6C63FF]" />
                </ProgressTrack>
              </Progress>
            </div>
            <span className="text-sm text-[#8888AA]">
              {index + 1} / {cards.length}
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div
            className="w-full max-w-lg cursor-pointer"
            onClick={() => !flipped && setFlipped(true)}
            style={{ perspective: "1000px" }}
          >
            <motion.div
              animate={{
                rotateY: flipped ? 180 : 0,
                x: shake ? [0, -8, 8, -8, 0] : 0,
              }}
              transition={{
                rotateY: { type: "spring", stiffness: 200, damping: 25 },
                x: shake ? { duration: 0.35 } : { duration: 0 },
              }}
              style={{
                transformStyle: "preserve-3d",
                position: "relative",
                height: "200px",
              }}
            >
              <div
                style={{
                  backfaceVisibility: "hidden",
                  position: "absolute",
                  inset: 0,
                }}
                className="bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-8 flex flex-col items-center justify-center"
              >
                <span className="text-xs text-[#A78BFA] mb-4 font-mono uppercase">
                  Question — tap to flip
                </span>
                <p className="text-xl text-[#F0F0FF] text-center font-semibold">{card.question}</p>
              </div>
              <div
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  position: "absolute",
                  inset: 0,
                }}
                className="bg-[#0F0F2E] border border-[#6C63FF]/30 rounded-2xl p-8 flex flex-col items-center justify-center"
              >
                <span className="text-xs text-[#00D4FF] mb-4 font-mono uppercase">Answer</span>
                <p className="text-xl text-[#F0F0FF] text-center">{card.answer}</p>
              </div>
            </motion.div>
          </div>

          <MemoryBar strength={memoryStrength} />

          <AnimatePresence>
            {flipped && (
              <motion.div
                variants={qualityContainer}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0 }}
                className="flex flex-wrap justify-center gap-2 mt-8 max-w-2xl"
              >
                {QUALITY_BUTTONS.map((btn) => (
                  <motion.button
                    key={btn.q}
                    variants={qualityItem}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAnswer(btn.q)}
                    style={{ borderColor: btn.color, color: btn.color }}
                    className="rounded-xl px-4 py-2 border bg-transparent hover:opacity-90 transition-opacity min-w-[100px]"
                  >
                    <span className="text-sm font-medium block">{btn.label}</span>
                    <span className="text-[10px] opacity-70 block mt-0.5">{btn.desc}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {!flipped && (
            <p className="text-[#8888AA] text-sm mt-6">Tap card to reveal answer</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
