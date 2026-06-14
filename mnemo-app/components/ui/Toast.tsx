"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 4000); return () => clearTimeout(t); }, []);
  return (
    <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 bg-red-500/90 text-white rounded-xl text-sm shadow-lg">
      {message}
    </motion.div>
  );
}
