"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { CardSpotlight } from "@/components/ui/aceternity/CardSpotlight";
import { MovingBorder } from "@/components/ui/aceternity/MovingBorder";

const Canvas = dynamic(() => import("@react-three/fiber").then((m) => m.Canvas), { ssr: false });
const Stars = dynamic(() => import("@react-three/drei").then((m) => m.Stars), { ssr: false });

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (redirect) {
      sessionStorage.setItem("redirectAfterLogin", redirect);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await signIn.email({ email, password });
      if (error) {
        setError(error.message || "Failed to sign in. Please check your credentials.");
      } else {
        const redirectUrl = sessionStorage.getItem("redirectAfterLogin") || "/home";
        sessionStorage.removeItem("redirectAfterLogin");
        router.push(redirectUrl);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050510] flex items-center justify-center overflow-hidden">
      {/* 3D Star Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 1] }}>
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        </Canvas>
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 w-full max-w-[420px] px-4">
        <CardSpotlight className="p-0 border-[rgba(108,99,255,0.3)]">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="bg-[#0A0A1F]/80 backdrop-blur-2xl rounded-2xl p-10 shadow-[0_0_60px_rgba(108,99,255,0.08),0_0_120px_rgba(0,212,255,0.04)]"
        >
          {/* Header section */}
          <div className="flex flex-col items-center mb-8">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#00D4FF] flex items-center justify-center mb-4"
            >
              <Sparkles size={20} className="text-white" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-[Space_Grotesk] text-3xl font-bold bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] bg-clip-text text-transparent mb-1"
            >
              mnemo
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-[#8888AA] font-inter text-center"
            >
              Your lectures, remembered forever
            </motion.p>
          </div>

          {/* Form section */}
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-xs text-[#8888AA] uppercase tracking-widest mb-1.5 font-inter">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8888AA]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0F0F2E] border border-[#1E1E3F] text-[#F0F0FF] text-sm placeholder:text-[#8888AA] focus:outline-none focus:border-[#6C63FF] focus:shadow-[0_0_0_3px_rgba(108,99,255,0.15)] transition-all duration-300"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-xs text-[#8888AA] uppercase tracking-widest mb-1.5 font-inter">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8888AA]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0F0F2E] border border-[#1E1E3F] text-[#F0F0FF] text-sm placeholder:text-[#8888AA] focus:outline-none focus:border-[#6C63FF] focus:shadow-[0_0_0_3px_rgba(108,99,255,0.15)] transition-all duration-300"
                />
              </div>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-lg px-4 py-2"
                >
                  <p className="text-[#FF6B6B] text-xs text-center">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <MovingBorder containerClassName="w-full mt-2">
              <motion.button
                type="submit"
                disabled={loading}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 font-semibold text-sm text-white"
              >
                {loading ? (
                  <div className="flex justify-center items-center gap-1 h-5">
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      className="w-1.5 h-1.5 bg-white rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      className="w-1.5 h-1.5 bg-white rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      className="w-1.5 h-1.5 bg-white rounded-full"
                    />
                  </div>
                ) : (
                  "Sign in"
                )}
              </motion.button>
            </MovingBorder>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center"
          >
            <p className="text-[#8888AA] text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="text-[#6C63FF] hover:text-[#A78BFA] transition-colors font-medium">
                Sign up
              </Link>
            </p>
          </motion.div>
        </motion.div>
        </CardSpotlight>
      </div>
    </div>
  );
}
