"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DocumentCard } from "@/components/ui/DocumentCard";
import { DailyGoalWidget } from "@/components/ui/DailyGoalWidget";
import { SuggestionBanner } from "@/components/ui/SuggestionBanner";
import { Spotlight } from "@/components/ui/aceternity/Spotlight";
import { BackgroundBeams } from "@/components/ui/aceternity/BackgroundBeams";
import { Upload, Brain, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session === null) router.push("/login");
  }, [session, router]);

  useEffect(() => {
    fetch("/api/documents")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        setDocuments(Array.isArray(d) ? d : []);
      })
      .catch(err => {
        console.error("Dashboard fetch failed:", err);
        setDocuments([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Polling for processing documents
  useEffect(() => {
    const poll = setInterval(() => {
      if (documents.some((d: any) => d.status === "processing" || d.status === "pending")) {
        fetch("/api/documents", { credentials: "include" })
          .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          })
          .then(data => setDocuments(Array.isArray(data) ? data : []))
          .catch(err => {
            console.error("Polling fetch failed:", err);
          });
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [documents]);

  const handleRetry = async (docId: string) => {
    await fetch(`/api/process/${docId}`, { method: "POST", credentials: "include" });
    setLoading(true);
    fetch("/api/documents")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        setDocuments(Array.isArray(d) ? d : []);
      })
      .catch(err => {
        console.error("Retry fetch failed:", err);
        setDocuments([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const totalUniverses = documents.length;
  const avgMastery =
    totalUniverses > 0
      ? Math.round(
          documents.reduce(
            (acc, doc) => acc + (doc.masteryScore ?? 0),
            0
          ) / totalUniverses
        )
      : 0;
  const totalNodes = documents.reduce(
    (acc, doc) => acc + (doc.totalNodes ?? 0),
    0
  );

  // Section 4B: Group documents by subject
  const grouped = documents.reduce(
    (acc: Record<string, any[]>, doc) => {
      const key = doc.subject ?? "__uncategorized__";
      if (!acc[key]) acc[key] = [];
      acc[key].push(doc);
      return acc;
    },
    {}
  );

  // Sort subjects: named first, uncategorized last
  const sortedSubjects = Object.keys(grouped).sort((a, b) => {
    if (a === "__uncategorized__") return 1;
    if (b === "__uncategorized__") return -1;
    return a.localeCompare(b);
  });

  const handleAddSubject = async (docId: string) => {
    const subject = prompt("Enter subject:");
    if (!subject) return;
    await fetch(`/api/documents/${docId}/subject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject }),
    });
    setLoading(true);
    fetch("/api/documents")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        setDocuments(Array.isArray(d) ? d : []);
      })
      .catch(err => {
        console.error("Subject update fetch failed:", err);
        setDocuments([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const containerVariant = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-6xl mx-auto px-4 pb-12"
    >
      {/* Hero section */}
      <div className="relative w-full pt-12 pb-8 overflow-hidden">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#6C63FF" />
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-[Space_Grotesk] text-4xl font-bold bg-gradient-to-r from-[#F0F0FF] via-[#A78BFA] to-[#00D4FF] bg-clip-text text-transparent"
        >
          Your Knowledge Universe
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[#8888AA] text-lg mt-2 font-inter"
        >
          Upload a lecture. Watch it become a living 3D universe.
        </motion.p>
      </div>

      {/* Daily Goal Widget */}
      {documents.length > 0 && !loading && (
        <>
          <SuggestionBanner />
          <DailyGoalWidget />
        </>
      )}

      {/* Stats bar */}
      {documents.length > 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-4 mb-8"
        >
          <div className="bg-[#0A0A1F] border border-[#1E1E3F] rounded-xl px-6 py-3 min-w-[140px]">
            <div className="text-2xl font-bold text-[#A78BFA] font-[Space_Grotesk]">
              {totalUniverses}
            </div>
            <div className="text-xs text-[#8888AA] uppercase tracking-wide mt-1">
              Total Universes
            </div>
          </div>
          <div className="bg-[#0A0A1F] border border-[#1E1E3F] rounded-xl px-6 py-3 min-w-[140px]">
            <div className="text-2xl font-bold text-[#A78BFA] font-[Space_Grotesk]">
              {avgMastery}%
            </div>
            <div className="text-xs text-[#8888AA] uppercase tracking-wide mt-1">
              Avg Mastery
            </div>
          </div>
          <div className="bg-[#0A0A1F] border border-[#1E1E3F] rounded-xl px-6 py-3 min-w-[140px]">
            <div className="text-2xl font-bold text-[#A78BFA] font-[Space_Grotesk]">
              {totalNodes}
            </div>
            <div className="text-xs text-[#8888AA] uppercase tracking-wide mt-1">
              Total Nodes
            </div>
          </div>
        </motion.div>
      )}

      {/* Grid Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[220px] rounded-2xl animate-shimmer border border-[#1E1E3F] bg-gradient-to-r from-[#0A0A1F] via-[#1E1E3F] to-[#0A0A1F] bg-[length:200%_100%]"
            />
          ))}
        </div>
      ) : documents.length > 0 ? (
        <motion.div
          variants={containerVariant}
          initial="hidden"
          animate="show"
        >
          {/* Upload CTA Card */}
          <motion.div
            variants={itemVariant}
            onClick={() => router.push("/upload")}
            whileHover={{
              borderColor: "rgba(108,99,255,0.8)",
              boxShadow: "0 0 30px rgba(108,99,255,0.15)",
            }}
            className="bg-[#0A0A1F] border-2 border-dashed border-[#6C63FF]/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors min-h-[140px] mb-8"
          >
            <Upload size={32} className="text-[#6C63FF]" />
            <h3 className="text-[#F0F0FF] font-semibold mt-3 text-lg">
              Upload New Lecture
            </h3>
            <p className="text-xs text-[#8888AA] mt-1">PDF up to 50MB</p>
          </motion.div>

          {/* Grouped Document Cards */}
          {sortedSubjects.map((subject) => {
            const subjectDocs = grouped[subject];
            const isUncategorized = subject === "__uncategorized__";
            const displayName = isUncategorized ? "Uncategorized" : subject;

            return (
              <div key={subject} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isUncategorized ? "bg-[#8888AA]" : "bg-[#6C63FF]"
                    }`}
                  />
                  {isUncategorized && (
                    <Tag size={14} className="text-[#8888AA]" />
                  )}
                  <h2 className="text-sm font-semibold text-[#8888AA] uppercase tracking-widest font-[Fira_Code]">
                    {displayName}
                  </h2>
                  <div className="flex-1 h-px bg-[#1E1E3F]" />
                  <span className="text-xs text-[#8888AA]">
                    {subjectDocs.length} doc
                    {subjectDocs.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {subjectDocs.map((doc: any) => (
                      <motion.div
                        key={doc.id}
                        variants={itemVariant}
                        layout
                        exit={{ x: -30, opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                      >
                        <DocumentCard
                          id={doc.id}
                          title={doc.title}
                          subject={doc.subject}
                          nodeCount={doc.totalNodes ?? 0}
                          masteryScore={doc.masteryScore ?? 0}
                          status={doc.status ?? "complete"}
                          onDelete={() =>
                            setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
                          }
                          onRetry={() => handleRetry(doc.id)}
                        />
                        {isUncategorized && (
                          <button
                            onClick={() => handleAddSubject(doc.id)}
                            className="text-xs text-[#8888AA] hover:text-[#6C63FF] transition-colors mt-1"
                          >
                            + Add subject
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </motion.div>
      ) : (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative flex flex-col items-center justify-center py-32 px-4 mt-8 overflow-hidden rounded-2xl"
        >
          <BackgroundBeams />
          <Brain size={48} className="text-[#6C63FF]/40 mb-6" />
          <h3 className="text-2xl font-bold text-[#8888AA] font-[Space_Grotesk] mb-2">
            No universes yet
          </h3>
          <p className="text-[#8888AA] text-center mb-8">
            Upload your first lecture to begin
          </p>
          <Link href="/upload">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#6C63FF] hover:bg-[#A78BFA] text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Upload a lecture →
            </motion.button>
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
