"use client"

import { useState } from "react"
import { Code2, FileCode, Wand2, Loader2, X, ExternalLink } from "lucide-react"

interface ExplanationPanelProps {
  explanation: {
    title: string
    description: string
    details: string[]
  }
  onAnalyzeFile?: (path: string, content: string) => void
  onClearAnalysis?: () => void
  filePath?: string
  analysisResult?: any
  repoUrl?: string
}

export function ExplanationPanel({ explanation, onAnalyzeFile, onClearAnalysis, filePath, analysisResult, repoUrl }: ExplanationPanelProps) {
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

  // Extract path, classification, and content from details
  const path = explanation.details[0]?.replace('Path: ', '') || ''
  const classification = explanation.details[1]?.replace('Classification: ', '') || ''
  const contentPreview = explanation.details.slice(3).join('\n') || 'No content available'
  
  // Create GitHub URL
  const githubUrl = repoUrl && path ? `${repoUrl}/blob/main/${path}` : null

  return (
    <div className="flex h-[600px] w-[400px] flex-col overflow-hidden rounded-2xl p-6">
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-blue-400" />
            <h2 className="font-mono text-lg font-semibold text-white">{explanation.title}</h2>
          </div>
          {onAnalyzeFile && filePath && !analysisResult && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px] justify-center"
              style={{ transition: 'opacity 0.2s' }}
              title="Analyze file with AI"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                  <span className="text-xs font-medium text-purple-300">Analyzing...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 text-purple-400" />
                  <span className="text-xs font-medium text-purple-300">Analyze</span>
                </>
              )}
            </button>
          )}
        </div>
        <p className="text-sm leading-relaxed text-white/80">{explanation.description}</p>
      </div>

      <div className="holographic-card flex-1 overflow-y-auto rounded-xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <Code2 className="h-4 w-4 text-blue-400" />
          <h3 className="font-mono text-sm font-medium text-white">File Details</h3>
        </div>
        
        <div className="space-y-4">
          {/* Path */}
          <div>
            <div className="text-xs font-semibold text-blue-400 mb-1">Path</div>
            <div className="text-sm text-white/80 font-mono">{path}</div>
          </div>
          
          {/* Classification */}
          <div>
            <div className="text-xs font-semibold text-blue-400 mb-1">Classification</div>
            <div className="inline-flex items-center px-2 py-1 rounded-full bg-blue-500/20 border border-blue-500/30">
              <span className="text-xs font-medium text-blue-300 capitalize">{classification}</span>
            </div>
          </div>
          
          {/* Content Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-blue-400">Content Preview</div>
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 text-xs text-blue-300 hover:text-blue-200 bg-blue-500/10 hover:bg-blue-500/20 rounded border border-blue-500/30 transition-colors"
                  title="View on GitHub"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>GitHub</span>
                </a>
              )}
            </div>
            <div className="relative">
              <pre className="text-xs text-white/70 bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-3 overflow-x-auto font-mono leading-relaxed max-h-[200px] overflow-y-auto">
                {contentPreview}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Result Box */}
      {analysisResult && (
        <div className="holographic-card mt-4 rounded-xl p-4 border border-green-500/30 bg-green-500/5 max-h-[300px] overflow-y-auto">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
              <h3 className="font-mono text-sm font-medium text-green-300">AI Analysis</h3>
            </div>
            {onClearAnalysis && (
              <button
                onClick={onClearAnalysis}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="Clear analysis"
              >
                <X className="h-3 w-3 text-white/60 hover:text-white" />
              </button>
            )}
          </div>
          <div className="space-y-4">
            {analysisResult.summary && (
              <div>
                <h4 className="text-xs font-semibold text-green-400 mb-2">Summary</h4>
                <p className="text-sm text-white/90 leading-relaxed">{analysisResult.summary}</p>
              </div>
            )}
            
            {analysisResult.functions && Object.keys(analysisResult.functions).length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-green-400 mb-2">Functions</h4>
                <div className="space-y-2">
                  {Object.entries(analysisResult.functions).map(([funcName, description]) => (
                    <div key={funcName} className="pl-3 border-l-2 border-green-500/30">
                      <p className="text-xs font-mono text-blue-300 mb-1">{funcName}</p>
                      <p className="text-xs text-white/80 leading-relaxed">{String(description)}</p>
                    </div>
                  ))}
                </div>
              </div>
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
