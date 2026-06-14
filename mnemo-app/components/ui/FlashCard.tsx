"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty: number;
}

interface Props {
  flashcard: Flashcard;
  memoryStrength: number;
  onAnswer: (correct: boolean) => void;
}

export function FlashCard({ flashcard, memoryStrength, onAnswer }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [answered, setAnswered] = useState(false);

  const strengthColor = memoryStrength < 0.3 ? "#FF6B6B" : memoryStrength < 0.6 ? "#FFD93D" : "#6BCB77";

  const handleAnswer = (correct: boolean) => {
    if (answered) return;
    setAnswered(true);
    onAnswer(correct);
  };

  return (
    <div className="relative w-full max-w-2xl h-96 [perspective:1000px] group mx-auto">
      <motion.div
        className="w-full h-full relative [transform-style:preserve-3d] transition-all duration-500 cursor-pointer"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        onClick={() => !answered && !flipped && setFlipped(true)}
      >
        {/* Front Face */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-8 flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-start">
            <span className="text-[#8888AA] text-sm uppercase tracking-wider font-bold">Question</span>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full ${i < flashcard.difficulty ? "bg-[#6C63FF]" : "bg-[#1E1E3F]"}`} 
                />
              ))}
            </div>
          </div>
          <h2 className="text-3xl font-medium text-[#F0F0FF] font-[Space_Grotesk] leading-tight text-center">
            {flashcard.question}
          </h2>
          <div className="text-center text-sm text-[#8888AA]">Tap to flip</div>
          
          <div className="absolute bottom-0 left-0 right-0 h-1.5 rounded-b-2xl opacity-50" style={{ backgroundColor: strengthColor }} />
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[#0F0F2E] border border-[#6C63FF]/30 rounded-2xl p-8 flex flex-col justify-between shadow-xl shadow-[#6C63FF]/5">
          <div className="flex justify-between items-start">
            <span className="text-[#6C63FF] text-sm uppercase tracking-wider font-bold">Answer</span>
          </div>
          <p className="text-xl text-[#F0F0FF] leading-relaxed text-center overflow-y-auto max-h-48 custom-scrollbar">
            {flashcard.answer}
          </p>
          
          <div className="flex gap-4 mt-6">
            <button 
              onClick={(e) => { e.stopPropagation(); handleAnswer(false); }}
              disabled={answered}
              className="flex-1 bg-[#1E1E3F] hover:bg-[#FF6B6B]/20 text-[#FF6B6B] border border-[#1E1E3F] hover:border-[#FF6B6B]/50 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <X size={18} /> Missed
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleAnswer(true); }}
              disabled={answered}
              className="flex-1 bg-[#6BCB77]/10 hover:bg-[#6BCB77]/20 text-[#6BCB77] border border-[#6BCB77]/30 hover:border-[#6BCB77] py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Check size={18} /> Got it
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 rounded-b-2xl opacity-80" style={{ backgroundColor: strengthColor }} />
        </div>
      </motion.div>
    </div>
  );
}
