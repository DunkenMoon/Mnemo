"use client";

import { useEffect, useState, use } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { motion } from "framer-motion";
import { Calendar, BookOpen } from "lucide-react";
import { PostCard } from "@/components/ui/PostCard";
import { format } from "date-fns";

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/${username}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setProfileData(data);
      })
      .finally(() => setLoading(false));
  }, [username]);

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

  if (!profileData) {
    return (
      <div className="flex min-h-screen bg-[#050510]">
        <Sidebar />
        <main className="flex-1 p-6 flex justify-center items-center md:ml-64 text-[#8888AA]">
          User not found.
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
            <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/10 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
              {profileData.image ? (
                <img src={profileData.image} alt={profileData.name} className="w-24 h-24 rounded-full border-2 border-[#1E1E3F]" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6C63FF]/20 to-[#00D4FF]/20 border border-[#6C63FF]/30 flex items-center justify-center text-[#F0F0FF] font-bold text-4xl shadow-[0_0_30px_rgba(108,99,255,0.2)]">
                  {profileData.name.substring(0, 1).toUpperCase()}
                </div>
              )}
              
              <div>
                <h1 className="text-3xl font-bold font-[Space_Grotesk] mb-1">
                  {profileData.name}
                </h1>
                <div className="text-[#00D4FF] font-medium mb-4">@{profileData.username}</div>
                
                <div className="flex items-center gap-6 text-[#8888AA] text-sm">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={16} />
                    Joined {format(new Date(profileData.createdAt), "MMMM yyyy")}
                  </span>
                  <span className="flex items-center gap-1.5 bg-[#1E1E3F] px-3 py-1 rounded-full text-xs text-[#F0F0FF]">
                    <BookOpen size={14} className="text-[#6C63FF]" />
                    {profileData.learningStyle} learner
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 border-b border-[#1E1E3F] pb-4">
            <h2 className="text-xl font-semibold font-[Space_Grotesk]">Shared Posts</h2>
          </div>

          <div className="flex flex-col gap-4">
            {profileData.posts.length === 0 ? (
              <div className="text-center py-12 text-[#8888AA] border border-dashed border-[#1E1E3F] rounded-xl">
                No posts yet.
              </div>
            ) : (
              profileData.posts.map((item: any) => (
                <PostCard 
                  key={item.post.id} 
                  post={item.post} 
                  user={profileData} 
                  document={item.document} 
                  communitySlug={item.community?.slug}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
