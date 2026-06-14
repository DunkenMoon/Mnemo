"use client";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Flame, Target, BookOpen, Brain, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface DocMastery {
  id: string;
  title: string;
  avgStrength: number;
  totalNodes: number;
  weakNodes: number;
}

const DAILY_GOAL = 10;

export default function ProgressOverviewPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [cardsToday, setCardsToday] = useState(0);
  const [streak, setStreak] = useState(0);
  const [docs, setDocs] = useState<DocMastery[]>([]);
  const [weakest, setWeakest] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending || !session?.user) return;
    Promise.all([
      fetch("/api/progress/today").then((r) => (r.ok ? r.json() : { cardsToday: 0, streak: 0 })),
      fetch("/api/progress/overview").then((r) => (r.ok ? r.json() : { docs: [], weakest: [] })),
    ])
      .then(([todayData, overviewData]) => {
        setCardsToday(todayData.cardsToday ?? 0);
        setStreak(todayData.streak ?? 0);
        setDocs(overviewData.docs ?? []);
        setWeakest(overviewData.weakest ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isPending, session]);

  const goalPercent = Math.min(100, Math.round((cardsToday / DAILY_GOAL) * 100));
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - goalPercent / 100);

  // Auth guards (after all hooks)
  if (isPending) {
    return (
      <div className="flex min-h-screen bg-[#050510] items-center justify-center">
        <div className="text-[#8888AA] animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    router.push("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#050510]">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-8 flex items-center justify-center">
          <div className="flex gap-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-4 h-4 rounded-full bg-[#6C63FF]"
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050510]">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-8 min-h-screen overflow-y-auto pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-[#F0F0FF] font-[Space_Grotesk]">
              Learning Progress
            </h1>
            <p className="text-[#8888AA] text-sm mt-1">
              Track your daily goals and memory retention.
            </p>
          </div>

          {/* Top Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Daily Goal Ring */}
            <div className="bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-6 flex items-center gap-6">
              <div className="relative w-28 h-28 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="#1E1E3F"
                    strokeWidth="8"
                    fill="none"
                  />
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke={goalPercent >= 100 ? "#6BCB77" : "#6C63FF"}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-[#F0F0FF] font-[Space_Grotesk]">
                    {cardsToday}
                  </span>
                  <span className="text-[10px] text-[#8888AA]">
                    / {DAILY_GOAL}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Target size={16} className="text-[#6C63FF]" />
                  <span className="text-sm font-semibold text-[#F0F0FF]">
                    Daily Goal
                  </span>
                </div>
                <p className="text-xs text-[#8888AA] leading-relaxed">
                  {goalPercent >= 100
                    ? "Goal complete! Keep going or rest."
                    : `${DAILY_GOAL - cardsToday} more cards to reach your daily goal.`}
                </p>
              </div>
            </div>

            {/* Streak */}
            <div className="bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-6 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background:
                      streak > 0
                        ? "linear-gradient(135deg, #FF6B6B20, #FFD93D20)"
                        : "#1E1E3F",
                  }}
                >
                  <Flame
                    size={24}
                    className={streak > 0 ? "text-[#FFD93D]" : "text-[#8888AA]"}
                  />
                </div>
                <div>
                  <span className="text-3xl font-bold text-[#F0F0FF] font-[Space_Grotesk]">
                    {streak}
                  </span>
                  <span className="text-sm text-[#8888AA] ml-1">
                    day{streak !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#8888AA]">
                {streak === 0
                  ? "Review some cards today to start a streak!"
                  : streak >= 7
                    ? "Incredible consistency! Your memory is growing."
                    : "Keep it up! Consistency is key to retention."}
              </p>
            </div>

            {/* Overview */}
            <div className="bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={16} className="text-[#A78BFA]" />
                <span className="text-sm font-semibold text-[#F0F0FF]">
                  Overview
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-bold text-[#F0F0FF] font-[Space_Grotesk]">
                    {docs.length}
                  </p>
                  <p className="text-[10px] text-[#8888AA] uppercase tracking-wider">
                    Universes
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#F0F0FF] font-[Space_Grotesk]">
                    {docs.reduce((a, d) => a + d.totalNodes, 0)}
                  </p>
                  <p className="text-[10px] text-[#8888AA] uppercase tracking-wider">
                    Concepts
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Per-Document Mastery */}
          {docs.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-[#F0F0FF] font-[Space_Grotesk] mb-6 flex items-center gap-2">
                <BookOpen size={18} className="text-[#6C63FF]" />
                Universe Mastery
              </h2>
              <div className="space-y-3">
                {docs.map((doc, i) => {
                  const pct = Math.round(doc.avgStrength * 100);
                  const barColor =
                    pct >= 60 ? "#6BCB77" : pct >= 30 ? "#FFD93D" : "#FF6B6B";
                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link href={`/universe/${doc.id}`}>
                        <div className="bg-[#0A0A1F] border border-[#1E1E3F] rounded-xl p-4 hover:border-[#6C63FF]/30 transition-all group cursor-pointer">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#F0F0FF] truncate group-hover:text-[#A78BFA] transition-colors">
                                {doc.title}
                              </p>
                              <p className="text-[10px] text-[#8888AA] mt-0.5">
                                {doc.totalNodes} concepts •{" "}
                                {doc.weakNodes > 0
                                  ? `${doc.weakNodes} need review`
                                  : "all strong"}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className="text-sm font-bold font-[Space_Grotesk]"
                                style={{ color: barColor }}
                              >
                                {pct}%
                              </span>
                              <ChevronRight
                                size={14}
                                className="text-[#8888AA] group-hover:text-[#6C63FF]"
                              />
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-[#1E1E3F] rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: barColor }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: i * 0.05 }}
                            />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weakest Concepts */}
          {weakest.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-[#F0F0FF] font-[Space_Grotesk] mb-6 flex items-center gap-2">
                <Target size={18} className="text-[#FF6B6B]" />
                Focus Areas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {weakest.map((w: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[#FF6B6B]/5 border border-[#FF6B6B]/15 rounded-xl p-5"
                  >
                    <p className="text-sm font-semibold text-[#F0F0FF] mb-1">
                      {w.label}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-1 bg-[#1E1E3F] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#FF6B6B]"
                          style={{
                            width: `${Math.round((w.strength ?? 0) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-[#FF6B6B] font-[Fira_Code]">
                        {Math.round((w.strength ?? 0) * 100)}%
                      </span>
                    </div>
                    {w.documentId && (
                      <Link
                        href={`/flashcards/${w.documentId}?nodeId=${w.nodeId}`}
                        className="text-[10px] text-[#FF6B6B] hover:text-[#FF8888] font-medium"
                      >
                        Drill now →
                      </Link>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {docs.length === 0 && (
            <div className="text-center py-20">
              <Brain size={48} className="text-[#6C63FF]/30 mx-auto mb-4" />
              <p className="text-[#F0F0FF] font-semibold mb-2">
                No progress yet
              </p>
              <p className="text-[#8888AA] text-sm mb-6">
                Upload a document and start studying to see your progress here.
              </p>
              <Link
                href="/upload"
                className="text-[#6C63FF] text-sm hover:text-[#A78BFA]"
              >
                Upload your first document →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
