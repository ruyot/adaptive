"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Github } from "lucide-react"

export function HeroCard() {
  const [githubUrl, setGithubUrl] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (githubUrl.trim()) {
      // Navigate to visualizer page
      router.push("/visualizer")
    }
  }

  return (
    <div className="hero-card group relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 p-8 shadow-2xl backdrop-blur-xl">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20" />
      </div>

      {/* Holographic shimmer effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center space-y-6">
        {/* Title */}
        <h1 className="bg-gradient-to-br from-white via-blue-100 to-purple-200 bg-clip-text text-6xl font-bold tracking-tight text-transparent">
          Adaptive
        </h1>

        {/* Subtitle */}
        <p className="text-center text-xl font-light text-white/80">Making Programming Simple</p>

        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* GitHub URL Input */}
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className="group/input relative">
            {/* GitHub Icon */}
            <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-white/80 transition-colors group-hover/input:text-white">
              <Github className="h-5 w-5" strokeWidth={2} />
            </div>

            {/* Input Field */}
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="Enter GitHub repository URL..."
              className="w-full rounded-xl border border-white/20 bg-black/30 py-3.5 pl-12 pr-4 text-white placeholder-white/40 outline-none backdrop-blur-sm transition-all duration-300 focus:border-white/40 focus:bg-black/40 focus:ring-2 focus:ring-white/20"
            />

            {/* Glow effect on focus */}
            <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 focus-within:opacity-100">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 blur-xl" />
            </div>
          </div>

          {/* Hidden submit button for Enter key functionality */}
          <button type="submit" className="hidden" />
        </form>

        {/* Hint text */}
        <p className="text-center text-sm text-white/40">Analyze your repository to get started</p>
      </div>

      {/* Corner accents */}
      <div className="absolute left-0 top-0 h-20 w-20 border-l-2 border-t-2 border-white/20 transition-all duration-300 group-hover:border-white/40" />
      <div className="absolute bottom-0 right-0 h-20 w-20 border-b-2 border-r-2 border-white/20 transition-all duration-300 group-hover:border-white/40" />
    </div>
  )
}

