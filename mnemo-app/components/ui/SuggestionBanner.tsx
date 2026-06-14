"use client";

import { useEffect, useState } from "react";
import { InfiniteMovingCards } from "@/components/ui/aceternity/InfiniteMovingCards";
import { isFeatureEnabled } from "@/lib/features";
import { Target } from "lucide-react";

interface Suggestion {
  concept: string;
  reason: string;
}

export function SuggestionBanner() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFeatureEnabled("suggestions")) {
      setLoading(false);
      return;
    }
    fetch("/api/progress/summary", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { suggestions: [] }))
      .then((data) => {
        const raw = data.suggestions ?? [];
        setSuggestions(
          raw.map((s: { concept?: string; nodeLabel?: string; reason: string }) => ({
            concept: s.concept ?? s.nodeLabel ?? "Concept",
            reason: s.reason,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!isFeatureEnabled("suggestions") || loading || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Target size={16} className="text-[#00D4FF]" />
        <h2 className="text-sm font-semibold text-[#8888AA] uppercase tracking-widest font-[Fira_Code]">
          Review Suggestions
        </h2>
      </div>
      <InfiniteMovingCards items={suggestions} speed="slow" />
    </div>
  );
}
