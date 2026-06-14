"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html, Line } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";

export interface TopicNodeData {
  id: string;
  label: string;
  type: "root" | "branch" | "leaf";
  explanation: string;
  importance: number;
  depth: number;
  positionX: number;
  positionY: number;
  positionZ: number;
}

export interface TopicEdgeData {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string | null;
  edgeType: "contains" | "leads_to" | "related";
}

const NODE_CONFIGS = {
  root: {
    size: 1.2,
    color: "#6C63FF",
    emissive: "#6C63FF",
    intensity: 0.8,
  },
  branch: {
    size: 0.8,
    color: "#00D4FF",
    emissive: "#00D4FF",
    intensity: 0.5,
  },
  leaf: {
    size: 0.35,
    color: "#A78BFA",
    emissive: "#A78BFA",
    intensity: 0.3,
  },
};

const EDGE_COLORS: Record<string, string> = {
  contains: "#6C63FF",
  leads_to: "#00D4FF",
  related: "#A78BFA",
};

function FlowNode({
  node,
  onClick,
  selected,
}: {
  node: TopicNodeData;
  onClick: (node: TopicNodeData) => void;
  selected: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const cfg = NODE_CONFIGS[node.type] ?? NODE_CONFIGS.leaf;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (node.type === "root") {
      meshRef.current.rotation.y += delta * 0.3;
    }
    const target = selected ? 1.4 : hovered ? 1.2 : 1.0;
    meshRef.current.scale.setScalar(
      THREE.MathUtils.lerp(meshRef.current.scale.x, target, 0.1)
    );
  });

  return (
    <group position={[node.positionX, node.positionY, node.positionZ]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick(node);
        }}
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        {node.type === "root" && <icosahedronGeometry args={[cfg.size, 1]} />}
        {node.type === "branch" && <octahedronGeometry args={[cfg.size, 0]} />}
        {node.type === "leaf" && <sphereGeometry args={[cfg.size, 16, 16]} />}
        <meshStandardMaterial
          color={cfg.color}
          emissive={cfg.emissive}
          emissiveIntensity={
            selected ? cfg.intensity * 2.5 : hovered ? cfg.intensity * 1.8 : cfg.intensity
          }
          roughness={0.2}
          metalness={0.4}
          wireframe={false}
        />
      </mesh>

      <pointLight color={cfg.color} intensity={selected ? 3 : hovered ? 2 : 0.8} distance={4} />

      <Html
        distanceFactor={10}
        style={{
          pointerEvents: "none",
          color: "#F0F0FF",
          fontSize: node.type === "root" ? "15px" : node.type === "branch" ? "12px" : "10px",
          fontWeight: node.type === "root" ? 700 : node.type === "branch" ? 600 : 400,
          fontFamily: "Space Grotesk, sans-serif",
          whiteSpace: "nowrap",
          textShadow: `0 0 10px ${cfg.color}`,
          transform: "translateY(-28px)",
          opacity: node.type === "leaf" ? (hovered || selected ? 1 : 0) : 1,
        }}
      >
        {node.label}
      </Html>
    </group>
  );
}

function FlowEdge({
  edge,
  nodes,
}: {
  edge: TopicEdgeData;
  nodes: TopicNodeData[];
}) {
  const src = nodes.find((n) => n.id === edge.sourceNodeId);
  const tgt = nodes.find((n) => n.id === edge.targetNodeId);
  if (!src || !tgt) return null;

  const color = EDGE_COLORS[edge.edgeType] ?? "#ffffff33";
  const isDashed = edge.edgeType === "related";
  const lineWidth = edge.edgeType === "contains" ? 2 : edge.edgeType === "leads_to" ? 1 : 0.5;
  const opacity = edge.edgeType === "related" ? 0.25 : edge.edgeType === "contains" ? 0.8 : 0.5;

  return (
    <Line
      points={[
        [src.positionX, src.positionY, src.positionZ],
        [tgt.positionX, tgt.positionY, tgt.positionZ],
      ]}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={opacity}
      dashed={isDashed}
      dashSize={isDashed ? 0.3 : 0}
      gapSize={isDashed ? 0.2 : 0}
    />
  );
}

function NodeInfoPanel({
  node,
  onClose,
}: {
  node: TopicNodeData | null;
  onClose: () => void;
}) {
  if (!node) return null;
  const cfg = NODE_CONFIGS[node.type] ?? NODE_CONFIGS.leaf;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[400px] bg-[#0A0A1F]/95 backdrop-blur-xl border rounded-2xl p-5 z-20"
      style={{ borderColor: `${cfg.color}60` }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span
            className="text-xs font-mono uppercase tracking-widest mb-1 block"
            style={{ color: cfg.color }}
          >
            {node.type}
          </span>
          <h2 className="text-xl font-bold text-[#F0F0FF]">{node.label}</h2>
        </div>
        <button
          onClick={onClose}
          className="text-[#8888AA] hover:text-[#F0F0FF] text-xl leading-none"
        >
          ×
        </button>
      </div>
      <p className="text-sm text-[#8888AA] mb-3">{node.explanation}</p>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8888AA]">Importance:</span>
          <div className="flex-1 h-2 bg-[#1E1E3F] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${node.importance * 10}%` }}
              className="h-full rounded-full"
              style={{ backgroundColor: cfg.color }}
            />
          </div>
          <span className="text-xs text-[#8888AA]">{node.importance}/10</span>
        </div>
        <span className="px-2 py-1 text-xs rounded-full bg-[#1E1E3F] text-[#8888AA]">
          Depth {node.depth}
        </span>
      </div>
    </motion.div>
  );
}

export function TopicFlowMap({
  nodes,
  edges,
}: {
  nodes: TopicNodeData[];
  edges: TopicEdgeData[];
}) {
  const [selected, setSelected] = useState<TopicNodeData | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [interactionTimer, setInteractionTimer] = useState<NodeJS.Timeout | null>(null);

  const handleNodeClick = (node: TopicNodeData) => {
    setSelected(node);
    setAutoRotate(false);
    if (interactionTimer) clearTimeout(interactionTimer);
    const timer = setTimeout(() => setAutoRotate(true), 5000);
    setInteractionTimer(timer);
  };

  return (
    <div className="relative w-full h-full">
      <Canvas style={{ width: "100%", height: "100%" }} camera={{ position: [0, 8, 20], fov: 60 }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 10, 10]} intensity={0.5} color="#6C63FF" />
        <Stars count={2000} depth={60} factor={3} fade />
        <OrbitControls enableDamping dampingFactor={0.05} maxDistance={35} minDistance={4} autoRotate={autoRotate} autoRotateSpeed={0.4} />
        {edges.map((e) => (
          <FlowEdge key={e.id} edge={e} nodes={nodes} />
        ))}
        {nodes.map((n) => (
          <FlowNode
            key={n.id}
            node={n}
            selected={selected?.id === n.id}
            onClick={handleNodeClick}
          />
        ))}
      </Canvas>

      <div className="absolute top-4 left-4 bg-[#0A0A1F]/80 backdrop-blur border border-[#1E1E3F] rounded-xl p-3 space-y-2 z-10">
        {[
          { shape: "◆", color: "#6C63FF", label: "Main Topic" },
          { shape: "◈", color: "#00D4FF", label: "Branch" },
          { shape: "●", color: "#A78BFA", label: "Concept" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span style={{ color: item.color }} className="text-sm">
              {item.shape}
            </span>
            <span className="text-xs text-[#8888AA]">{item.label}</span>
          </div>
        ))}
        <div className="border-t border-[#1E1E3F] pt-2 space-y-1">
          {[
            { color: "#6C63FF", label: "Contains" },
            { color: "#00D4FF", label: "Leads to" },
            { color: "#A78BFA", label: "Related" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="w-3 h-0.5 rounded" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-[#8888AA]">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && <NodeInfoPanel node={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
