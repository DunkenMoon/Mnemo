"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, PlayCircle, Network, Clock, MessageSquare, ChevronRight } from "lucide-react";
import Link from "next/link";
import { GlowingEffect } from "@/components/ui/aceternity/GlowingEffect";

interface NodeData {
  id: string;
  label: string;
  explanation: string;
  memoryStrength?: number;
  lastReviewedAt?: string | null;
}

interface EdgeData {
  sourceNodeId: string;
  targetNodeId: string;
  relationshipLabel?: string;
}

interface ConnectedNode {
  id: string;
  label: string;
  relationship: string;
}

interface Props {
  node: NodeData;
  documentId: string;
  onClose: () => void;
  edges?: EdgeData[];
  allNodes?: { id: string; label: string }[];
  onAtlasAsk?: (prompt: string) => void;
  onNavigateNode?: (nodeId: string) => void;
}

export function NodeDetailPanel({
  node,
  documentId,
  onClose,
  edges = [],
  allNodes = [],
  onAtlasAsk,
  onNavigateNode,
}: Props) {
  const strength = node.memoryStrength ?? 0.5;
  const isWeak = strength < 0.3;
  const isFading = strength >= 0.3 && strength < 0.6;
  const color = isWeak ? "#FF6B6B" : isFading ? "#FFD93D" : "#6BCB77";
  const label = isWeak ? "Needs review" : isFading ? "Fading" : "Strong";

  const [customQuestion, setCustomQuestion] = useState("");
  const [customAnswer, setCustomAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const [nodeCard, setNodeCard] = useState<{question:string;answer:string}|null>(null);
  const [cardFlipped, setCardFlipped] = useState(false);

  // Compute connected nodes from edges
  const connectedNodes: ConnectedNode[] = Array.from(
    new Map(
      edges
        .filter(e => e.sourceNodeId === node.id || e.targetNodeId === node.id)
        .map(e => {
          const connectedId = e.sourceNodeId === node.id ? e.targetNodeId : e.sourceNodeId;
          const matchedNode = allNodes.find(n => n.id === connectedId);
          if (!matchedNode) return null;
          return [matchedNode.id, {
            id: matchedNode.id,
            label: matchedNode.label,
            relationship: e.relationshipLabel ?? "relates to",
          }] as [string, ConnectedNode];
        })
        .filter((n): n is NonNullable<typeof n> => Boolean(n))
    ).values()
  );

  useEffect(() => {
    fetch(`/api/flashcards/${documentId}`)
      .then(r => r.json())
      .then(d => {
        const match = Array.isArray(d) ? d.find((c:any) => c.nodeId === node.id) : null;
        if (match) setNodeCard({ question: match.question, answer: match.answer });
      });
  }, [node.id, documentId]);

  // Last reviewed label
  const lastReviewedLabel = (() => {
    if (!node.lastReviewedAt) return "Never reviewed";
    const diff = Date.now() - new Date(node.lastReviewedAt).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Reviewed today";
    if (days === 1) return "Reviewed yesterday";
    return `Reviewed ${days} days ago`;
  })();

  const handleCreateCard = async () => {
    if (!customQuestion.trim() || !customAnswer.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/flashcards/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId: node.id,
          documentId,
          question: customQuestion.trim(),
          answer: customAnswer.trim(),
          difficulty: 3,
        }),
      });
      setCustomQuestion("");
      setCustomAnswer("");
    } catch (err) {
      console.error("Failed to create flashcard:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlowingEffect className="fixed top-0 right-0 h-full w-[380px] z-20 rounded-none">
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="h-full w-full bg-[#0A0A1F]/95 backdrop-blur-xl border-l border-[#1E1E3F] p-6 flex flex-col shadow-2xl overflow-y-auto"
      >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-[#8888AA] hover:text-[#F0F0FF] transition-colors"
      >
        <X size={24} />
      </button>

      <div className="mt-8 flex-1">
        <h2 className="text-2xl font-bold text-[#F0F0FF] font-[Space_Grotesk] mb-4 pr-8">
          {node.label}
        </h2>
        <p className="text-sm text-[#8888AA] leading-relaxed mb-6">
          {node.explanation}
        </p>

        {/* Memory Strength Bar */}
        <div className="bg-[#0F0F2E] rounded-xl p-4 mb-4 border border-[#1E1E3F]">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs text-[#8888AA] uppercase tracking-wider">
              Memory Strength
            </span>
            <span className="text-sm font-medium" style={{ color }}>
              {label}
            </span>
          </div>
          <div className="w-full h-2 bg-[#1E1E3F] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${strength * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
          {/* Last reviewed label */}
          <div className="flex items-center gap-1.5 mt-3">
            <Clock size={12} className="text-[#8888AA]" />
            <span className="text-[11px] text-[#8888AA]">
              {lastReviewedLabel}
            </span>
          </div>
        </div>

        {/* Connected Nodes — Obsidian local graph style */}
        {connectedNodes.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Network size={14} className="text-[#00D4FF]" />
              <span className="text-xs text-[#8888AA] uppercase tracking-widest font-[Fira_Code]">
                Connected Nodes
              </span>
            </div>
            <div className="space-y-1.5">
              {connectedNodes.slice(0, 6).map((cn, idx) => (
                <button
                  key={`connected-${cn.id}-${idx}`}
                  onClick={() => onNavigateNode?.(cn.id)}
                  className="w-full flex items-center justify-between p-2.5 bg-[#0F0F2E] border border-[#1E1E3F] rounded-lg hover:border-[#00D4FF]/30 hover:bg-[#00D4FF]/5 transition-all group text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#F0F0FF] truncate group-hover:text-[#00D4FF] transition-colors">
                      {cn.label}
                    </p>
                    <p className="text-[10px] text-[#8888AA] truncate">
                      {cn.relationship}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-[#8888AA] group-hover:text-[#00D4FF] shrink-0 ml-2"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {nodeCard && (
          <div onClick={() => setCardFlipped(f => !f)}
            className="mt-4 p-4 bg-[#0F0F2E] border border-[#1E1E3F] rounded-xl cursor-pointer hover:border-[#6C63FF]/50 transition-all mb-4">
            <span className="text-xs text-[#00D4FF] font-mono">QUICK FLASHCARD — tap to flip</span>
            <p className="text-sm text-[#F0F0FF] mt-2">{cardFlipped ? nodeCard.answer : nodeCard.question}</p>
          </div>
        )}

        {/* Ask ATLAS Button */}
        {onAtlasAsk && (
          <button
            onClick={() =>
              onAtlasAsk(
                `Explain ${node.label} to me using the Socratic method`
              )
            }
            className="w-full flex items-center gap-2 p-3 mb-4 bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-xl text-[#00D4FF] text-sm font-medium hover:bg-[#00D4FF]/10 hover:border-[#00D4FF]/40 transition-all"
          >
            <MessageSquare size={16} />
            Ask ATLAS about this concept
          </button>
        )}

        {/* Quick Flashcard Creation */}
        <div className="p-4 bg-[#0F0F2E] border border-[#1E1E3F] rounded-xl">
          <p className="text-xs text-[#8888AA] uppercase tracking-widest font-[Fira_Code] mb-3">
            Create Flashcard
          </p>
          <textarea
            placeholder="Write a question about this concept..."
            className="w-full bg-[#050510] border border-[#1E1E3F] rounded-lg p-3 text-sm text-[#F0F0FF] placeholder:text-[#8888AA]/50 focus:border-[#6C63FF] focus:outline-none resize-none transition-colors"
            rows={2}
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
          />
          <textarea
            placeholder="Answer..."
            className="w-full bg-[#050510] border border-[#1E1E3F] rounded-lg p-3 text-sm text-[#F0F0FF] placeholder:text-[#8888AA]/50 focus:border-[#6C63FF] focus:outline-none resize-none mt-2 transition-colors"
            rows={2}
            value={customAnswer}
            onChange={(e) => setCustomAnswer(e.target.value)}
          />
          <button
            onClick={handleCreateCard}
            disabled={
              !customQuestion.trim() || !customAnswer.trim() || saving
            }
            className="w-full mt-3 py-2 bg-[#6C63FF]/20 hover:bg-[#6C63FF]/40 border border-[#6C63FF]/30 text-[#A78BFA] text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
          >
            {saving ? "Saving..." : "+ Add to Deck"}
          </button>
        </div>
      </div>

      <div className="pt-6 border-t border-[#1E1E3F]">
        <Link href={`/flashcards/${documentId}?nodeId=${node.id}`}>
          <button
            disabled={navigating}
            onClick={() => setNavigating(true)}
            className="w-full bg-[#6C63FF] hover:bg-[#A78BFA] text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlayCircle size={18} />
            {navigating ? "Loading..." : "Practice Flashcards"}
          </button>
        </Link>
      </div>
      </motion.div>
    </GlowingEffect>
  );
}
