"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlowingEffect({
  children,
  className,
  blur = 12,
  spread = 40,
  glow = true,
}: {
  children: ReactNode;
  className?: string;
  blur?: number;
  spread?: number;
  glow?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      {glow && (
        <div
          className="pointer-events-none absolute -inset-[1px] rounded-[inherit] opacity-70"
          style={{
            background:
              "linear-gradient(135deg, rgba(108,99,255,0.5), rgba(0,212,255,0.3), rgba(167,139,250,0.4))",
            filter: `blur(${blur}px)`,
            transform: `scale(${1 + spread / 1000})`,
          }}
        />
      )}
      <div className="relative rounded-[inherit]">{children}</div>
    </div>
  );
}
