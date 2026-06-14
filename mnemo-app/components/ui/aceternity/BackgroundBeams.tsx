"use client";

import { cn } from "@/lib/utils";

export function BackgroundBeams({ className }: { className?: string }) {
  const paths = [
    "M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875",
    "M-373 -197C-373 -197 -305 208 159 335C623 462 691 867 691 867",
    "M-366 -205C-366 -205 -298 200 166 327C630 454 698 859 698 859",
  ];

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      <svg
        className="absolute inset-0 h-full w-full"
        width="100%"
        height="100%"
        viewBox="0 0 696 316"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {paths.map((path, i) => (
          <path
            key={i}
            d={path}
            stroke={`url(#gradient-${i})`}
            strokeOpacity="0.15"
            strokeWidth="0.5"
          />
        ))}
        <defs>
          {paths.map((_, i) => (
            <linearGradient key={i} id={`gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop stopColor="#6C63FF" stopOpacity="0" />
              <stop offset="50%" stopColor="#6C63FF" />
              <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-[#050510]" />
    </div>
  );
}
