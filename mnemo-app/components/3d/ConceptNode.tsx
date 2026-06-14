"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

function getMemoryVisuals(strength: number, highlighted: boolean) {
  if (highlighted) {
    return { color: "#A78BFA", emissiveIntensity: 0.6 };
  }
  if (strength < 0.3) {
    return { color: "#FF6B6B", emissiveIntensity: 0.8 };
  }
  if (strength < 0.6) {
    return { color: "#FFD93D", emissiveIntensity: 0.5 };
  }
  return { color: "#6BCB77", emissiveIntensity: 0.4 };
}

function NodeBurst({
  active,
  color,
  position,
}: {
  active: boolean;
  color: string;
  position: [number, number, number];
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const velocities = useRef<Float32Array>(new Float32Array(20 * 3));
  const opacityRef = useRef(1);
  const initialized = useRef(false);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(20 * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  if (active && !initialized.current) {
    initialized.current = true;
    opacityRef.current = 1;
    for (let i = 0; i < 20; i++) {
      velocities.current[i * 3] = (Math.random() - 0.5) * 0.15;
      velocities.current[i * 3 + 1] = (Math.random() - 0.5) * 0.15;
      velocities.current[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
    }
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < 20; i++) {
      pos.setXYZ(i, 0, 0, 0);
    }
    pos.needsUpdate = true;
  }

  if (!active) {
    initialized.current = false;
  }

  useFrame((_, delta) => {
    if (!active || !pointsRef.current) return;

    opacityRef.current = Math.max(0, opacityRef.current - delta * 1.8);

    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = opacityRef.current;

    const pos = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < 20; i++) {
      pos.setX(i, pos.getX(i) + velocities.current[i * 3] * delta * 60);
      pos.setY(i, pos.getY(i) + velocities.current[i * 3 + 1] * delta * 60);
      pos.setZ(i, pos.getZ(i) + velocities.current[i * 3 + 2] * delta * 60);
    }
    pos.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef} position={position} geometry={geometry}>
      <pointsMaterial
        color={color}
        size={0.12}
        transparent
        opacity={1}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function OrbitalRing({ color, radius }: { color: string; radius: number }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z += delta * 0.8;
    ringRef.current.rotation.x += delta * 0.3;
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[radius + 0.4, 0.02, 8, 64]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

interface ConceptNodeProps {
  node: {
    id: string;
    label: string;
    explanation?: string;
    importance: number;
    positionX: number;
    positionY: number;
    positionZ: number;
  };
  memoryStrength: number;
  onClick: () => void;
  isSelected?: boolean;
  isHighlighted?: boolean;
  dimmed?: boolean;
}

export function ConceptNode({
  node,
  memoryStrength,
  onClick,
  isSelected = false,
  isHighlighted = false,
  dimmed = false,
}: ConceptNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [burst, setBurst] = useState(false);
  const scaleRef = useRef(1);
  const pulseRef = useRef(0);
  const currentColorRef = useRef(new THREE.Color("#6BCB77"));
  const targetColorRef = useRef(new THREE.Color("#6BCB77"));
  const emissiveIntensityRef = useRef(0.4);

  const radius = useMemo(
    () => (node.importance / 10) * 0.8 + 0.3,
    [node.importance]
  );

  const visuals = useMemo(
    () => getMemoryVisuals(memoryStrength, isHighlighted),
    [memoryStrength, isHighlighted]
  );

  useEffect(() => {
    targetColorRef.current.set(visuals.color);
    emissiveIntensityRef.current = isSelected ? 2.0 : visuals.emissiveIntensity;
  }, [visuals, isSelected]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    pulseRef.current += delta;

    currentColorRef.current.lerp(targetColorRef.current, 1 / 60);

    const targetScale = dimmed
      ? 0.4
      : isSelected
        ? 1.3
        : hovered
          ? 1.2
          : isHighlighted
            ? 1.15
            : 1.0;

    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, 0.1);
    meshRef.current.scale.setScalar(scaleRef.current);

    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.color.copy(currentColorRef.current);
    mat.emissive.copy(currentColorRef.current);

    const pulse = dimmed
      ? 0.02
      : isSelected || isHighlighted
        ? Math.sin(pulseRef.current * 3) * 0.3 + emissiveIntensityRef.current
        : hovered
          ? Math.sin(pulseRef.current * 2) * 0.2 + emissiveIntensityRef.current
          : Math.sin(pulseRef.current * 1.5) * 0.1 + emissiveIntensityRef.current;

    mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, pulse, delta * 4);

    if (glowRef.current) {
      const glowMat = glowRef.current.material as THREE.MeshStandardMaterial;
      glowMat.color.copy(currentColorRef.current);
      glowMat.emissive.copy(currentColorRef.current);
      glowMat.emissiveIntensity = pulse * 0.3;
      glowRef.current.scale.setScalar(
        scaleRef.current * (1.3 + Math.sin(pulseRef.current) * 0.05)
      );
    }
  });

  const handleClick = () => {
    setBurst(true);
    setTimeout(() => setBurst(false), 800);
    onClick();
  };

  const position: [number, number, number] = [
    node.positionX,
    node.positionY,
    node.positionZ,
  ];

  const displayColor = visuals.color;

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={isSelected ? 0 : 0.3}>
      <group position={position}>
        {(hovered || isSelected) && !dimmed && (
          <pointLight color={displayColor} intensity={2.0} distance={4} decay={2} />
        )}

        <mesh ref={glowRef}>
          <sphereGeometry args={[radius * 1.4, 16, 16]} />
          <meshStandardMaterial
            color={displayColor}
            emissive={displayColor}
            emissiveIntensity={0.2}
            transparent
            opacity={0.08}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
        >
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial
            color={displayColor}
            emissive={displayColor}
            emissiveIntensity={visuals.emissiveIntensity}
            roughness={0.1}
            metalness={0.6}
            envMapIntensity={dimmed ? 0.2 : 1.5}
          />
        </mesh>

        {memoryStrength > 0.7 && (
          <Sparkles
            count={12}
            scale={radius * 4}
            size={0.4}
            speed={0.3}
            color={displayColor}
            opacity={0.5}
          />
        )}

        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius + 0.55, 0.015, 8, 64]} />
          <meshStandardMaterial
            color={displayColor}
            emissive={displayColor}
            emissiveIntensity={1.2}
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <mesh rotation={[Math.PI / 4, Math.PI / 6, 0]}>
          <torusGeometry args={[radius + 0.75, 0.012, 8, 64]} />
          <meshStandardMaterial
            color="#00D4FF"
            emissive="#00D4FF"
            emissiveIntensity={0.8}
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {isSelected && <OrbitalRing color={displayColor} radius={radius + 0.35} />}

        {isSelected && (
          <group rotation={[Math.PI / 3, 0, 0]}>
            <OrbitalRing color="#A78BFA" radius={radius + 0.95} />
          </group>
        )}

        <NodeBurst active={burst} color={displayColor} position={[0, 0, 0]} />

        <Html
          center
          distanceFactor={12}
          style={{ pointerEvents: "none" }}
          position={[0, radius + 0.4, 0]}
        >
          <div
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: hovered || isSelected ? "13px" : "11px",
              fontWeight: 600,
              color: dimmed
                ? "#8888AA40"
                : isSelected
                  ? "#ffffff"
                  : hovered
                    ? displayColor
                    : "#F0F0FF",
              textShadow: dimmed
                ? "none"
                : `0 0 10px ${displayColor}, 0 0 20px ${displayColor}80`,
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              letterSpacing: "0.02em",
              padding: "2px 8px",
              background: isSelected ? `${displayColor}20` : "transparent",
              borderRadius: "6px",
              border: isSelected ? `1px solid ${displayColor}40` : "none",
            }}
          >
            {node.label}
          </div>
        </Html>

        {hovered && !isSelected && !dimmed && node.explanation && (
          <Html
            distanceFactor={10}
            center
            style={{ pointerEvents: "none", zIndex: 999 }}
            position={[0, radius + 1.2, 0]}
          >
            <div
              style={{
                background: "rgba(10, 10, 31, 0.95)",
                border: "1px solid #1E1E3F",
                borderRadius: "12px",
                padding: "12px 16px",
                maxWidth: "200px",
                boxShadow: `0 0 20px ${displayColor}30`,
                backdropFilter: "blur(12px)",
              }}
            >
              <p
                style={{
                  color: displayColor,
                  fontSize: "11px",
                  fontFamily: "Fira Code, monospace",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {node.label}
              </p>
              <p
                style={{
                  color: "#8888AA",
                  fontSize: "11px",
                  fontFamily: "Inter, sans-serif",
                  lineHeight: 1.5,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  margin: 0,
                }}
              >
                {node.explanation}
              </p>
              <p
                style={{
                  color: "#8888AA",
                  fontSize: "10px",
                  fontFamily: "Fira Code, monospace",
                  marginTop: "8px",
                  marginBottom: 0,
                }}
              >
                Click to explore →
              </p>
            </div>
          </Html>
        )}
      </group>
    </Float>
  );
}
