"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function MovingBorder({
  children,
  className,
  containerClassName,
  borderClassName,
  duration = 3000,
}: {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
  duration?: number;
}) {
  return (
    <div
      className={cn(
        "relative p-[1px] overflow-hidden rounded-xl bg-transparent",
        containerClassName
      )}
    >
      <div
        className={cn(
          "absolute inset-[-100%] animate-[spin_3s_linear_infinite]",
          borderClassName
        )}
        style={{
          background: `conic-gradient(from 90deg at 50% 50%, #050510 0%, #6C63FF 25%, #00D4FF 50%, #A78BFA 75%, #050510 100%)`,
          animationDuration: `${duration}ms`,
        }}
      />
      <div
        className={cn(
          "relative z-10 rounded-[11px] bg-[#6C63FF] text-white font-medium",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
