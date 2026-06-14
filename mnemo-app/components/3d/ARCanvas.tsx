"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  nodes: any[];
  scale: number;
}

export function ARCanvas({ nodes, scale }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x6C63FF, 1, 100);
    pointLight.position.set(0, 2, 0);
    scene.add(pointLight);

    // Build Graph Group
    const graphGroup = new THREE.Group();
    // Position the graph in front of the camera
    graphGroup.position.set(0, 0, -1);

    nodes.forEach(node => {
      const importance = node.importance || 5;
      const radius = (importance / 10) * 0.04 + 0.02;
      
      const strength = node.memoryStrength ?? 0.5;
      const colorHex = strength < 0.3 ? 0xFF6B6B : strength < 0.6 ? 0xFFD93D : 0x6BCB77;

      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshStandardMaterial({ 
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.3
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        node.positionX * scale,
        node.positionY * scale,
        node.positionZ * scale
      );
      
      graphGroup.add(mesh);
    });

    scene.add(graphGroup);

    // Provide a button to enter AR to satisfy browser requirements for a user gesture
    const startARButton = document.createElement("button");
    startARButton.innerText = "Enter AR";
    startARButton.style.position = "absolute";
    startARButton.style.top = "50%";
    startARButton.style.left = "50%";
    startARButton.style.transform = "translate(-50%, -50%)";
    startARButton.style.padding = "16px 32px";
    startARButton.style.fontSize = "18px";
    startARButton.style.backgroundColor = "#6C63FF";
    startARButton.style.color = "white";
    startARButton.style.border = "none";
    startARButton.style.borderRadius = "30px";
    startARButton.style.zIndex = "100";
    containerRef.current.appendChild(startARButton);

    let session: any = null;

    startARButton.addEventListener("click", () => {
      if (navigator.xr) {
        navigator.xr.requestSession("immersive-ar", { requiredFeatures: ["local"] }).then((s) => {
          session = s;
          renderer.xr.setSession(session);
          startARButton.style.display = "none"; // Hide button after entering AR
        }).catch(err => {
          console.error("AR Session Error:", err);
          alert("Failed to start AR session.");
        });
      }
    });

    // Animation Loop
    renderer.setAnimationLoop(() => {
      // Subtle rotation to keep it dynamic
      graphGroup.rotation.y += 0.005;
      renderer.render(scene, camera);
    });

    // Cleanup
    return () => {
      renderer.setAnimationLoop(null);
      if (session) session.end();
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      if (containerRef.current?.contains(startARButton)) {
        containerRef.current.removeChild(startARButton);
      }
    };
  }, [nodes, scale]);

  return <div ref={containerRef} className="w-full h-full" />;
}
