"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface Star {
  id: number;
  top: number;
  left: number;
  delay: number;
  duration: number;
}

export function ShootingStars({
  starColor = "#6C63FF",
  trailColor = "#00D4FF",
  minSpeed = 10,
  maxSpeed = 30,
  className,
}: {
  starColor?: string;
  trailColor?: string;
  minSpeed?: number;
  maxSpeed?: number;
  className?: string;
}) {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const generated: Star[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: minSpeed + Math.random() * (maxSpeed - minSpeed),
    }));
    setStars(generated);
  }, [minSpeed, maxSpeed]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute h-[1px] animate-shooting-star opacity-0"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: "80px",
            background: `linear-gradient(90deg, transparent, ${trailColor}, ${starColor})`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export function StarsBackground({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {Array.from({ length: 80 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            width: Math.random() > 0.8 ? 2 : 1,
            height: Math.random() > 0.8 ? 2 : 1,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.5 + 0.1,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
}
