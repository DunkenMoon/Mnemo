"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ArrowLeft, BrainCircuit, Clock, Target, PlayCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "@/lib/auth-client";
import { WobbleCard } from "@/components/ui/aceternity/WobbleCard";
import { isFeatureEnabled } from "@/lib/features";

export default function ProgressPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { documentId } = useParams() as { documentId: string };

  const [progress, setProgress] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending || !session?.user) return;
    Promise.all([
      fetch(`/api/progress/${documentId}`).then(res => res.json()),
      fetch(`/api/progress/summary`).then(res => res.json())
    ]).then(([progData, sumData]) => {
      // Sort weakest first
      const sorted = progData.sort((a: any, b: any) => a.memoryStrength - b.memoryStrength);
      setProgress(sorted);
      setSummary(sumData);
      setLoading(false);
    }).catch(console.error);
  }, [documentId, isPending, session]);

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

  if (loading) return (
    <div className="flex min-h-screen bg-[#050510]">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#6C63FF]/30 border-t-[#6C63FF] rounded-full animate-spin" />
      </main>
    </div>
  );

  const strongCount = progress.filter(p => p.memoryStrength >= 0.6).length;
  const fadingCount = progress.filter(p => p.memoryStrength >= 0.3 && p.memoryStrength < 0.6).length;
  const weakCount = progress.filter(p => p.memoryStrength < 0.3).length;
  const avgMastery = progress.length > 0 ? (progress.reduce((acc, p) => acc + p.memoryStrength, 0) / progress.length) * 100 : 0;

  return (
    <div className="flex min-h-screen bg-[#050510]">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 min-h-screen overflow-y-auto">
        <div className="max-w-5xl mx-auto pb-12">
          
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <button className="bg-[#0A0A1F] border border-[#1E1E3F] p-2.5 rounded-full text-[#8888AA] hover:text-[#F0F0FF] transition-all">
                <ArrowLeft size={20} />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-[#F0F0FF] font-[Space_Grotesk]">Learning Analytics</h1>
              <p className="text-[#8888AA] text-sm mt-1">Track your memory retention and identify weak points.</p>
            </div>
          </div>

          {/* Summary Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-6 col-span-1 md:col-span-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#6C63FF]/10 rounded-full blur-3xl -mr-10 -mt-10" />
              <div className="relative z-10 flex items-center justify-between h-full">
                <div>
                  <span className="text-[#8888AA] text-sm uppercase tracking-wider font-bold mb-2 block">Overall Mastery</span>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-bold text-[#F0F0FF] font-[Space_Grotesk]">{Math.round(avgMastery)}%</span>
                  </div>
                </div>
                <div className="w-24 h-24 rounded-full border-[6px] border-[#1E1E3F] relative flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="42" stroke="#6C63FF" strokeWidth="6" fill="none" 
                            strokeDasharray={2 * Math.PI * 42} strokeDashoffset={(2 * Math.PI * 42) * (1 - avgMastery/100)} 
                            strokeLinecap="round" className="transition-all duration-1000" />
                  </svg>
                  <BrainCircuit size={28} className="text-[#6C63FF]" />
                </div>
              </div>
            </div>

            <div className="bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-6 flex flex-col justify-between">
              <span className="text-[#8888AA] text-sm uppercase tracking-wider font-bold">Node Status</span>
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#6BCB77]"/> <span className="text-[#F0F0FF]">Strong</span></div>
                  <span className="text-[#8888AA]">{strongCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#FFD93D]"/> <span className="text-[#F0F0FF]">Fading</span></div>
                  <span className="text-[#8888AA]">{fadingCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#FF6B6B]"/> <span className="text-[#F0F0FF]">Weak</span></div>
                  <span className="text-[#8888AA]">{weakCount}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-6 flex flex-col justify-between">
              <span className="text-[#8888AA] text-sm uppercase tracking-wider font-bold">Action Needed</span>
              <div className="mt-4 text-center">
                <span className="text-4xl font-bold text-[#FF6B6B] font-[Space_Grotesk]">{weakCount}</span>
                <p className="text-xs text-[#8888AA] mt-2">Concepts require immediate review to prevent forgetting.</p>
              </div>
            </div>
          </div>

          {/* AI Suggestions */}
          {summary?.suggestions && summary.suggestions.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-[#F0F0FF] font-[Space_Grotesk] mb-6 flex items-center gap-2">
                <Target size={20} className="text-[#00D4FF]" /> ATLAS Recommendations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {summary.suggestions.map((sug: any, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-xl p-5"
                  >
                    <h3 className="font-bold text-[#F0F0FF] mb-2">{sug.nodeLabel}</h3>
                    <p className="text-sm text-[#00D4FF]/80 mb-4 line-clamp-3">{sug.reason}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Node Grid */}
          <div>
            <h2 className="text-xl font-bold text-[#F0F0FF] font-[Space_Grotesk] mb-6">Concept Memory State</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {progress.map((prog, i) => {
                const strength = prog.memoryStrength;
                const isWeak = strength < 0.3;
                const isFading = strength >= 0.3 && strength < 0.6;
                const color = isWeak ? "#FF6B6B" : isFading ? "#FFD93D" : "#6BCB77";
                const label = isWeak ? "Needs Review" : isFading ? "Fading" : "Strong";

                const daysSince = prog.lastReviewedAt
                  ? Math.floor((Date.now() - new Date(prog.lastReviewedAt).getTime()) / 86400000)
                  : null;

                const cardInner = (
                  <>
                    <div className="mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-[#1E1E3F]"
                          style={{ color }}
                        >
                          {label}
                        </span>
                        <div className="flex items-center gap-1 text-[#8888AA] text-xs">
                          <Clock size={12} /> {Math.round(prog.timeSpentSeconds / 60)}m
                        </div>
                      </div>
                      <h3 className="font-medium text-[#F0F0FF] line-clamp-2">{prog.nodeLabel}</h3>
                      <p className="text-[10px] text-[#8888AA] mt-1">
                        {prog.correctAnswers ?? 0}/{prog.totalAttempts ?? 0} correct
                        {daysSince !== null ? ` · ${daysSince}d ago` : " · never reviewed"}
                      </p>
                    </div>

                    <div>
                      <div className="w-full h-1.5 bg-[#1E1E3F] rounded-full overflow-hidden mb-4">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${strength * 100}%`, backgroundColor: color }}
                        />
                      </div>

                      {isWeak && (
                        <Link href={`/flashcards/${documentId}?nodeId=${prog.nodeId}`}>
                          <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            className="w-full bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 text-[#FF6B6B] border border-[#FF6B6B]/30 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <PlayCircle size={16} /> Drill Now
                          </motion.button>
                        </Link>
                      )}
                    </div>
                  </>
                );

                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={prog.id}
                  >
                    {isFeatureEnabled("progressPage") ? (
                      <WobbleCard containerClassName="h-full" className="flex flex-col justify-between h-full">
                        {cardInner}
                      </WobbleCard>
                    ) : (
                      <div className="bg-[#0A0A1F] border border-[#1E1E3F] rounded-xl p-5 flex flex-col justify-between h-full">
                        {cardInner}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
