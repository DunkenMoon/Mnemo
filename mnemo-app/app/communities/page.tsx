"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { motion } from "framer-motion";
import { Users, Plus, Globe } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  subject: string | null;
  memberCount: number;
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/communities")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setCommunities(data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-[#050510] text-[#F0F0FF] font-sans selection:bg-[#6C63FF]/30">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a3a_0%,#050510_70%)] opacity-60" />
      <Sidebar />
      <main className="flex-1 p-6 md:p-12 relative z-10 md:ml-64 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-bold font-[Space_Grotesk] bg-clip-text text-transparent bg-gradient-to-r from-[#F0F0FF] to-[#8888AA]"
              >
                Communities
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[#8888AA] mt-3 max-w-2xl text-lg"
              >
                Join study groups, explore shared universes, and learn together.
              </motion.p>
            </div>
            
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              onClick={() => toast.info("Create Community modal coming soon!")}
              className="bg-[#6C63FF] hover:bg-[#7C73FF] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-[0_0_20px_rgba(108,99,255,0.3)]"
            >
              <Plus size={20} />
              Create Community
            </motion.button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : communities.length === 0 ? (
            <div className="text-center py-20 bg-[#0A0A1F]/50 rounded-2xl border border-[#1E1E3F]">
              <Globe className="mx-auto text-[#8888AA] mb-4" size={48} />
              <h2 className="text-[#F0F0FF] text-xl font-semibold mb-2">No communities yet</h2>
              <p className="text-[#8888AA]">Be the first to create one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community, i) => (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/communities/${community.slug}`}>
                    <div className="group relative bg-[#0A0A1F] border border-[#1E1E3F] hover:border-[#6C63FF]/50 hover:shadow-[0_0_30px_rgba(108,99,255,0.15)] rounded-2xl p-6 transition-all h-full flex flex-col cursor-pointer">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C63FF]/20 to-[#00D4FF]/20 border border-[#6C63FF]/30 flex items-center justify-center text-[#F0F0FF] font-bold text-xl">
                          {community.name.substring(0, 2).toUpperCase()}
                        </div>
                        {community.subject && (
                          <span className="bg-[#1E1E3F] text-[#8888AA] text-xs px-3 py-1 rounded-full">
                            {community.subject}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold text-[#F0F0FF] mb-2 font-[Space_Grotesk] group-hover:text-[#00D4FF] transition-colors">
                        m/{community.name}
                      </h3>
                      
                      <p className="text-[#8888AA] text-sm line-clamp-2 mb-6 flex-1">
                        {community.description || "A community for shared knowledge."}
                      </p>
                      
                      <div className="flex items-center text-[#8888AA] text-sm font-medium">
                        <Users size={16} className="mr-2" />
                        {community.memberCount} members
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
