"use client";

import { motion } from "framer-motion";
import { MessageSquare, ArrowBigUp, ArrowBigDown, Telescope } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    body: string | null;
    upvotes: number;
    downvotes: number;
    commentCount: number;
    createdAt: string;
    communityId: string;
  };
  user: {
    name: string;
    username: string;
    image: string | null;
  } | null;
  document: {
    id: string;
    title: string;
    totalNodes: number;
  } | null;
  communitySlug?: string;
}

export function PostCard({ post, user, document, communitySlug }: PostCardProps) {
  const [upvotes, setUpvotes] = useState(post.upvotes);
  const [downvotes, setDownvotes] = useState(post.downvotes);
  const { data: session } = useSession();

  const handleVote = async (value: number) => {
    if (!session?.user) {
      toast.error("Please login to vote");
      return;
    }
    try {
      const res = await fetch(`/api/posts/${post.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error("Vote failed");
      const data = await res.json();
      setUpvotes(data.upvotes);
      setDownvotes(data.downvotes);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const score = upvotes - downvotes;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0A0A1F] border border-[#1E1E3F] hover:border-[#6C63FF]/50 transition-colors rounded-xl p-4 flex gap-4"
    >
      <div className="flex flex-col items-center gap-1 min-w-[40px]">
        <button onClick={() => handleVote(1)} className="text-[#8888AA] hover:text-[#00D4FF] transition-colors">
          <ArrowBigUp size={24} />
        </button>
        <span className="text-[#F0F0FF] font-medium text-sm">{score}</span>
        <button onClick={() => handleVote(-1)} className="text-[#8888AA] hover:text-[#FF6B6B] transition-colors">
          <ArrowBigDown size={24} />
        </button>
      </div>

      <div className="flex-1">
        <div className="text-xs text-[#8888AA] mb-2">
          Posted by <span className="text-[#A78BFA]">@{user?.username || "unknown"}</span>{" "}
          • {formatDistanceToNow(new Date(post.createdAt))} ago
        </div>
        
        {communitySlug ? (
          <Link href={`/communities/${communitySlug}/post/${post.id}`}>
            <h3 className="text-[#F0F0FF] text-lg font-semibold hover:text-[#6C63FF] transition-colors">
              {post.title}
            </h3>
          </Link>
        ) : (
          <h3 className="text-[#F0F0FF] text-lg font-semibold">
            {post.title}
          </h3>
        )}

        {post.body && (
          <p className="text-[#8888AA] text-sm mt-2 line-clamp-3">
            {post.body}
          </p>
        )}

        {document && (
          <div className="mt-4 p-3 bg-[#13132B] border border-[#1E1E3F] rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Telescope className="text-[#00D4FF]" size={20} />
              <div>
                <div className="text-[#F0F0FF] text-sm font-medium">{document.title}</div>
                <div className="text-[#8888AA] text-xs">{document.totalNodes} concepts</div>
              </div>
            </div>
            <Link href={`/universe/${document.id}`}>
              <button className="bg-[#6C63FF]/10 text-[#6C63FF] hover:bg-[#6C63FF]/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                Explore Universe
              </button>
            </Link>
          </div>
        )}

        <div className="flex items-center gap-4 mt-4">
          <Link href={communitySlug ? `/communities/${communitySlug}/post/${post.id}` : "#"}>
            <div className="flex items-center gap-1.5 text-[#8888AA] hover:text-[#F0F0FF] transition-colors text-xs font-medium">
              <MessageSquare size={14} />
              {post.commentCount} Comments
            </div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
