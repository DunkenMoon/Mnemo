"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const ARCanvas = dynamic(() => import("@/components/3d/ARCanvas").then(m => m.ARCanvas), { ssr: false });

export default function ARPage() {
  const { documentId } = useParams() as { documentId: string };
  const [supported, setSupported] = useState<boolean | null>(null);
  const [nodes, setNodes] = useState<any[]>([]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.xr) {
      navigator.xr.isSessionSupported("immersive-ar").then(isSupported => {
        setSupported(isSupported);
      });
    } else {
      setSupported(false);
    }

    fetch(`/api/graph/${documentId}/personalised`)
      .then(res => res.json())
      .then(data => setNodes(data))
      .catch(console.error);
  }, [documentId]);

  if (supported === null) {
    return <div className="h-screen w-full bg-black flex items-center justify-center text-white">Checking AR support...</div>;
  }

  if (supported === false) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white p-6 text-center space-y-4">
        <h2 className="text-2xl font-[Space_Grotesk] font-bold text-[#FF6B6B]">AR Not Supported</h2>
        <p className="text-[#8888AA]">Use Chrome on Android or Safari on iOS 15+ for AR mode.</p>
        <Link href={`/universe/${documentId}`}>
          <button className="bg-[#6C63FF] px-6 py-2 rounded-full text-sm mt-4 transition-colors hover:bg-[#A78BFA]">Back to Universe</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden">
      <Link href={`/universe/${documentId}`} className="absolute top-6 left-6 z-50">
        <button className="bg-black/50 border border-white/20 p-3 rounded-full text-white backdrop-blur-md hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} />
        </button>
      </Link>
      
      {nodes.length > 0 && <ARCanvas nodes={nodes} scale={0.15} />}

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none w-[90%] max-w-sm">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 px-5 py-3 rounded-full text-center shadow-lg">
          <p className="text-white text-xs font-medium tracking-wide">
            Point at a flat surface • Tap to place • Tap nodes to expand
          </p>
        </div>
      </div>
    </div>
  );
}
