"use client"

import Image from "next/image"

interface LoadingAnimationProps {
  message?: string
}

export function LoadingAnimation({ message = "Loading repository data..." }: LoadingAnimationProps) {
  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-background overflow-hidden">
      {/* Background particle effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10" />
      </div>

      {/* Main loading content */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Logo */}
        <div className="relative h-48 w-48 animate-fade-in">
          <Image
            src="/Logo.png"
            alt="Adaptive Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Animated dots */}
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-blue-400 animate-bounce-dot" style={{ animationDelay: '0s' }}></div>
          <div className="h-3 w-3 rounded-full bg-purple-400 animate-bounce-dot" style={{ animationDelay: '0.2s' }}></div>
          <div className="h-3 w-3 rounded-full bg-pink-400 animate-bounce-dot" style={{ animationDelay: '0.4s' }}></div>
        </div>

        {/* Loading message */}
        <div className="text-center">
          <p className="text-white text-lg font-medium animate-pulse">{message}</p>
          <p className="text-white/60 text-sm mt-2">This may take a minute for large repositories</p>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-progress-bar"></div>
        </div>
      </div>
    </div>
  )
}

