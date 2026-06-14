"use client";

import { useMotionValue, motion, useMotionTemplate } from "framer-motion";
import { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CardSpotlight({
  children,
  className,
  radius = 350,
}: {
  children: ReactNode;
  className?: string;
  radius?: number;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={cn(
        "group/spotlight relative overflow-hidden rounded-2xl bg-[#0A0A1F] border border-[#1E1E3F]",
        className
      )}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover/spotlight:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${radius}px circle at ${mouseX}px ${mouseY}px,
              rgba(108, 99, 255, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
