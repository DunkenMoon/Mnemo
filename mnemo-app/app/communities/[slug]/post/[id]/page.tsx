"use client";

import { useEffect, useState, use } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { motion } from "framer-motion";
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PostCard } from "@/components/ui/PostCard";
import { formatDistanceToNow } from "date-fns";

export default function PostPage({ params }: { params: Promise<{ slug: string, id: string }> }) {
  const { slug, id } = use(params);
  const [postData, setPostData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setPostData(data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody })
      });
      if (!res.ok) throw new Error("Failed to post comment");
      const data = await res.json();
      
      // Optimistic update
      setPostData((prev: any) => ({
        ...prev,
        post: { ...prev.post, commentCount: prev.post.commentCount + 1 },
        comments: [
          {
            comment: data,
            user: { name: "You", username: "you" } // simplistic optimistic update
          },
          ...prev.comments
        ]
      }));
      setCommentBody("");
      toast.success("Comment added");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
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

  if (!postData) {
    return (
      <div className="flex min-h-screen bg-[#050510]">
        <Sidebar />
        <main className="flex-1 p-6 flex justify-center items-center md:ml-64 text-[#8888AA]">
          Post not found.
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050510] text-[#F0F0FF] font-sans">
      <Sidebar />
      <main className="flex-1 p-6 md:p-12 md:ml-64 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <Link href={`/communities/${slug}`} className="inline-flex items-center gap-2 text-[#8888AA] hover:text-[#F0F0FF] transition-colors mb-6 font-medium text-sm">
            <ArrowLeft size={16} />
            Back to m/{slug}
          </Link>

          {/* Main Post */}
          <PostCard 
            post={postData.post} 
            user={postData.user} 
            document={postData.document} 
          />

          {/* Comments Section */}
          <div className="mt-8 bg-[#0A0A1F] border border-[#1E1E3F] rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <MessageSquare size={18} className="text-[#6C63FF]" />
              Comments ({postData.comments.length})
            </h3>

            {/* Comment Input */}
            <form onSubmit={handleComment} className="mb-8 relative">
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="What are your thoughts?"
                className="w-full bg-[#050510] border border-[#1E1E3F] rounded-xl p-4 pr-16 text-[#F0F0FF] placeholder:text-[#8888AA] focus:outline-none focus:border-[#6C63FF]/50 resize-none h-24 transition-colors"
              />
              <button
                type="submit"
                disabled={isSubmitting || !commentBody.trim()}
                className="absolute bottom-4 right-4 bg-[#6C63FF] hover:bg-[#7C73FF] disabled:opacity-50 disabled:hover:bg-[#6C63FF] p-2 rounded-lg text-white transition-colors"
              >
                <Send size={16} />
              </button>
            </form>

            {/* Comment List */}
            <div className="space-y-6">
              {postData.comments.map((item: any) => (
                <div key={item.comment.id} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#1E1E3F] flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    {item.user?.username?.substring(0, 2).toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-[#F0F0FF]">@{item.user?.username || "unknown"}</span>
                      <span className="text-xs text-[#8888AA]">{formatDistanceToNow(new Date(item.comment.createdAt))} ago</span>
                    </div>
                    <p className="text-[#8888AA] text-sm leading-relaxed">
                      {item.comment.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
