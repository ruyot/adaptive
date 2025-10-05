"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, Html, RoundedBox, Float } from "@react-three/drei"
import { useRef, useState } from "react"
import * as THREE from "three"

interface StackLayerProps {
  position: [number, number, number]
  color: string
  label: string
  section: string
  onClick: (section: string) => void
  isSelected: boolean
}

function StackLayer({ position, color, label, section, onClick, isSelected }: StackLayerProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[1]) * 0.05

      // Glow effect on hover or selection
      if (hovered || isSelected) {
        meshRef.current.scale.lerp(new THREE.Vector3(1.05, 1.05, 1.05), 0.1)
      } else {
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
      }
    }
  })

  return (
    <group position={position}>
      <RoundedBox
        ref={meshRef}
        args={[4, 0.6, 3]}
        radius={0.1}
        smoothness={4}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onClick(section)}
      >
        <meshPhysicalMaterial
          color={color}
          metalness={0.3}
          roughness={0.2}
          transmission={0.1}
          thickness={0.5}
          envMapIntensity={1.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
          emissive={color}
          emissiveIntensity={isSelected ? 0.4 : hovered ? 0.2 : 0}
        />
      </RoundedBox>

      <Html position={[0, 0.8, 0]} center distanceFactor={8}>
        <div className="pointer-events-none flex flex-col items-center">
          {/* Connecting stem */}
          <div
            className="mb-1 h-8 w-0.5 bg-gradient-to-b from-white/60 to-transparent"
            style={{
              filter: hovered || isSelected ? "drop-shadow(0 0 4px white)" : "none",
              transition: "filter 0.3s ease",
            }}
          />
          {/* Thought bubble */}
          <div
            className="relative rounded-2xl border border-white/30 bg-black/40 px-4 py-2 backdrop-blur-sm"
            style={{
              boxShadow:
                hovered || isSelected ? `0 0 20px ${color}80, 0 0 40px ${color}40` : "0 4px 12px rgba(0,0,0,0.5)",
              transition: "box-shadow 0.3s ease",
            }}
          >
            <div className="font-mono text-sm font-bold tracking-wider text-white">{label}</div>
            {/* Small bubble tail circles */}
            <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
              <div className="h-1.5 w-1.5 rounded-full border border-white/30 bg-black/40" />
              <div className="h-1 w-1 rounded-full border border-white/30 bg-black/40" />
            </div>
          </div>
        </div>
      </Html>

      {/* Holographic edge glow */}
      <RoundedBox args={[4.05, 0.65, 3.05]} radius={0.1} smoothness={4}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.3 : hovered ? 0.2 : 0}
          side={THREE.BackSide}
        />
      </RoundedBox>
    </group>
  )
}

function ParticleField() {
  const particlesRef = useRef<THREE.Points>(null)

  const particleCount = 1000
  const positions = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#4a9eff" transparent opacity={0.6} sizeAttenuation />
    </points>
  )
}

interface CodebaseStackProps {
  onSectionClick: (section: string) => void
  selectedSection: string | null
}

export function CodebaseStack({ onSectionClick, selectedSection }: CodebaseStackProps) {
  return (
    <Canvas camera={{ position: [0, 2, 8], fov: 50 }} gl={{ antialias: true, alpha: true }} className="h-full w-full">
      <color attach="background" args={["#0a0a0a"]} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={1} castShadow />
      <spotLight position={[-10, -10, -10]} angle={0.3} penumbra={1} intensity={0.5} />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#4a9eff" />

      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* Particle field background */}
      <ParticleField />

      {/* Stack layers */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <StackLayer
          position={[0, 1.5, 0]}
          color="#3b82f6"
          label="FRONTEND"
          section="frontend"
          onClick={onSectionClick}
          isSelected={selectedSection === "frontend"}
        />
      </Float>

      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <StackLayer
          position={[0, 0.5, 0]}
          color="#8b5cf6"
          label="BACKEND"
          section="backend"
          onClick={onSectionClick}
          isSelected={selectedSection === "backend"}
        />
      </Float>

      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <StackLayer
          position={[0, -0.5, 0]}
          color="#ec4899"
          label="DATABASE"
          section="database"
          onClick={onSectionClick}
          isSelected={selectedSection === "database"}
        />
      </Float>

      {/* Grid floor */}
      <gridHelper args={[20, 20, "#1a1a1a", "#1a1a1a"]} position={[0, -2, 0]} />

      <OrbitControls enableZoom={true} enablePan={false} minDistance={5} maxDistance={15} maxPolarAngle={Math.PI / 2} />
    </Canvas>
  )
}
