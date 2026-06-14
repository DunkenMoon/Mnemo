"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import type { TopicEdgeData, TopicNodeData } from "@/components/3d/TopicFlowMap";

const TopicFlowMap = dynamic(
  () => import("@/components/3d/TopicFlowMap").then((m) => m.TopicFlowMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#050510] animate-pulse flex items-center justify-center text-[#8888AA]">
        Loading topic map...
      </div>
    ),
  }
);

const AtlasOrb = dynamic(
  () => import("@/components/atlas/AtlasOrb").then(m => m.AtlasOrb),
  { ssr: false }
);

export default function TopicMapPage() {
  const { documentId } = useParams() as { documentId: string };
  const router = useRouter();
  const { data: session } = useSession();
  const [nodes, setNodes] = useState<TopicNodeData[]>([]);
  const [edges, setEdges] = useState<TopicEdgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session === null) router.push("/login");
  }, [session, router]);

  useEffect(() => {
    fetch(`/api/topicmap/${documentId}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        setNodes(data.nodes ?? []);
        setEdges(data.edges ?? []);
      })
      .catch((err: unknown) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [documentId]);

  if (!session?.user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative w-full h-screen bg-[#050510] overflow-hidden"
    >
      <div className="absolute top-6 left-6 z-30">
        <Link href={`/universe/${documentId}`}>
          <button className="flex items-center gap-2 bg-[#0A0A1F]/60 backdrop-blur-xl border border-[#1E1E3F]/50 px-4 py-2.5 rounded-full text-[#8888AA] hover:text-[#F0F0FF] transition-colors">
            <ArrowLeft size={16} /> Back to Universe
          </button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-full text-[#8888AA]">
          Loading topic map...
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-[#8888AA]">
          <p>{error}</p>
          <p className="text-sm">Reprocess the document to generate a topic hierarchy.</p>
        </div>
      ) : nodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-[#8888AA]">
          <p>No topic map yet for this document.</p>
          <button
            onClick={() =>
              fetch(`/api/process/${documentId}`, { method: "POST", credentials: "include" }).then(
                () => window.location.reload()
              )
            }
            className="px-5 py-2.5 bg-[#6C63FF] rounded-xl text-white font-medium"
          >
            Reprocess Document
          </button>
        </div>
      ) : (
        <TopicFlowMap nodes={nodes} edges={edges} />
      )}
      
      {/* Atlas Orb */}
      <AtlasOrb
        documentId={documentId}
        documentTitle={nodes.length > 0 ? nodes[0].label : "Topic Map"}
      />
    </motion.div>
  );
}
