"use client";

import { useState, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function WobbleCard({
  children,
  className,
  containerClassName,
}: {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMousePosition({ x: x / 20, y: y / 20 });
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false);
        setMousePosition({ x: 0, y: 0 });
      }}
      animate={{
        rotateX: hovering ? -mousePosition.y : 0,
        rotateY: hovering ? mousePosition.x : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
      className={cn("relative", containerClassName)}
    >
      <div
        className={cn(
          "bg-[#0A0A1F] border border-[#1E1E3F] rounded-xl p-5 h-full",
          className
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}
