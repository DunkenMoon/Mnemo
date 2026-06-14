"use client";
import { useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface CollaboratorState {
  userId: string;
  userName: string;
  avatarColor: string;
  selectedNodeId: string | null;
}

interface Props {
  collaborator: CollaboratorState;
  nodes: Array<{ id: string; positionX: number; positionY: number; positionZ: number }>;
}

export function CollaboratorCursor({ collaborator, nodes }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const targetNode = collaborator.selectedNodeId
    ? nodes.find((n) => n.id === collaborator.selectedNodeId) : null;

  const position: [number, number, number] = targetNode
    ? [targetNode.positionX, targetNode.positionY + 2, targetNode.positionZ] : [0, 0, 0];

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.02;
  });

  if (!targetNode) return null;

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial 
          color={collaborator.avatarColor} 
          emissive={collaborator.avatarColor}
          emissiveIntensity={1.2} 
          transparent 
          opacity={0.8} 
        />
      </mesh>
      <Html distanceFactor={12} style={{ pointerEvents: "none", transform: "translate3d(-50%, -100%, 0)" }}>
        <div className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
          style={{ 
            backgroundColor: `${collaborator.avatarColor}33`, 
            border: `1px solid ${collaborator.avatarColor}`,
            color: collaborator.avatarColor, 
            fontFamily: "Space Grotesk, sans-serif" 
          }}>
          {collaborator.userName}
        </div>
      </Html>
    </group>
  );
}
