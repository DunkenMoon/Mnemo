"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function AnimatedTorus() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.5;
      ref.current.rotation.x += delta * 0.25;
    }
  });

  return (
    <mesh ref={ref}>
      <torusKnotGeometry args={[3, 0.8, 200, 20]} />
      <meshStandardMaterial
        color="#6C63FF"
        emissive="#6C63FF"
        emissiveIntensity={0.15}
        wireframe={true}
      />
    </mesh>
  );
}
