"use client";

import { motion } from "framer-motion";

interface CanvasRevealEffectProps {
  active: boolean;
  color?: string;
}

export function CanvasRevealEffect({
  active,
  color = "#6BCB77",
}: CanvasRevealEffectProps) {
  if (!active) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.45, 0] }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${color}55 0%, transparent 65%)`,
        }}
      />
    </motion.div>
  );
}
