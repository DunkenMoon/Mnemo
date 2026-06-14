"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Line } from "@react-three/drei"
import * as THREE from "three"

interface ConceptEdgeProps {
  start: [number, number, number]
  end: [number, number, number]
  strength: number
  highlighted?: boolean
  active?: boolean
}

// Animated energy pulse traveling along edge
function EnergyPulse({
  start,
  end,
  color,
  speed,
  offset,
}: {
  start: [number, number, number]
  end: [number, number, number]
  color: string
  speed: number
  offset: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const progressRef = useRef(offset)

  const startVec = useMemo(
    () => new THREE.Vector3(...start),
    [start]
  )
  const endVec = useMemo(
    () => new THREE.Vector3(...end),
    [end]
  )

  useFrame((_, delta) => {
    if (!meshRef.current) return
    progressRef.current = 
      (progressRef.current + delta * speed) % 1

    const pos = new THREE.Vector3().lerpVectors(
      startVec,
      endVec,
      progressRef.current
    )
    meshRef.current.position.copy(pos)

    // Fade in and out at edges
    const t = progressRef.current
    const fadeIn = Math.min(t * 5, 1)
    const fadeOut = Math.min((1 - t) * 5, 1)
    const opacity = fadeIn * fadeOut

    const mat = meshRef.current
      .material as THREE.MeshStandardMaterial
    mat.opacity = opacity
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={3}
        transparent
        opacity={1}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

export function ConceptEdge({
  start,
  end,
  strength,
  highlighted = false,
  active = false,
}: ConceptEdgeProps) {
  const materialRef = useRef<any>(null)
  const dashRef = useRef(0)

  const edgeColor = highlighted
    ? "#A78BFA"
    : active
    ? "#00D4FF"
    : "#6C63FF"

  const lineWidth = highlighted
    ? Math.max(strength * 2.5, 1.5)
    : Math.max(strength * 1.2, 0.5)

  const opacity = highlighted
    ? 0.9
    : active
    ? 0.7
    : 0.2 + strength * 0.3

  useFrame((_, delta) => {
    if (!materialRef.current) return
    dashRef.current -= delta * 
      (highlighted ? 1.2 : 0.6)
    materialRef.current.dashOffset = dashRef.current
  })

  // Generate curved path between nodes
  const points = useMemo(() => {
    const s = new THREE.Vector3(...start)
    const e = new THREE.Vector3(...end)
    const mid = s.clone().lerp(e, 0.5)
    // Add slight curve
    mid.y += Math.min(
      s.distanceTo(e) * 0.15, 
      2
    )
    const curve = new THREE.QuadraticBezierCurve3(
      s, mid, e
    )
    return curve.getPoints(20)
  }, [start, end])

  const pulseColor = highlighted 
    ? "#ffffff" 
    : "#00D4FF"

  return (
    <group>
      {/* Main edge line */}
      <Line
        points={points}
        color={edgeColor}
        lineWidth={lineWidth}
        transparent
        opacity={opacity}
        dashed
        dashScale={3}
        dashSize={0.5}
        gapSize={0.3}
        ref={materialRef}
      />

      {/* Glow line underneath */}
      <Line
        points={points}
        color={edgeColor}
        lineWidth={lineWidth * 3}
        transparent
        opacity={opacity * 0.08}
        depthWrite={false}
      />

      {/* Energy pulses traveling along edge */}
      {(highlighted || active || strength > 0.6) && (
        <>
          <EnergyPulse
            start={start}
            end={end}
            color={pulseColor}
            speed={highlighted ? 0.8 : 0.5}
            offset={0}
          />
          {highlighted && (
            <EnergyPulse
              start={start}
              end={end}
              color={pulseColor}
              speed={0.8}
              offset={0.5}
            />
          )}
        </>
      )}
    </group>
  )
}
