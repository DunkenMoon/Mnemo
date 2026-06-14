"use client";

import { useEffect, useState, use } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { motion } from "framer-motion";
import { Users, Plus, LayoutGrid, FileText } from "lucide-react";
import { toast } from "sonner";
import { PostCard } from "@/components/ui/PostCard";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  subject: string | null;
  memberCount: number;
  isMember: boolean;
}

export default function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/communities/${slug}`).then(res => res.json()),
      fetch(`/api/communities/${slug}/posts`).then(res => res.json())
    ]).then(([communityData, postsData]) => {
      if (!communityData.error) setCommunity(communityData);
      if (!postsData.error) setPosts(postsData);
    }).finally(() => setLoading(false));
  }, [slug]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const res = await fetch(`/api/communities/${slug}/join`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setCommunity(prev => prev ? {
        ...prev, 
        isMember: data.joined,
        memberCount: data.joined ? prev.memberCount + 1 : prev.memberCount - 1
      } : null);
      
      toast.success(data.joined ? `Joined m/${community?.name}` : `Left m/${community?.name}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#050510]">
        <Sidebar />
        <main className="flex-1 p-6 flex justify-center items-center md:ml-64">
          <div className="w-8 h-8 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex min-h-screen bg-[#050510]">
        <Sidebar />
        <main className="flex-1 p-6 flex justify-center items-center md:ml-64 text-[#8888AA]">
          Community not found.
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050510] text-[#F0F0FF] font-sans">
      <Sidebar />
      <main className="flex-1 p-6 md:p-12 md:ml-64 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-[#0A0A1F] border border-[#1E1E3F] rounded-2xl p-8 mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#6C63FF]/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6C63FF]/20 to-[#00D4FF]/20 border border-[#6C63FF]/30 flex items-center justify-center text-[#F0F0FF] font-bold text-3xl shadow-[0_0_30px_rgba(108,99,255,0.2)]">
                    {community.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold font-[Space_Grotesk] mb-1">
                      m/{community.name}
                    </h1>
                    <div className="flex items-center gap-4 text-[#8888AA] text-sm">
                      <span className="flex items-center gap-1">
                        <Users size={16} />
                        {community.memberCount} members
                      </span>
                      {community.subject && (
                        <span className="bg-[#1E1E3F] px-2 py-0.5 rounded-full text-xs">
                          {community.subject}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all min-w-[120px] ${
                    community.isMember 
                      ? "bg-[#1E1E3F] text-[#F0F0FF] hover:bg-[#2A2A4A]" 
                      : "bg-[#F0F0FF] text-[#050510] hover:bg-white shadow-[0_0_20px_rgba(240,240,255,0.3)]"
                  }`}
                >
                  {isJoining ? "..." : community.isMember ? "Joined" : "Join"}
                </button>
              </div>
              
              <p className="mt-6 text-[#8888AA] max-w-2xl">
                {community.description || "Welcome to the community! Share your universes and explore others."}
              </p>
            </div>
          </div>

          {/* Create Post Bar */}
          <div className="bg-[#0A0A1F] border border-[#1E1E3F] rounded-xl p-4 mb-8 flex items-center gap-4 cursor-pointer hover:border-[#6C63FF]/50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#1E1E3F] flex items-center justify-center text-[#8888AA]">
              <Users size={20} />
            </div>
            <div className="flex-1 bg-[#050510] border border-[#1E1E3F] rounded-lg px-4 py-2.5 text-[#8888AA] text-sm">
              Create a post...
            </div>
            <div className="flex gap-2">
              <div className="p-2 text-[#8888AA] hover:bg-[#1E1E3F] rounded-lg transition-colors"><FileText size={20} /></div>
              <div className="p-2 text-[#8888AA] hover:bg-[#1E1E3F] rounded-lg transition-colors"><LayoutGrid size={20} /></div>
            </div>
          </div>

          {/* Feed */}
          <div className="flex flex-col gap-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-[#8888AA] border border-dashed border-[#1E1E3F] rounded-xl">
                No posts yet. Share your first universe!
              </div>
            ) : (
              posts.map((item) => (
                <PostCard 
                  key={item.post.id} 
                  post={item.post} 
                  user={item.user} 
                  document={item.document} 
                  communitySlug={community.slug}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
