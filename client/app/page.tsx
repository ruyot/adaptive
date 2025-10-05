"use client"

import { CodebaseStack } from "@/components/codebase-stack"
import { HeroCard } from "@/components/hero-card"

export default function Home() {
  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background">
      {/* 3D Background Stack */}
      <div className="absolute inset-0">
        <CodebaseStack onSectionClick={() => {}} selectedSection={null} />
      </div>

      {/* Centered Hero Card */}
      <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
        <div className="pointer-events-auto">
          <HeroCard />
        </div>
      </div>
    </div>
  )
}
