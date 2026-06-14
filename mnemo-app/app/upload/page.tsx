"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Upload, Check, Loader2, AlertCircle, FileText } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";

const STEPS = [
  "Uploading PDF",
  "Extracting Concepts",
  "Generating Flashcards",
  "Complete",
];

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [step, setStep] = useState(-1);
  const [error, setError] = useState("");

  // ── FILE SELECTION ──────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      setError("Only PDF files are accepted");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("File too large. Max 10MB");
      return;
    }
    setError("");
    setFile(selected);
  };

  // ── DRAG AND DROP ───────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;
    if (dropped.type !== "application/pdf") {
      setError("Only PDF files are accepted");
      return;
    }
    if (dropped.size > 10 * 1024 * 1024) {
      setError("File too large. Max 10MB");
      return;
    }
    setError("");
    setFile(dropped);
  }, []);

  // ── UPLOAD PIPELINE ─────────────────
  const handleUpload = async () => {
    if (!file || step >= 0) return;
    setError("");
    setStep(0);

    try {
      // STEP 1 — Upload PDF
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(/\.pdf$/i, ""));

      const uploadRes = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error ?? "Upload failed");

      const documentId = uploadData.id;
      setStep(1);

      // STEP 2 — Process with Gemini
      const processRes = await fetch(`/api/process/${documentId}`, {
        method: "POST",
        credentials: "include",
      });

      const processData = await processRes.json();
      if (!processRes.ok)
        throw new Error(processData.error ?? "Processing failed");

      setStep(2);

      // Small delay for UX
      await new Promise((r) => setTimeout(r, 600));
      setStep(3);

      // Redirect after complete
      await new Promise((r) => setTimeout(r, 1200));
      router.push(`/universe/${documentId}`);
    } catch (err: any) {
      console.error("Upload pipeline error:", err);
      setError(err.message ?? "Something went wrong. Try again.");
      setStep(-1);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050510]">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-xl">
          {/* Header */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-8 text-center"
          >
            <h1 className="text-3xl font-bold text-[#F0F0FF] font-[Space_Grotesk]">
              Build New Universe
            </h1>
            <p className="text-[#8888AA] mt-2">
              PDF only — Gemini maps it into your 3D knowledge universe
            </p>
          </motion.div>

          {/* Hidden file input — positioned off-screen, not display:none */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            tabIndex={-1}
            onChange={handleFileChange}
          />

          {/* Drop Zone */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer ${
              dragActive
                ? "border-[#6C63FF] bg-[#6C63FF]/10 scale-[1.02]"
                : file
                ? "border-[#6BCB77] bg-[#6BCB77]/5"
                : "border-[#1E1E3F] hover:border-[#6C63FF]/50 hover:bg-[#6C63FF]/5"
            }`}
          >
            {file ? (
              <div className="space-y-2">
                <FileText size={40} className="mx-auto text-[#6BCB77]" />
                <p className="text-[#F0F0FF] font-semibold">{file.name}</p>
                <p className="text-xs text-[#8888AA]">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setError("");
                    // Reset input so same file can be re-selected
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-xs text-[#8888AA] hover:text-red-400 transition-all underline"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload size={40} className="mx-auto text-[#8888AA]" />
                <div>
                  <p className="text-[#F0F0FF] font-medium">
                    Drop your PDF here
                  </p>
                  <p className="text-sm text-[#8888AA] mt-1">
                    or{" "}
                    <span className="text-[#6C63FF] underline">
                      browse files
                    </span>
                  </p>
                </div>
                <p className="text-xs text-[#8888AA]">
                  Max 10MB — lecture notes, slides, textbook chapters
                </p>
              </div>
            )}
          </motion.div>

          {/* Upload Button */}
          <AnimatePresence>
            {file && step === -1 && (
              <motion.button
                type="button"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                onClick={handleUpload}
                className="w-full mt-4 py-4 bg-[#6C63FF] hover:bg-[#5B52E8] active:scale-[0.98] text-white font-semibold rounded-xl transition-all text-base"
              >
                Build Knowledge Universe
              </motion.button>
            )}
          </AnimatePresence>

          {/* Progress Steps */}
          <AnimatePresence>
            {step >= 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-6 space-y-4"
              >
                <p className="text-sm font-semibold text-[#F0F0FF] mb-4">
                  Building your universe...
                </p>
                {STEPS.map((s, i) => (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                        i < step
                          ? "bg-[#6BCB77]"
                          : i === step
                          ? "bg-[#6C63FF]"
                          : "bg-[#1E1E3F]"
                      }`}
                    >
                      {i < step ? (
                        <Check size={13} className="text-white" />
                      ) : i === step ? (
                        <Loader2
                          size={13}
                          className="animate-spin text-white"
                        />
                      ) : null}
                    </div>
                    <span
                      className={`text-sm transition-all ${
                        i <= step
                          ? "text-[#F0F0FF] font-medium"
                          : "text-[#8888AA]"
                      }`}
                    >
                      {s}
                    </span>
                    {i === step && (
                      <span className="ml-auto text-xs text-[#6C63FF] animate-pulse">
                        In progress...
                      </span>
                    )}
                    {i < step && (
                      <span className="ml-auto text-xs text-[#6BCB77]">
                        Done
                      </span>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
              >
                <AlertCircle
                  size={16}
                  className="text-red-400 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-red-400 text-sm font-medium">
                    Upload failed
                  </p>
                  <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setFile(null);
                      setStep(-1);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-xs text-red-400 underline mt-2 hover:text-red-300"
                  >
                    Try again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
