"use client"

import { Code2, FileCode } from "lucide-react"

interface ExplanationPanelProps {
  explanation: {
    title: string
    description: string
    details: string[]
  }
}

export function ExplanationPanel({ explanation }: ExplanationPanelProps) {
  return (
    <div className="flex h-[600px] w-[400px] flex-col overflow-hidden rounded-2xl p-6">
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <FileCode className="h-5 w-5 text-blue-400" />
          <h2 className="font-mono text-lg font-semibold text-white">{explanation.title}</h2>
        </div>
        <p className="text-sm leading-relaxed text-white/80">{explanation.description}</p>
      </div>

      <div className="holographic-card flex-1 overflow-y-auto rounded-xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <Code2 className="h-4 w-4 text-blue-400" />
          <h3 className="font-mono text-sm font-medium text-white">Key Features</h3>
        </div>
        <ul className="space-y-3">
          {explanation.details.map((detail, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-white/80">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
              <span className="leading-relaxed">{detail}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="holographic-card mt-4 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-white/60">Lines of Code</span>
          <span className="font-mono text-sm text-white">247</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-xs text-white/60">Last Modified</span>
          <span className="font-mono text-sm text-white">2 days ago</span>
        </div>
      </div>
    </div>
  )
}
