"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Upload,
  BarChart3,
  LogOut,
  Menu,
  X,
  Users,
  BookOpen,
} from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";

const navLinks = [
  { href: "/home", label: "Dashboard", icon: Home },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/communities", label: "Communities", icon: Users },
  { href: "/progress", label: "Progress", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const [recentDocId, setRecentDocId] = useState<string | null>(null);

  // Fetch due count for sidebar badge
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/progress/due")
      .then((r) => (r.ok ? r.json() : { dueCount: 0, recentDocId: null }))
      .then((data) => {
        setDueCount(data.dueCount ?? 0);
        setRecentDocId(data.recentDocId ?? null);
      })
      .catch(() => {});
  }, [session, pathname]); // re-fetch on navigation

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-[#0A0A1F]/80 backdrop-blur-xl border border-[#1E1E3F] p-2 rounded-lg text-[#F0F0FF]"
      >
        <Menu size={24} />
      </button>

      {/* Mobile bottom nav — shown on <768px */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A1F]/95 backdrop-blur-xl border-t border-[#1E1E3F] flex justify-around py-2 px-1">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                active
                  ? "text-[#A78BFA] bg-[#6C63FF]/10"
                  : "text-[#8888AA]"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 h-screen bg-[#0A0A1F]/80 backdrop-blur-xl border-r border-[#1E1E3F] flex-col fixed left-0 top-0 z-50">
        <SidebarContent
          pathname={pathname}
          session={session}
          onClose={() => setIsOpen(false)}
          showClose={false}
          dueCount={dueCount}
          recentDocId={recentDocId}
        />
      </aside>

      {/* Mobile sidebar — animated */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -256, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -256, opacity: 0 }}
            transition={{
              type: "spring" as const,
              stiffness: 300,
              damping: 30,
            }}
            className="md:hidden w-64 h-screen bg-[#0A0A1F]/95 backdrop-blur-xl border-r border-[#1E1E3F] flex flex-col fixed left-0 top-0 z-50"
          >
            <SidebarContent
              pathname={pathname}
              session={session}
              onClose={() => setIsOpen(false)}
              showClose={true}
              dueCount={dueCount}
              recentDocId={recentDocId}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="md:hidden fixed inset-0 bg-[#050510]/80 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Sidebar content ─── */

function SidebarContent({
  pathname,
  session,
  onClose,
  showClose,
  dueCount,
  recentDocId,
}: {
  pathname: string;
  session: any;
  onClose: () => void;
  showClose: boolean;
  dueCount: number;
  recentDocId: string | null;
}) {
  return (
    <>
      <div className="p-6 border-b border-[#1E1E3F] flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#6C63FF] font-[Space_Grotesk]">
          mnemo
        </h1>
        {showClose && (
          <button className="text-[#8888AA]" onClick={onClose}>
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                active
                  ? "bg-[#6C63FF]/20 text-[#A78BFA] border-l-2 border-[#6C63FF]"
                  : "text-[#8888AA] hover:bg-[#0F0F2E] hover:text-[#F0F0FF]"
              }`}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          );
        })}

        {/* Due for review badge — RemNote style */}
        {dueCount > 0 && (
          <Link
            href={
              recentDocId ? `/flashcards/${recentDocId}` : "/home"
            }
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg mt-3 bg-[#FF6B6B]/5 border border-[#FF6B6B]/15 hover:bg-[#FF6B6B]/10 transition-all group"
          >
            <div className="relative">
              <BookOpen
                size={18}
                className="text-[#FF6B6B]"
              />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#FF6B6B] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {dueCount > 99 ? "99" : dueCount}
              </span>
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-[#FF6B6B] group-hover:text-[#FF8888]">
                Due for review
              </span>
              <p className="text-[10px] text-[#8888AA]">
                {dueCount} card{dueCount !== 1 ? "s" : ""} need
                attention
              </p>
            </div>
          </Link>
        )}
      </nav>

      {session?.user && (
        <div className="p-4 border-t border-[#1E1E3F]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#6C63FF]/30 flex items-center justify-center text-sm font-bold text-[#A78BFA]">
              {session.user.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-[#F0F0FF] truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-[#8888AA] truncate">
                {session.user.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#8888AA] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </>
  );
}
