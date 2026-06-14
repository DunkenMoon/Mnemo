"use client"

import { useRef, useMemo, Suspense, type CSSProperties } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { 
  Stars, 
  OrbitControls,
  Float,
} from "@react-three/drei"
import { 
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
} from "@react-three/postprocessing"
import { BlendFunction } from "postprocessing"
import * as THREE from "three"
import { ConceptNode } from "./ConceptNode"
import { ConceptEdge } from "./ConceptEdge"
import { CollaboratorCursor } from "./CollaboratorCursor"

// Nebula cloud behind the universe
function NebulaCloud() {
  const meshRef = useRef<THREE.Mesh>(null)
  const mesh2Ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = 
        state.clock.elapsedTime * 0.02
      meshRef.current.rotation.x = 
        state.clock.elapsedTime * 0.01
    }
    if (mesh2Ref.current) {
      mesh2Ref.current.rotation.y = 
        -state.clock.elapsedTime * 0.015
    }
  })

  return (
    <group>
      {/* Purple nebula */}
      <mesh ref={meshRef} position={[0, 0, -20]}>
        <sphereGeometry args={[18, 16, 16]} />
        <meshStandardMaterial
          color="#6C63FF"
          emissive="#6C63FF"
          emissiveIntensity={0.08}
          transparent
          opacity={0.04}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Cyan nebula offset */}
      <mesh 
        ref={mesh2Ref} 
        position={[8, -4, -15]}
      >
        <sphereGeometry args={[12, 12, 12]} />
        <meshStandardMaterial
          color="#00D4FF"
          emissive="#00D4FF"
          emissiveIntensity={0.06}
          transparent
          opacity={0.03}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

// Ambient floating particles in scene
function AmbientParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  
  const { positions, colors } = useMemo(() => {
    const count = 200
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const palette = [
      new THREE.Color("#6C63FF"),
      new THREE.Color("#00D4FF"),
      new THREE.Color("#A78BFA"),
    ]
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40
      positions[i * 3 + 1] = 
        (Math.random() - 0.5) * 40
      positions[i * 3 + 2] = 
        (Math.random() - 0.5) * 40
      
      const col = palette[
        Math.floor(Math.random() * palette.length)
      ]
      colors[i * 3] = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b
    }
    return { positions, colors }
  }, [])

  useFrame((state) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y = 
      state.clock.elapsedTime * 0.005
    pointsRef.current.rotation.x = 
      state.clock.elapsedTime * 0.003
  })

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    )
    geo.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3)
    )
    return geo
  }, [positions, colors])

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

// Central gravity core — glowing orb at origin
function GravityCore() {
  const meshRef = useRef<THREE.Mesh>(null)
  const outerRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current || !outerRef.current) return
    const pulse = 
      Math.sin(state.clock.elapsedTime * 2) 
      * 0.1 + 0.9
    meshRef.current.scale.setScalar(pulse)
    outerRef.current.scale.setScalar(
      pulse * 1.5
    )
    const mat = meshRef.current
      .material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 
      Math.sin(state.clock.elapsedTime * 2) 
      * 0.3 + 0.7
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color="#A78BFA"
          emissive="#A78BFA"
          emissiveIntensity={0.8}
          roughness={0}
          metalness={1}
        />
      </mesh>
      <mesh ref={outerRef}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color="#6C63FF"
          emissive="#6C63FF"
          emissiveIntensity={0.3}
          transparent
          opacity={0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

// Dynamic lighting that shifts color over time
function DynamicLighting() {
  const light1Ref = useRef<THREE.PointLight>(null)
  const light2Ref = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (light1Ref.current) {
      light1Ref.current.position.x = 
        Math.sin(t * 0.3) * 15
      light1Ref.current.position.y = 
        Math.cos(t * 0.2) * 10
      light1Ref.current.intensity = 
        Math.sin(t * 0.5) * 0.3 + 1.0
    }

    if (light2Ref.current) {
      light2Ref.current.position.x = 
        Math.cos(t * 0.25) * 12
      light2Ref.current.position.z = 
        Math.sin(t * 0.35) * 12
      light2Ref.current.intensity = 
        Math.cos(t * 0.4) * 0.2 + 0.6
    }
  })

  return (
    <>
      <ambientLight intensity={0.2} color="#0A0A2F" />
      <pointLight
        ref={light1Ref}
        position={[10, 10, 10]}
        intensity={1.0}
        color="#6C63FF"
        distance={50}
        decay={2}
      />
      <pointLight
        ref={light2Ref}
        position={[-10, -5, -10]}
        intensity={0.6}
        color="#00D4FF"
        distance={40}
        decay={2}
      />
      <pointLight
        position={[0, 15, 0]}
        intensity={0.3}
        color="#A78BFA"
        distance={30}
        decay={2}
      />
    </>
  )
}

interface KnowledgeUniverseProps {
  nodes: any[]
  edges: any[]
  onNodeClick: (node: any) => void
  highlightedNodes?: string[]
  selectedNodeId?: string | null
  collaborators?: any[]
  canvasStyle?: CSSProperties
  autoRotate?: boolean
  cameraFov?: number
}

function Scene({
  nodes,
  edges,
  onNodeClick,
  highlightedNodes = [],
  selectedNodeId,
  collaborators,
  autoRotate = true,
}: KnowledgeUniverseProps) {
  const controlsRef = useRef<any>(null)

  // Local graph view: compute connected nodes for dimming
  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>()
    const connected = new Set<string>([selectedNodeId])
    edges.forEach((e: any) => {
      if (e.sourceNodeId === selectedNodeId)
        connected.add(e.targetNodeId)
      if (e.targetNodeId === selectedNodeId)
        connected.add(e.sourceNodeId)
    })
    return connected
  }, [selectedNodeId, edges])

  return (
    <>
      <DynamicLighting />

      {/* Deep space star fields — 3 layers */}
      <Stars
        radius={80}
        depth={80}
        count={5000}
        factor={3}
        saturation={0}
        fade
        speed={0.2}
      />
      <Stars
        radius={40}
        depth={20}
        count={1000}
        factor={5}
        saturation={1}
        fade
        speed={0.5}
      />

      {/* Nebula and atmosphere */}
      <NebulaCloud />

      {/* Ambient floating particles */}
      <AmbientParticles />

      {/* Central gravity core */}
      <GravityCore />

      {/* Concept edges */}
      {edges.map((edge: any) => {
        const sourceNode = nodes.find(
          (n: any) => n.id === edge.sourceNodeId
        )
        const targetNode = nodes.find(
          (n: any) => n.id === edge.targetNodeId
        )
        if (!sourceNode || !targetNode) return null

        const isHighlighted =
          highlightedNodes.includes(
            edge.sourceNodeId
          ) &&
          highlightedNodes.includes(
            edge.targetNodeId
          )

        const isActive =
          selectedNodeId === edge.sourceNodeId ||
          selectedNodeId === edge.targetNodeId

        return (
          <ConceptEdge
            key={edge.id}
            start={[
              sourceNode.positionX,
              sourceNode.positionY,
              sourceNode.positionZ,
            ]}
            end={[
              targetNode.positionX,
              targetNode.positionY,
              targetNode.positionZ,
            ]}
            strength={edge.strength ?? 0.7}
            highlighted={isHighlighted}
            active={isActive}
          />
        )
      })}

      {/* Concept nodes */}
      {nodes.map((node: any) => (
        <ConceptNode
          key={node.id}
          node={node}
          memoryStrength={node.memoryStrength ?? 0.5}
          onClick={() => onNodeClick(node)}
          isSelected={selectedNodeId === node.id}
          isHighlighted={
            highlightedNodes.includes(node.id)
          }
          dimmed={
            selectedNodeId !== null &&
            !connectedNodeIds.has(node.id)
          }
        />
      ))}

      {/* Collaborator cursors */}
      {collaborators && collaborators.map((collab: any) => (
        <CollaboratorCursor
          key={collab.userId}
          collaborator={collab}
          nodes={nodes}
        />
      ))}

      {/* Camera controls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.04}
        maxDistance={45}
        minDistance={3}
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={0.3}
        makeDefault
      />

      {/* Post processing effects */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={1.8}
          blendFunction={BlendFunction.ADD}
        />
        <ChromaticAberration
          offset={new THREE.Vector2(0.0008, 0.0008)}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette
          offset={0.35}
          darkness={0.7}
          blendFunction={BlendFunction.NORMAL}
        />
        <Noise
          opacity={0.025}
          blendFunction={BlendFunction.ADD}
        />
      </EffectComposer>
    </>
  )
}

export default function KnowledgeUniverse(
  props: KnowledgeUniverseProps
) {
  const { canvasStyle, cameraFov = 60, autoRotate = true, ...sceneProps } = props;

  return (
    <Canvas
      style={{
        width: "100%",
        height: "100%",
        background: "#050510",
        ...canvasStyle,
      }}
      camera={{
        position: [0, 0, 20],
        fov: cameraFov,
        near: 0.1,
        far: 1000,
      }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      dpr={[1, 2]}
    >
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin w-8 h-8 border-2 border-[#6C63FF] border-t-transparent rounded-full"/>
        </div>
      }>
        <Scene {...sceneProps} autoRotate={autoRotate} />
      </Suspense>
    </Canvas>
  )
}
