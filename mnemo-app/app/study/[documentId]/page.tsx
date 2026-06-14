"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, BookOpen, GitBranch, RotateCcw } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { CanvasRevealEffect } from "@/components/ui/aceternity/CanvasRevealEffect";

const KnowledgeUniverse = dynamic(
  () => import("@/components/3d/KnowledgeUniverse"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#050510] animate-pulse rounded-xl" />
    ),
  }
);

const AtlasOrb = dynamic(
  () => import("@/components/atlas/AtlasOrb").then(m => m.AtlasOrb),
  { ssr: false }
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

export default function StudyPage() {
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
  const [startTime, setStartTime] = useState<number>(0);
  const [stats, setStats] = useState({ cardsStudied: 0, avgQuality: 0, masteryImprovement: 0 });

  useEffect(() => {
    if (session === null) router.push("/login");
  }, [session, router]);

  useEffect(() => {
    if (!documentId) return;
    setStartTime(Date.now());

    Promise.all([
      fetch(`/api/flashcards/${documentId}`).then(r => r.json()),
      fetch(`/api/concept-nodes/${documentId}`).then(r => r.json()),
      fetch(`/api/concept-edges/${documentId}`).then(r => r.json()),
    ])
      .then(([cardsData, nodesData, edgesData]) => {
        setCards(cardsData);
        setNodes(nodesData);
        setEdges(edgesData);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load study materials");
        setLoading(false);
      });
  }, [documentId]);

  const handleAnswer = useCallback(async (quality: number) => {
    const card = cards[index];
    if (!card) return;

    await fetch(`/api/flashcards/${card.id}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quality }),
      credentials: "include",
    });

    setMemoryMap(prev => ({
      ...prev,
      [card.nodeId]: Math.min(1, (prev[card.nodeId] || 0) + quality * 0.1),
    }));

    setStats(prev => ({
      cardsStudied: prev.cardsStudied + 1,
      avgQuality: ((prev.avgQuality * prev.cardsStudied + quality) / (prev.cardsStudied + 1)),
      masteryImprovement: prev.masteryImprovement + quality * 0.05,
    }));

    setShake(true);
    setTimeout(() => setShake(false), 300);

    if (index < cards.length - 1) {
      setTimeout(() => {
        setIndex(prev => prev + 1);
        setFlipped(false);
        setShowReveal(false);
      }, 500);
    } else {
      setDone(true);
    }
  }, [cards, index]);

  if (!session?.user) return null;
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#050510] text-[#F0F0FF]">Loading...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen bg-[#050510] text-[#FF6B6B]">{error}</div>;
  if (cards.length === 0) return <div className="flex items-center justify-center min-h-screen bg-[#050510] text-[#8888AA]">No flashcards available</div>;

  const currentCard = cards[index];
  const currentNode = nodes.find(n => n.id === currentCard?.nodeId);

  return (
    <div className="flex min-h-screen bg-[#050510]">
      <div className="w-1/2 h-screen relative">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 bg-[#0A0A1F]/80 backdrop-blur border border-[#1E1E3F] rounded-xl px-4 py-2 text-[#F0F0FF] flex items-center gap-2 hover:border-[#6C63FF]/40 transition-all"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <KnowledgeUniverse
          nodes={nodes}
          edges={edges}
          onNodeClick={setSelectedNodeId}
          selectedNodeId={selectedNodeId}
          autoRotate={true}
        />
      </div>

      <div className="w-1/2 h-screen bg-[#0A0A1F] flex flex-col">
        <div className="p-6 border-b border-[#1E1E3F]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-[#F0F0FF] font-[Space_Grotesk]">Study Mode</h1>
            <div className="text-sm text-[#8888AA]">
              {index + 1} / {cards.length}
            </div>
          </div>
          <Progress value={((index + 1) / cards.length) * 100} className="h-2">
            <ProgressIndicator className="h-full bg-gradient-to-r from-[#6C63FF] to-[#00D4FF]" />
          </Progress>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="celebration"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center max-w-md"
              >
                <div className="w-20 h-20 bg-[#6BCB77]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-[#6BCB77]" />
                </div>
                <h2 className="text-3xl font-bold text-[#F0F0FF] mb-4 font-[Space_Grotesk]">Study Complete!</h2>
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8888AA]">Cards studied</span>
                    <span className="text-[#F0F0FF]">{stats.cardsStudied}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8888AA]">Average quality</span>
                    <span className="text-[#F0F0FF]">{stats.avgQuality.toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8888AA]">Time spent</span>
                    <span className="text-[#F0F0FF]">{Math.round((Date.now() - startTime) / 1000 / 60)}m</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8888AA]">Mastery improvement</span>
                    <span className="text-[#F0F0FF]">+{Math.round(stats.masteryImprovement * 100)}%</span>
                  </div>
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => router.push(`/review/${documentId}`)}
                    className="bg-[#A78BFA] hover:bg-[#B79BFF] text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all"
                  >
                    <RotateCcw size={18} />
                    Start Review
                  </button>
                  <button
                    onClick={() => router.push(`/topicmap/${documentId}`)}
                    className="bg-[#00D4FF] hover:bg-[#00E4FF] text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all"
                  >
                    <GitBranch size={18} />
                    Topic Map
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full max-w-lg"
              >
                <div
                  className="relative w-full min-h-[300px] bg-gradient-to-br from-[#1E1E3F] to-[#0F0F2E] rounded-2xl p-8 border border-[#1E1E3F] cursor-pointer"
                  style={{ perspective: "1000px" }}
                  onClick={() => {
                    if (!flipped) setShowReveal(true);
                    setFlipped(true);
                  }}
                >
                  <motion.div
                    className="relative w-full h-full"
                    initial={false}
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: "spring" }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div
                      className="absolute inset-0 backface-hidden"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <h3 className="text-xl font-semibold text-[#F0F0FF] mb-4 font-[Space_Grotesk]">Question</h3>
                      <p className="text-[#8888AA] text-lg">{currentCard.question}</p>
                      {!showReveal && (
                        <div className="absolute bottom-4 right-4">
                          <CanvasRevealEffect active={true} />
                        </div>
                      )}
                    </div>
                    <div
                      className="absolute inset-0 backface-hidden bg-gradient-to-br from-[#2D2D4A] to-[#1A1A3A] rounded-2xl p-8 border border-[#1E1E3F]"
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                      <h3 className="text-xl font-semibold text-[#F0F0FF] mb-4 font-[Space_Grotesk]">Answer</h3>
                      <p className="text-[#8888AA] text-lg">{currentCard.answer}</p>
                      {currentNode && <MemoryBar strength={memoryMap[currentNode.id] || 0} />}
                    </div>
                  </motion.div>
                </div>

                {flipped && (
                  <motion.div
                    variants={qualityContainer}
                    initial="hidden"
                    animate="show"
                    className="mt-6 grid grid-cols-5 gap-2"
                  >
                    {QUALITY_BUTTONS.map((btn) => (
                      <motion.button
                        key={btn.q}
                        variants={qualityItem}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAnswer(btn.q)}
                        className="relative overflow-hidden rounded-xl py-3 text-xs font-medium transition-all"
                        style={{
                          backgroundColor: btn.color + "20",
                          border: `1px solid ${btn.color}40`,
                          color: btn.color,
                        }}
                      >
                        <div className="relative z-10">
                          <div className="font-bold text-sm mb-1">{btn.label}</div>
                          <div className="text-[10px] opacity-80">{btn.desc}</div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Atlas Orb */}
      <AtlasOrb
        documentId={documentId}
      />
    </div>
  );
}
