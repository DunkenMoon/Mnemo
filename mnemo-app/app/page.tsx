"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useMotionValueEvent, useInView } from "framer-motion";
import { Sparkles, Globe2, Mic, Users, Glasses, Layers, BarChart3, ChevronDown, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Canvas = dynamic(() => import("@react-three/fiber").then((m) => m.Canvas), { ssr: false });
const Stars = dynamic(() => import("@react-three/drei").then((m) => m.Stars), { ssr: false });
const AnimatedTorus = dynamic(
  () => import("@/components/3d/AnimatedTorus").then((m) => m.AnimatedTorus),
  { ssr: false }
);


export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const router = useRouter();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 60);
  });

  const heroContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 }
    }
  };

  const heroItem = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } }
  };

  const bentoRef = useRef(null);
  const isBentoInView = useInView(bentoRef, { once: true, margin: "-100px" });

  const stepsRef = useRef(null);
  const isStepsInView = useInView(stepsRef, { once: true, margin: "-100px" });

  const finalCtaRef = useRef(null);
  const isFinalCtaInView = useInView(finalCtaRef, { once: true, margin: "-100px" });

  return (
    <main className="w-full bg-[#050510] text-[#F0F0FF] overflow-x-hidden">
      
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SECTION 1 — NAVBAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ease-in-out ${scrolled ? 'bg-[#050510]/80 backdrop-blur-xl border-b border-[rgba(108,99,255,0.15)]' : 'bg-transparent border-b-0'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C63FF] to-[#00D4FF] flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-[Space_Grotesk] font-bold text-xl bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] bg-clip-text text-transparent">
              mnemo
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-[#8888AA] hover:text-[#F0F0FF] transition-colors">
              Sign in
            </Link>
            <motion.button
              whileHover={{ y: -2, boxShadow: "0 0 20px rgba(108,99,255,0.4)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/signup')}
              className="bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all"
            >
              Get started free
            </motion.button>
          </div>
        </div>
      </nav>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SECTION 2 — HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative w-full h-screen min-h-[800px] flex items-center justify-center pt-20">
        {/* Layer 1: Base is body bg */}
        
        {/* Layer 2: R3F Canvas */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 15] }}>
            <ambientLight intensity={0.5} />
            <Stars count={6000} depth={80} factor={5} fade speed={0.2} />
            <AnimatedTorus />
          </Canvas>
        </div>

        {/* Layer 3: Radial Gradient */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none" 
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(108,99,255,0.12) 0%, transparent 70%)" }}
        />

        {/* Hero Content */}
        <motion.div 
          variants={heroContainer}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-4xl mx-auto px-6 flex flex-col items-center text-center"
        >
          <motion.div variants={heroItem} className="bg-[#6C63FF]/10 border border-[#6C63FF]/30 rounded-full px-4 py-1.5 flex items-center gap-2 mb-8">
            <Sparkles size={14} className="text-[#6C63FF]" />
            <span className="text-xs text-[#A78BFA] font-medium tracking-wide">AI-Powered Spatial Learning</span>
          </motion.div>

          <motion.h1 variants={heroItem} className="font-[Space_Grotesk] text-6xl md:text-8xl font-bold tracking-[-0.02em] leading-[1.05] mb-6">
            <span className="block text-[#F0F0FF]">Your lectures,</span>
            <span className="block bg-gradient-to-r from-[#6C63FF] via-[#A78BFA] to-[#00D4FF] bg-clip-text text-transparent pb-2">remembered forever.</span>
          </motion.h1>

          <motion.p variants={heroItem} className="text-[#8888AA] text-xl max-w-lg mx-auto font-inter leading-[1.6] mb-10">
            Upload any lecture PDF. Watch it explode into a navigable 3D knowledge universe. Study with AI. Remember everything.
          </motion.p>

          <motion.div variants={heroItem} className="flex flex-col sm:flex-row items-center gap-4">
            <motion.button
              onClick={() => router.push('/signup')}
              whileHover={{ y: -3, boxShadow: "0 0 50px rgba(108,99,255,0.5)" }}
              whileTap={{ scale: 0.97 }}
              style={{ boxShadow: "0 0 30px rgba(108,99,255,0.35)" }}
              className="bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] px-8 py-4 rounded-2xl text-white font-semibold text-base transition-all"
            >
              Build your universe &rarr;
            </motion.button>
            <motion.button
              onClick={() => {
                document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
              }}
              whileHover={{ borderColor: "rgba(108,99,255,0.8)", backgroundColor: "rgba(108,99,255,0.08)", y: -2 }}
              className="bg-transparent border border-[rgba(108,99,255,0.3)] px-8 py-4 rounded-2xl text-[#A78BFA] font-semibold transition-all"
            >
              Watch demo
            </motion.button>
          </motion.div>

          <motion.div variants={heroItem} className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#050510] bg-[#FF6B6B] flex items-center justify-center text-[10px] font-bold">AJ</div>
              <div className="w-8 h-8 rounded-full border-2 border-[#050510] bg-[#FFD93D] flex items-center justify-center text-[10px] font-bold text-black">SK</div>
              <div className="w-8 h-8 rounded-full border-2 border-[#050510] bg-[#6BCB77] flex items-center justify-center text-[10px] font-bold">RK</div>
            </div>
            <span className="text-xs text-[#8888AA]">Joined by 2,400+ students this week</span>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#8888AA]/50"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <ChevronDown size={24} />
          </motion.div>
        </motion.div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SECTION 3 — FEATURE BENTO GRID ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="features" className="py-32 px-6 max-w-7xl mx-auto" ref={bentoRef}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isBentoInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-[Space_Grotesk] text-4xl font-bold text-[#F0F0FF]">Everything you need to own any subject</h2>
          <p className="text-[#8888AA] mt-3">One upload. Infinite ways to learn.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Card 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={isBentoInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.1 }}
            whileHover={{ borderColor: "rgba(108,99,255,0.4)", boxShadow: "0 0 40px rgba(108,99,255,0.08)", y: -2 }}
            className="md:col-span-7 bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-8 min-h-[320px] overflow-hidden relative flex flex-col transition-colors group"
          >
            <div className="w-12 h-12 bg-[#6C63FF]/15 rounded-xl p-2.5 text-[#6C63FF] mb-4">
              <Globe2 size={28} />
            </div>
            <h3 className="font-[Space_Grotesk] text-xl font-bold text-[#F0F0FF]">3D Knowledge Universe</h3>
            <p className="text-[#8888AA] text-sm mt-2 leading-relaxed max-w-md">Navigate your lecture as a living galaxy. Concepts are nodes. Relationships are beams of light. Your memory is the color.</p>
            
            <div className="mt-auto pt-8 flex justify-center items-center gap-8 relative">
              {/* Pure CSS Visual */}
              <div className="absolute w-full h-[1px] border-t border-dashed border-[#1E1E3F] top-1/2 -z-10" />
              <div className="w-4 h-4 rounded-full bg-[#FF6B6B] shadow-[0_0_15px_#FF6B6B] animate-pulse" />
              <div className="w-6 h-6 rounded-full bg-[#FFD93D] shadow-[0_0_20px_#FFD93D] animate-pulse" style={{ animationDelay: "0.5s" }} />
              <div className="w-5 h-5 rounded-full bg-[#6BCB77] shadow-[0_0_15px_#6BCB77] animate-pulse" style={{ animationDelay: "1s" }} />
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={isBentoInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.2 }}
            whileHover={{ borderColor: "rgba(108,99,255,0.4)", boxShadow: "0 0 40px rgba(108,99,255,0.08)", y: -2 }}
            className="md:col-span-5 bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-8 min-h-[320px] overflow-hidden relative transition-colors"
            style={{ backgroundImage: "linear-gradient(135deg, rgba(108,99,255,0.05) 0%, transparent 60%)" }}
          >
            <div className="w-12 h-12 bg-[#A78BFA]/15 rounded-xl p-2.5 text-[#A78BFA] mb-4">
              <Mic size={28} />
            </div>
            <h3 className="font-[Space_Grotesk] text-xl font-bold text-[#F0F0FF]">ATLAS Voice AI</h3>
            <p className="text-[#8888AA] text-sm mt-2 leading-relaxed">Ask anything. Atlas knows your memory state and answers in 2 sentences. Then highlights the node in your universe.</p>
            
            <div className="mt-auto pt-8 flex justify-center">
              <div className="relative flex items-center justify-center w-16 h-16">
                <div className="absolute inset-0 bg-[#A78BFA] rounded-full opacity-20 animate-ping" />
                <div className="w-12 h-12 bg-gradient-to-tr from-[#6C63FF] to-[#00D4FF] rounded-full shadow-[0_0_30px_rgba(108,99,255,0.5)]" />
              </div>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={isBentoInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.3 }}
            whileHover={{ borderColor: "rgba(108,99,255,0.4)", boxShadow: "0 0 40px rgba(108,99,255,0.08)", y: -2 }}
            className="md:col-span-5 bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-8 overflow-hidden relative transition-colors"
          >
            <div className="w-12 h-12 bg-[#00D4FF]/15 rounded-xl p-2.5 text-[#00D4FF] mb-4">
              <Users size={28} />
            </div>
            <h3 className="font-[Space_Grotesk] text-xl font-bold text-[#F0F0FF]">Study Together in 3D</h3>
            <p className="text-[#8888AA] text-sm mt-2 leading-relaxed">Invite anyone. See their cursor floating in your universe in real time.</p>
            
            <div className="mt-8 flex justify-center gap-6 h-16 items-center">
              <motion.div animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 2 }} className="w-4 h-4 rotate-45 bg-[#FF6B6B]" />
              <motion.div animate={{ y: [5, -5, 5] }} transition={{ repeat: Infinity, duration: 2.5 }} className="w-4 h-4 rotate-45 bg-[#00D4FF]" />
              <motion.div animate={{ y: [-3, 6, -3] }} transition={{ repeat: Infinity, duration: 1.8 }} className="w-4 h-4 rotate-45 bg-[#6BCB77]" />
            </div>
          </motion.div>

          {/* Card 4 */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={isBentoInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.4 }}
            whileHover={{ borderColor: "rgba(108,99,255,0.4)", boxShadow: "0 0 40px rgba(108,99,255,0.08)", y: -2 }}
            className="md:col-span-7 bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-8 overflow-hidden relative transition-colors flex md:flex-row flex-col justify-between items-center"
          >
            <div className="flex-1">
              <div className="w-12 h-12 bg-[#6BCB77]/15 rounded-xl p-2.5 text-[#6BCB77] mb-4">
                <Glasses size={28} />
              </div>
              <h3 className="font-[Space_Grotesk] text-xl font-bold text-[#F0F0FF]">AR on Any Phone</h3>
              <p className="text-[#8888AA] text-sm mt-2 leading-relaxed max-w-sm">Scan the QR code. Point your camera at your desk. Your knowledge graph appears in your room. No app required.</p>
            </div>
            <div className="mt-6 md:mt-0 w-24 h-40 border-4 border-[#1E1E3F] rounded-3xl relative flex items-center justify-center p-2">
              <div className="absolute top-1 w-8 h-1 bg-[#1E1E3F] rounded-full" />
              <div className="flex gap-2 flex-wrap justify-center items-center h-full">
                <div className="w-2 h-2 rounded-full bg-[#00D4FF]" />
                <div className="w-2 h-2 rounded-full bg-[#A78BFA]" />
                <div className="w-2 h-2 rounded-full bg-[#6C63FF]" />
                <div className="w-2 h-2 rounded-full bg-[#FFD93D]" />
              </div>
            </div>
          </motion.div>

          {/* Card 5 */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={isBentoInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.5 }}
            whileHover={{ borderColor: "rgba(108,99,255,0.4)", boxShadow: "0 0 40px rgba(108,99,255,0.08)", y: -2 }}
            className="md:col-span-6 bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-8 transition-colors"
          >
            <div className="w-12 h-12 bg-[#FFD93D]/15 rounded-xl p-2.5 text-[#FFD93D] mb-4">
              <Layers size={28} />
            </div>
            <h3 className="font-[Space_Grotesk] text-xl font-bold text-[#F0F0FF]">Adaptive Flashcards</h3>
            <p className="text-[#8888AA] text-sm mt-2 leading-relaxed">Spaced repetition that actually knows which nodes are fading in your universe.</p>
          </motion.div>

          {/* Card 6 */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={isBentoInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.6 }}
            whileHover={{ borderColor: "rgba(108,99,255,0.4)", boxShadow: "0 0 40px rgba(108,99,255,0.08)", y: -2 }}
            className="md:col-span-6 bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-8 transition-colors"
          >
            <div className="w-12 h-12 bg-[#FF6B6B]/15 rounded-xl p-2.5 text-[#FF6B6B] mb-4">
              <BarChart3 size={28} />
            </div>
            <h3 className="font-[Space_Grotesk] text-xl font-bold text-[#F0F0FF]">Memory Analytics</h3>
            <p className="text-[#8888AA] text-sm mt-2 leading-relaxed">See exactly which concepts are green, yellow, or red. Fix the red ones first.</p>
          </motion.div>

        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SECTION 4 — HOW IT WORKS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="demo" className="py-32 bg-[#080818] px-6" ref={stepsRef}>
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={isStepsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="font-[Space_Grotesk] text-4xl font-bold text-center bg-gradient-to-r from-[#F0F0FF] via-[#A78BFA] to-[#00D4FF] bg-clip-text text-transparent mb-24"
          >
            From PDF to universe in 60 seconds
          </motion.h2>

          <div className="relative flex flex-col md:flex-row justify-between gap-12 md:gap-4">
            {/* Desktop Connector Line */}
            <div className="hidden md:block absolute top-[52px] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] opacity-30 z-0" />

            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={isStepsInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.1, type: "spring", stiffness: 180, damping: 22 }}
              className="relative z-10 flex flex-col items-center text-center flex-1"
            >
              <div className="absolute -top-12 opacity-15 font-[Space_Grotesk] text-6xl font-bold bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] bg-clip-text text-transparent select-none">01</div>
              <div className="w-16 h-16 rounded-2xl bg-[#0A0A1F] border border-[#1E1E3F] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(108,99,255,0.1)]">
                <Upload size={24} className="text-[#6C63FF]" />
              </div>
              <h3 className="text-xl font-semibold text-[#F0F0FF] mb-2 font-[Space_Grotesk]">Drop your PDF</h3>
              <p className="text-[#8888AA] text-sm max-w-xs">Upload any lecture slides, notes, or paper up to 50MB.</p>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={isStepsInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.25, type: "spring", stiffness: 180, damping: 22 }}
              className="relative z-10 flex flex-col items-center text-center flex-1"
            >
              <div className="absolute -top-12 opacity-15 font-[Space_Grotesk] text-6xl font-bold bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] bg-clip-text text-transparent select-none">02</div>
              <div className="w-16 h-16 rounded-2xl bg-[#0A0A1F] border border-[#1E1E3F] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(108,99,255,0.1)]">
                <Globe2 size={24} className="text-[#A78BFA]" />
              </div>
              <h3 className="text-xl font-semibold text-[#F0F0FF] mb-2 font-[Space_Grotesk]">AI maps your concepts</h3>
              <p className="text-[#8888AA] text-sm max-w-xs">We extract key topics and build a semantic relationship graph.</p>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={isStepsInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.4, type: "spring", stiffness: 180, damping: 22 }}
              className="relative z-10 flex flex-col items-center text-center flex-1"
            >
              <div className="absolute -top-12 opacity-15 font-[Space_Grotesk] text-6xl font-bold bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] bg-clip-text text-transparent select-none">03</div>
              <div className="w-16 h-16 rounded-2xl bg-[#0A0A1F] border border-[#1E1E3F] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(108,99,255,0.1)]">
                <Sparkles size={24} className="text-[#00D4FF]" />
              </div>
              <h3 className="text-xl font-semibold text-[#F0F0FF] mb-2 font-[Space_Grotesk]">Study in 3D space</h3>
              <p className="text-[#8888AA] text-sm max-w-xs">Navigate, chat with Atlas, and watch your memory strength grow.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SECTION 5 — SOCIAL PROOF ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-24 bg-[#050510] px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold font-[Space_Grotesk] text-center mb-16 max-w-2xl mx-auto text-[#F0F0FF]">
            Students who use spatial memory retain 40% more
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              whileHover={{ borderColor: "rgba(108,99,255,0.3)", y: -2 }}
              className="bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-6 transition-all"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-[#FFD93D]" />)}
              </div>
              <p className="text-[#F0F0FF] text-sm leading-relaxed mb-6 font-medium">
                "I uploaded my algorithms lecture and 20 minutes later I could navigate the entire topic like a map. Nothing else comes close."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#6C63FF]/30 flex items-center justify-center text-xs font-bold text-[#A78BFA]">AM</div>
                <div>
                  <div className="text-sm font-semibold text-[#F0F0FF]">Arjun M.</div>
                  <div className="text-xs text-[#8888AA]">Computer Science, IIT Bombay</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ borderColor: "rgba(108,99,255,0.3)", y: -2 }}
              className="bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-6 transition-all"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-[#FFD93D]" />)}
              </div>
              <p className="text-[#F0F0FF] text-sm leading-relaxed mb-6 font-medium">
                "The ATLAS voice feature is genuinely insane. It told me exactly which 3 nodes were pulling my grade down."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#00D4FF]/30 flex items-center justify-center text-xs font-bold text-[#00D4FF]">PS</div>
                <div>
                  <div className="text-sm font-semibold text-[#F0F0FF]">Priya S.</div>
                  <div className="text-xs text-[#8888AA]">Bioinformatics, BITS Pilani</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ borderColor: "rgba(108,99,255,0.3)", y: -2 }}
              className="bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-6 transition-all"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-[#FFD93D]" />)}
              </div>
              <p className="text-[#F0F0FF] text-sm leading-relaxed mb-6 font-medium">
                "We studied for our OS exam together in the same 3D universe. I've never felt more prepared."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#6BCB77]/30 flex items-center justify-center text-xs font-bold text-[#6BCB77]">RK</div>
                <div>
                  <div className="text-sm font-semibold text-[#F0F0FF]">Rahul K.</div>
                  <div className="text-xs text-[#8888AA]">Software Eng, NIT Trichy</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SECTION 6 — FINAL CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section 
        className="py-32 relative overflow-hidden px-6"
        style={{ background: "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(108,99,255,0.15) 0%, transparent 70%)" }}
        ref={finalCtaRef}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={isFinalCtaInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 25 }}
          className="max-w-2xl mx-auto text-center relative z-10"
        >
          <h2 className="text-5xl font-bold font-[Space_Grotesk] bg-gradient-to-r from-[#F0F0FF] to-[#A78BFA] bg-clip-text text-transparent mb-4">
            Your next exam is in the universe.
          </h2>
          <p className="text-[#8888AA] text-lg mb-10">Free forever. No credit card.</p>
          <motion.button
            onClick={() => router.push('/signup')}
            whileHover={{ y: -3, boxShadow: "0 0 50px rgba(108,99,255,0.5)" }}
            whileTap={{ scale: 0.97 }}
            style={{ boxShadow: "0 0 30px rgba(108,99,255,0.35)" }}
            className="bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] px-8 py-4 rounded-2xl text-white font-semibold text-base transition-all mx-auto"
          >
            Start for free &rarr;
          </motion.button>
        </motion.div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SECTION 7 — FOOTER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="border-t border-[#1E1E3F] py-8 px-6 bg-[#050510]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[#6C63FF] to-[#00D4FF] flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="text-xs text-[#8888AA]">© 2025 Mnemo. Built for learners.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/login" className="text-xs text-[#8888AA] hover:text-[#F0F0FF] transition-colors">Sign in</Link>
            <Link href="/signup" className="text-xs text-[#8888AA] hover:text-[#F0F0FF] transition-colors">Get started</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
