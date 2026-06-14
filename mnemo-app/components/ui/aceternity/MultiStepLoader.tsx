"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";

export function MultiStepLoader({
  loadingStates,
  loading,
  duration = 2000,
  loop = false,
}: {
  loadingStates: { text: string }[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
}) {
  const [currentState, setCurrentState] = useState(0);

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentState((prev) => {
        if (prev === loadingStates.length - 1) {
          return loop ? 0 : prev;
        }
        return prev + 1;
      });
    }, duration);
    return () => clearInterval(interval);
  }, [loading, duration, loop, loadingStates.length]);

  if (!loading) return null;

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4">
        {loadingStates.map((state, index) => {
          const isDone = index < currentState;
          const isActive = index === currentState;
          return (
            <motion.div
              key={state.text}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex items-center gap-3"
            >
              {isDone ? (
                <CheckCircle2 size={18} className="text-[#6BCB77] shrink-0" />
              ) : isActive ? (
                <Loader2 size={18} className="text-[#6C63FF] animate-spin shrink-0" />
              ) : (
                <div className="w-[18px] h-[18px] rounded-full border border-[#1E1E3F] shrink-0" />
              )}
              <span
                className={cn(
                  "text-sm transition-colors",
                  isDone && "text-[#F0F0FF]",
                  isActive && "text-[#A78BFA] font-medium",
                  !isDone && !isActive && "text-[#8888AA]"
                )}
              >
                {state.text}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function MultiStepLoaderControlled({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="popLayout">
        {steps.map((step, idx) => {
          const isDone = currentStep > idx;
          const isActive = currentStep === idx;
          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex items-center gap-3"
            >
              {isDone ? (
                <CheckCircle2 size={18} className="text-[#6BCB77] shrink-0" />
              ) : isActive ? (
                <Loader2 size={18} className="text-[#6C63FF] animate-spin shrink-0" />
              ) : (
                <div className="w-[18px] h-[18px] rounded-full border border-[#1E1E3F] shrink-0" />
              )}
              <span
                className={cn(
                  "text-sm",
                  isDone && "text-[#F0F0FF]",
                  isActive && "text-[#A78BFA] font-medium animate-pulse",
                  !isDone && !isActive && "text-[#8888AA]"
                )}
              >
                {step}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
