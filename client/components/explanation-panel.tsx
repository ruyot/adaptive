"use client"

import { useState } from "react"
import { Code2, FileCode, Wand2, Loader2 } from "lucide-react"

interface ExplanationPanelProps {
  explanation: {
    title: string
    description: string
    details: string[]
  }
  onAnalyzeFile?: (path: string, content: string) => void
  filePath?: string
  analysisResult?: any
}

export function ExplanationPanel({ explanation, onAnalyzeFile, filePath, analysisResult }: ExplanationPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    if (!onAnalyzeFile || !filePath) return
    
    setIsAnalyzing(true)
    
    try {
      await onAnalyzeFile(filePath, "")
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="flex h-[600px] w-[400px] flex-col overflow-hidden rounded-2xl p-6">
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-blue-400" />
            <h2 className="font-mono text-lg font-semibold text-white">{explanation.title}</h2>
          </div>
          {onAnalyzeFile && filePath && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg hover:from-purple-500/30 hover:to-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Analyze file with AI"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 text-purple-400" />
              )}
              <span className="text-xs font-medium text-purple-300">
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </span>
            </button>
          )}
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

      {/* Analysis Result Box */}
      {analysisResult && (
        <div className="holographic-card mt-4 rounded-xl p-4 border border-green-500/30 bg-green-500/5">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400"></div>
            <h3 className="font-mono text-sm font-medium text-green-300">AI Analysis</h3>
          </div>
          <div className="text-sm text-white/90 leading-relaxed">
            {typeof analysisResult === 'string' ? (
              <p>{analysisResult}</p>
            ) : (
              <pre className="whitespace-pre-wrap text-xs">
                {JSON.stringify(analysisResult, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

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
