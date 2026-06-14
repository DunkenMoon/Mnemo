"use client";
import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BookOpen, ScanEye, Share2, GitBranch, Map, Link2, Check } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { useParams, useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { UniverseLoader } from "@/components/ui/UniverseLoader";
import { NodeDetailPanel } from "@/components/ui/NodeDetailPanel";
import { GraphFilterPanel, DEFAULT_FILTERS } from "@/components/ui/GraphFilterPanel";
import type { FilterState } from "@/components/ui/GraphFilterPanel";
import { useSession } from "@/lib/auth-client";
import { useCollaboration } from "@/hooks/useCollaboration";
import { CollabChat } from "@/components/ui/CollabChat";
import { toast } from "sonner";
import { ShootingStars, StarsBackground } from "@/components/ui/aceternity/ShootingStars";

const KnowledgeUniverse = dynamic(() => import("@/components/3d/KnowledgeUniverse"), { ssr: false });
const AtlasOrb = dynamic(() => import("@/components/atlas/AtlasOrb").then(m => m.AtlasOrb), { ssr: false });

export default function UniversePage() {
  const { documentId } = useParams() as { documentId: string };
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [documentInfo, setDocumentInfo] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [showTopicList, setShowTopicList] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });

  const currentUserInfo = session?.user ? { id: session.user.id, name: session.user.name } : { id: "anonymous", name: "Anonymous" };
  const { collaborators, myColor, broadcastNodeSelection } = useCollaboration(documentId, currentUserInfo);

  const knowledgeState = React.useMemo(() => {
    if (!graphData?.nodes) return {};
    return graphData.nodes.reduce(
      (acc: Record<string, number>, node: any) => {
        acc[node.label] = node.memoryStrength ?? 0.5;
        return acc;
      },
      {}
    );
  }, [graphData]);

  const filteredNodes = useMemo(() => {
    return graphData.nodes.filter((n: any) => {
      const mem = n.memoryStrength ?? 0.5
      const imp = n.importance ?? 5
      return (
        mem >= filters.minMemory &&
        mem <= filters.maxMemory &&
        imp >= filters.minImportance
      )
    })
  }, [graphData.nodes, filters])

  const filteredEdges = useMemo(() => {
    const filteredNodeIds = new Set(filteredNodes.map((n: any) => n.id))
    return graphData.edges.filter((e: any) =>
      filteredNodeIds.has(e.sourceNodeId) &&
      filteredNodeIds.has(e.targetNodeId)
    )
  }, [filteredNodes, graphData.edges])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nodesRes, graphRes] = await Promise.all([
          fetch(`/api/graph/${documentId}/personalised`),
          fetch(`/api/graph/${documentId}`)
        ])

        if (!nodesRes.ok) throw new Error(`Nodes API: ${nodesRes.status}`)
        if (!graphRes.ok) throw new Error(`Graph API: ${graphRes.status}`)

        const personalisedNodes = await nodesRes.json()
        const graphDataRes = await graphRes.json()

        setGraphData({
          nodes: Array.isArray(personalisedNodes) ? personalisedNodes : [],
          edges: Array.isArray(graphDataRes.edges) ? graphDataRes.edges : [],
        })
        if (graphDataRes.document) setDocumentInfo(graphDataRes.document)
      } catch (err: any) {
        console.error("[UNIVERSE] Fetch error:", err.message)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [documentId]);

  useEffect(() => {
    broadcastNodeSelection(selectedNode?.id ?? null);
  }, [selectedNode, broadcastNodeSelection]);

  const handleNodeClick = async (node: any) => {
    setSelectedNode(node);
    // Track visit
    fetch(`/api/progress/node/${node.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeSpent: 0 })
    });
  };

  const handleAtlasAction = (action: any) => {
    if (!action || !graphData) return;
    switch (action.type) {
      case "navigate_to_node": {
        const node = graphData.nodes.find((n) => n.id === action.payload.nodeId || n.label.toLowerCase().includes(action.payload.nodeId.toLowerCase()));
        if (node) setSelectedNode(node);
        break;
      }
      case "highlight_nodes":
        setHighlightedNodes(action.payload.nodeIds as string[]);
        break;
      case "open_flashcard":
        router.push(`/flashcards/${documentId}?nodeId=${action.payload.nodeId}`);
        break;
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast("Link copied", { description: "Anyone with this link can study with you" });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea");
      el.value = window.location.href;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleARClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.innerWidth > 768) {
      const url = `${window.location.origin}/ar/${documentId}`;
      try {
        const qr = await QRCode.toDataURL(url, { color: { dark: "#0A0A1F", light: "#F0F0FF" } });
        setQrCodeUrl(qr);
        setShowQR(true);
      } catch (err) {
        console.error("QR Code error:", err);
      }
    } else {
      router.push(`/ar/${documentId}`);
    }
  };

  const isOwner = documentInfo && session?.user && documentInfo.userId === session.user.id;

  if (loading) return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#050510]">
      <UniverseLoader />
    </div>
  );

  if (error) return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#050510]">
      <div className="text-red-400 text-xl font-medium">Error: {error}</div>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#1E1E3F] text-white rounded-lg">Retry</button>
    </div>
  );

  if (!graphData || graphData.nodes.length === 0) return (
    <div className="flex items-center justify-center h-screen text-[#8888AA]">
      No concepts found. Go back and try reprocessing.
    </div>
  );

  return (
    <div className="w-full h-screen bg-[#050510] overflow-hidden relative">
      <ShootingStars starColor="#6C63FF" trailColor="#00D4FF" />
      <StarsBackground />

      {/* Floating Top Bar */}
      <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <Link href="/">
            <button className="bg-[#0A0A1F]/60 backdrop-blur-xl border-b border-[#1E1E3F]/50 p-3 rounded-full text-[#8888AA] hover:text-[#F0F0FF] hover:border-[#6C63FF] transition-all">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div className="bg-[#0A0A1F]/60 backdrop-blur-xl border border-[#1E1E3F]/50 px-5 py-2.5 rounded-full flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <span className="text-[#F0F0FF] font-[Space_Grotesk] font-medium tracking-wide">
              {documentInfo?.title || "Knowledge Universe"}
            </span>
            {!isOwner && documentInfo && (
              <span className="text-[#8888AA] text-xs uppercase tracking-widest bg-[#1E1E3F] px-2 py-0.5 rounded-full">
                Read-Only
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          {isOwner && (
            <>
              <button onClick={handleShare} className="bg-[#0A0A1F]/80 backdrop-blur-xl border border-[#1E1E3F] p-3 rounded-full text-[#8888AA] hover:text-[#F0F0FF] transition-all" title="Share Universe">
                <Share2 size={20} />
              </button>
              <button onClick={handleARClick} className="bg-[#00D4FF]/10 backdrop-blur-xl border border-[#00D4FF]/30 hover:border-[#00D4FF] hover:bg-[#00D4FF]/20 text-[#00D4FF] px-4 py-2.5 rounded-full font-medium flex items-center gap-2 transition-all">
                <ScanEye size={18} />
                <span className="hidden sm:inline">AR View</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Top Right Panel */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute top-20 right-4 flex flex-col gap-2 z-30"
      >
        {/* Topic Map Toggle */}
        <button
          onClick={() => setShowTopicList(!showTopicList)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0A0A1F]/80 backdrop-blur border border-[#1E1E3F] rounded-xl text-sm text-[#8888AA] hover:text-[#F0F0FF] hover:border-[#6C63FF]/50 transition-all"
        >
          <Map size={14} />
          Topic Map
        </button>

        {/* Generate Flashcard */}
        <Link href={`/flashcards/${documentId}`}>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0A0A1F]/80 backdrop-blur border border-[#1E1E3F] rounded-xl text-sm text-[#8888AA] hover:text-[#F0F0FF] hover:border-[#6C63FF]/50 transition-all">
            <BookOpen size={14} />
            Generate Cards
          </button>
        </Link>

        {/* Copy Share Link */}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-4 py-2 bg-[#0A0A1F]/80 backdrop-blur border border-[#1E1E3F] rounded-xl text-sm text-[#8888AA] hover:text-[#F0F0FF] hover:border-[#6C63FF]/50 transition-all"
        >
          {copied ? <Check size={14} className="text-[#6BCB77]" /> : <Link2 size={14} />}
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </motion.div>

      {/* Topic List Sidebar */}
      <AnimatePresence>
        {showTopicList && graphData && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-36 right-4 w-72 max-h-[70vh] overflow-y-auto bg-[#0A0A1F]/95 backdrop-blur-xl border border-[#1E1E3F] rounded-2xl p-4 z-30"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#F0F0FF]">
                Topic Map
              </h3>
              <span className="text-xs text-[#8888AA]">
                {graphData.nodes.length} concepts
              </span>
            </div>
            <div className="space-y-1">
              {graphData.nodes.map((node: any) => {
                const strength = node.memoryStrength ?? 0.5;
                const color = strength < 0.3
                  ? "#FF6B6B"
                  : strength < 0.6
                  ? "#FFD93D"
                  : "#6BCB77";
                return (
                  <button
                    key={node.id}
                    onClick={() => {
                      setSelectedNode(node);
                      setShowTopicList(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1E1E3F] transition-all text-left group"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
                    />
                    <span className="text-sm text-[#8888AA] group-hover:text-[#F0F0FF] transition-all truncate">
                      {node.label}
                    </span>
                    <span className="ml-auto text-xs text-[#8888AA] flex-shrink-0">
                      {Math.round(strength * 100)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Canvas */}
      <ErrorBoundary>
        <KnowledgeUniverse 
          nodes={filteredNodes} 
          edges={filteredEdges} 
          onNodeClick={handleNodeClick}
          highlightedNodes={highlightedNodes}
          selectedNodeId={selectedNode?.id ?? null}
          collaborators={Array.from(collaborators.values())}
        />
      </ErrorBoundary>

      {/* Graph Filter Panel */}
      <GraphFilterPanel onFilterChange={setFilters} />

      {/* Slide-in Panel */}
      <AnimatePresence>
        {selectedNode && (
          <NodeDetailPanel 
            node={selectedNode} 
            documentId={documentId} 
            onClose={() => setSelectedNode(null)}
            edges={graphData.edges}
            allNodes={graphData.nodes.map((n: any) => ({ id: n.id, label: n.label }))}
            onNavigateNode={(nodeId: string) => {
              const target = graphData.nodes.find((n: any) => n.id === nodeId);
              if (target) setSelectedNode(target);
            }}
          />
        )}
      </AnimatePresence>

      {/* Collaboration Chat Panel */}
      {session?.user && (
        <CollabChat 
          documentId={documentId}
          currentUser={{ id: session.user.id, name: session.user.name }}
          myColor={myColor}
          collaboratorCount={collaborators.size}
        />
      )}

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#050510]/80 backdrop-blur-sm"
            onClick={() => setShowQR(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-[#0A0A1F] border border-[#1E1E3F] p-8 rounded-2xl flex flex-col items-center max-w-sm mx-4 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-[#F0F0FF] font-[Space_Grotesk] mb-2 text-center">AR View</h3>
              <p className="text-[#8888AA] text-sm mb-6 text-center">Scan with your phone to view this knowledge graph in your physical space.</p>
              
              <div className="bg-[#F0F0FF] p-2 rounded-xl mb-6">
                {qrCodeUrl && <img src={qrCodeUrl} alt="AR QR Code" className="w-48 h-48" />}
              </div>
              
              <button onClick={() => setShowQR(false)} className="w-full bg-[#1E1E3F] hover:bg-[#0F0F2E] text-[#F0F0FF] py-3 rounded-lg font-medium transition-colors border border-[#1E1E3F]">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Atlas Orb - rendered LAST to be on top */}
      <AtlasOrb
        documentId={documentId}
        documentTitle={documentInfo?.title}
      />
    </div>
  );
}
