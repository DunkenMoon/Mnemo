"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Telescope, Layers, Share2, Trash2, Loader2, GitBranch, BookOpen, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardSpotlight } from "@/components/ui/aceternity/CardSpotlight";

interface DocumentCardProps {
  id: string;
  title: string;
  subject: string | null;
  nodeCount: number;
  masteryScore: number;
  status?: "complete" | "processing" | "pending" | "error";
  onDelete?: () => void;
  onRetry?: () => void;
}

export function DocumentCard({
  id,
  title,
  subject,
  nodeCount,
  masteryScore,
  status = "complete",
  onDelete,
  onRetry,
}: DocumentCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const normalizedMastery = masteryScore > 1 ? masteryScore / 100 : masteryScore;
  const displayScore = Math.round(normalizedMastery * 100);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setConfirmOpen(false);
        onDelete?.();
      }
    } finally {
      setDeleting(false);
    }
  };

  const renderStatusDot = () => {
    switch (status) {
      case "processing":
        return <div className="w-2 h-2 rounded-full bg-[#FFD93D] animate-pulse" />;
      case "pending":
        return <div className="w-2 h-2 rounded-full bg-[#8888AA]" />;
      case "error":
        return <div className="w-2 h-2 rounded-full bg-[#FF6B6B]" style={{ boxShadow: "0 0 6px #FF6B6B" }} />;
      case "complete":
      default:
        return (
          <div
            className="w-2 h-2 rounded-full bg-[#6BCB77]"
            style={{ boxShadow: "0 0 6px #6BCB77" }}
          />
        );
    }
  };

  return (
    <>
      <CardSpotlight className="h-full">
        <motion.div
          layout
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="group relative p-6 flex flex-col justify-between h-full overflow-hidden rounded-2xl"
        >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setConfirmOpen(true);
          }}
          disabled={deleting}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-lg text-[#8888AA] hover:text-red-400 hover:bg-[#0F0F2E] transition-colors"
          title="Delete document"
        >
          {deleting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
        </button>

        <div className="relative z-10">
          <div className="flex justify-between items-start pr-8">
            {subject ? (
              <span className="bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF] text-xs px-3 py-1 rounded-full font-medium">
                {subject}
              </span>
            ) : (
              <span className="opacity-0 px-3 py-1 text-xs">No Subject</span>
            )}
            {renderStatusDot()}
          </div>

          <h3 className="text-[#F0F0FF] font-semibold text-lg font-[Space_Grotesk] mt-3 line-clamp-2">
            {title}
          </h3>

          <div className="flex items-center gap-4 mt-4">
            <div className="relative w-14 h-14 shrink-0">
              <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
                <circle cx="28" cy="28" r="22" fill="none" stroke="#1E1E3F" strokeWidth="3" />
                <motion.circle
                  key={displayScore}
                  cx="28"
                  cy="28"
                  r="22"
                  fill="none"
                  stroke={
                    displayScore > 70 ? "#6BCB77" : displayScore > 40 ? "#FFD93D" : "#6C63FF"
                  }
                  strokeWidth="3"
                  strokeDasharray={`${(displayScore / 100) * 138.23} 138.23`}
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 138.23" }}
                  animate={{ strokeDasharray: `${(displayScore / 100) * 138.23} 138.23` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span 
                  key={displayScore}
                  className="text-xs font-bold text-[#A78BFA] font-[Space_Grotesk]"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  {displayScore}%
                </motion.span>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#8888AA] mt-2">{nodeCount} concepts mapped</p>
            </div>
          </div>
        </div>

        {status === "error" ? (
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRetry}
            className="relative z-10 mt-6 w-full bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20 text-sm rounded-xl py-2.5 font-medium transition-colors"
          >
            Failed — Retry
          </motion.button>
        ) : (
          <div className="relative z-10 flex gap-3 mt-6">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(`/universe/${id}`)}
              className="flex-1 bg-[#6C63FF] hover:bg-[#7C73FF] text-white text-sm rounded-xl py-2.5 font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Telescope size={16} />
              Open Universe
            </motion.button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/universe/${id}?share=true`);
              }}
              className="p-2.5 bg-[#0F0F2E] border border-[#1E1E3F] rounded-xl hover:border-[#00D4FF]/40 transition-all group"
              title="Share to Community"
            >
              <Share2 size={16} className="text-[#8888AA] group-hover:text-[#00D4FF] transition-colors" />
            </button>

            <button
              onClick={() => router.push(`/study/${id}`)}
              className="p-2.5 bg-[#0F0F2E] border border-[#1E1E3F] rounded-xl hover:border-[#00D4FF]/40 transition-all group"
              title="Study"
            >
              <BookOpen size={16} className="text-[#8888AA] group-hover:text-[#00D4FF] transition-colors" />
            </button>

            <button
              onClick={() => router.push(`/review/${id}`)}
              className="p-2.5 bg-[#0F0F2E] border border-[#1E1E3F] rounded-xl hover:border-[#A78BFA]/40 transition-all group"
              title="Review"
            >
              <RotateCcw size={16} className="text-[#8888AA] group-hover:text-[#A78BFA] transition-colors" />
            </button>

            <button
              onClick={() => router.push(`/topicmap/${id}`)}
              className="p-2.5 bg-[#0F0F2E] border border-[#1E1E3F] rounded-xl hover:border-[#00D4FF]/40 transition-all group"
              title="Topic Map"
            >
              <GitBranch size={16} className="text-[#8888AA] group-hover:text-[#00D4FF] transition-colors" />
            </button>
          </div>
        )}
        </motion.div>
      </CardSpotlight>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-[#0A0A1F] border-[#1E1E3F] text-[#F0F0FF]">
          <DialogHeader>
            <DialogTitle>Delete universe?</DialogTitle>
            <DialogDescription className="text-[#8888AA]">
              This will permanently delete &ldquo;{title}&rdquo; and all its concepts, flashcards,
              and progress.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-[#1E1E3F] bg-transparent">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
