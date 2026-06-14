"use client";

import { cn } from "@/lib/utils";

export function InfiniteMovingCards({
  items,
  direction = "left",
  speed = "slow",
  pauseOnHover = true,
  className,
}: {
  items: { concept: string; reason: string }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) {
  const speedMap = { fast: "20s", normal: "40s", slow: "80s" };

  return (
    <div
      className={cn(
        "relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]",
        className
      )}
    >
      <ul
        className={cn(
          "flex min-w-full shrink-0 gap-4 py-2 w-max flex-nowrap animate-scroll-left",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
        style={{ animationDuration: speedMap[speed] }}
      >
        {[...items, ...items].map((item, idx) => (
          <li
            key={`${item.concept}-${idx}`}
            className="w-[280px] max-w-full shrink-0 rounded-xl border border-[#1E1E3F] bg-[#0A0A1F] px-4 py-3"
          >
            <p className="text-sm font-semibold text-[#F0F0FF] truncate">{item.concept}</p>
            <p className="text-xs text-[#8888AA] mt-1 line-clamp-2">{item.reason}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
