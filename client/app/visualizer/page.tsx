"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { FileTree } from "@/components/file-tree"
import { ExplanationPanel } from "@/components/explanation-panel"
import { CodebaseStack } from "@/components/codebase-stack"
import { LoadingAnimation } from "@/components/loading-animation"
import { Home } from "lucide-react"

// Parse GitHub URL to extract owner, repo, and branch
function parseGitHubUrl(url: string): { owner: string; repo: string; branch: string } | null {
  try {
    // Handle various GitHub URL formats:
    // https://github.com/owner/repo
    // https://github.com/owner/repo/tree/branch
    // github.com/owner/repo
    // owner/repo
    
    let cleanUrl = url.trim()
    
    // Remove protocol if present
    cleanUrl = cleanUrl.replace(/^https?:\/\//, '')
    
    // Remove github.com if present
    cleanUrl = cleanUrl.replace(/^github\.com\//, '')
    
    // Remove trailing slashes
    cleanUrl = cleanUrl.replace(/\/$/, '')
    
    // Split by slashes
    const parts = cleanUrl.split('/')
    
    if (parts.length < 2) {
      return null
    }
    
    const owner = parts[0]
    const repo = parts[1]
    
    // Check if branch is specified (e.g., owner/repo/tree/branch)
    let branch = 'main'
    if (parts.length >= 4 && parts[2] === 'tree') {
      branch = parts[3]
    }
    
    return { owner, repo, branch }
  } catch (error) {
    console.error('Error parsing GitHub URL:', error)
    return null
  }
}

// Helper function to create nested directory structure
function createFileTree(files: any[], type: string) {
  const tree: any = {}
  const explanations: Record<string, any> = {}
  const fileContents: Record<string, string> = {}
  
  files.forEach((item: any, index: number) => {
    const fileId = `${type}-${index}`
    const pathParts = item.path.split('/')
    
    // Store full content for AI analysis
    if (item.content) {
      fileContents[fileId] = item.content
    }
    
    // Create explanation
    explanations[fileId] = {
      title: pathParts[pathParts.length - 1],
      description: `File type: ${item.type || 'unknown'}`,
      details: [
        `Path: ${item.path || 'unknown'}`,
        `Classification: ${item.type || 'unknown'}`,
        `Content Preview:`,
        item.lines ? item.lines.substring(0, 500) + (item.lines.length > 500 ? '...' : '') : 'No content available'
      ]
    }
    
    // Build nested structure
    let current = tree
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]
      
      if (!current[part]) {
        current[part] = {
          id: i === pathParts.length - 1 ? fileId : `${type}-folder-${part}`,
          name: part,
          path: pathParts.slice(0, i + 1).join('/'),
          type: i === pathParts.length - 1 ? "file" : "folder",
          children: i === pathParts.length - 1 ? undefined : {}
        }
      }
      
      if (i === pathParts.length - 1) {
        // This is a file
        current[part].id = fileId
      } else {
        // This is a folder
        current = current[part].children
      }
    }
  })
  
  return { tree, explanations, fileContents }
}

// Convert tree object to array format expected by FileTree component
function treeToArray(tree: any): any[] {
  const result: any[] = []
  
  Object.values(tree).forEach((node: any) => {
    if (node.type === "folder" && node.children) {
      node.children = treeToArray(node.children)
    }
    result.push(node)
  })
  
  return result.sort((a, b) => {
    // Folders first, then files
    if (a.type === "folder" && b.type === "file") return -1
    if (a.type === "file" && b.type === "folder") return 1
    return a.name.localeCompare(b.name)
  })
}

// Process real data from API response
function processRepoData(data: any[]) {
  console.log('Processing data:', data)
  
  const sections: any = {
    frontend: { name: "Frontend", files: [] },
    backend: { name: "Backend", files: [] },
    database: { name: "Database", files: [] }
  }
  
  const explanations: Record<string, { title: string; description: string; details: string[] }> = {}
  const fileContents: Record<string, string> = {}
  
  if (!data || !Array.isArray(data)) {
    console.error('Data is not an array:', data)
    return { sections, explanations, fileContents }
  }
  
  // Group files by type
  const filesByType: any = {
    frontend: [],
    backend: [],
    database: []
  }
  
  data.forEach((item: any) => {
    if (item.type && filesByType[item.type]) {
      filesByType[item.type].push(item)
    }
  })
  
  // Process each type to create directory structure
  Object.keys(filesByType).forEach(type => {
    if (filesByType[type].length > 0) {
      const { tree, explanations: typeExplanations, fileContents: typeContents } = createFileTree(filesByType[type], type)
      sections[type].files = treeToArray(tree)
      Object.assign(explanations, typeExplanations)
      Object.assign(fileContents, typeContents)
    }
  })
  
  console.log('Final sections:', sections)
  return { sections, explanations, fileContents }
}

function CodebaseVisualizerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const repoUrl = searchParams.get('repo')
  
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [sections, setSections] = useState<any>({})
  const [explanations, setExplanations] = useState<Record<string, { title: string; description: string; details: string[] }>>({})
  const [fileContents, setFileContents] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<Record<string, any>>({})
  const [error, setError] = useState<string | null>(null)
  const [githubRepoUrl, setGithubRepoUrl] = useState<string | null>(null)
  
  const handleExit = () => {
    router.push('/')
  }

  const fetchRepoData = async () => {
    if (!repoUrl) {
      setError('No repository URL provided')
      return
    }
    
    const parsedRepo = parseGitHubUrl(repoUrl)
    if (!parsedRepo) {
      setError('Invalid GitHub URL. Please use format: github.com/owner/repo')
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const { owner, repo, branch } = parsedRepo
      console.log(`Fetching repo: ${owner}/${repo} (branch: ${branch})`)
      
      // Store the GitHub URL for linking to files
      setGithubRepoUrl(`https://github.com/${owner}/${repo}`)
      
      const response = await fetch(
        `http://localhost:3002/process-repo?owner=${owner}&repo=${repo}&branch=${branch}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      const result = await response.json()
      
      if (response.ok && result.all) {
        console.log('API Response:', result)
        const { sections: processedSections, explanations: processedExplanations, fileContents: processedContents } = processRepoData(result.all)
        console.log('Processed sections:', processedSections)
        setSections(processedSections)
        setExplanations(processedExplanations)
        setFileContents(processedContents)
      } else {
        console.error('API Error:', result)
        setError(result.error || 'Failed to process repository')
      }
    } catch (error) {
      console.error('Error fetching repo data:', error)
      setError('Failed to connect to backend. Make sure the server is running.')
    } finally {
      setLoading(false)
    }
  }
  
  // Auto-fetch repo data when URL is present
  useEffect(() => {
    if (repoUrl) {
      fetchRepoData()
    }
  }, [repoUrl])

  const handleSectionClick = (section: string) => {
    setSelectedSection(section)
    setSelectedFile(null)
  }

  const handleFileClick = (fileId: string) => {
    setSelectedFile(fileId)
    // Clear analysis when switching to a different file
    if (fileId !== selectedFile) {
      setAnalysisResults(prev => {
        const newResults = { ...prev }
        delete newResults[fileId]
        return newResults
      })
    }
  }
  
  const handleClearAnalysis = () => {
    if (selectedFile) {
      setAnalysisResults(prev => {
        const newResults = { ...prev }
        delete newResults[selectedFile]
        return newResults
      })
    }
  }

  const handleAnalyzeFile = async (path: string, content: string) => {
    try {
      console.log('Analyzing file:', path)
      
      // Get the actual file content from our stored contents
      const actualContent = selectedFile ? fileContents[selectedFile] || content : content
      
      const response = await fetch('http://localhost:3002/process-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: path,
          content: actualContent
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        console.log('File analysis result:', result)
        // Store the analysis result for the current file
        if (selectedFile) {
          setAnalysisResults(prev => ({
            ...prev,
            [selectedFile]: result.data
          }))
        }
        return result.data
      } else {
        console.error('Analysis failed:', result)
        throw new Error(result.error || 'Analysis failed')
      }
    } catch (error) {
      console.error('Error analyzing file:', error)
      throw error
    }
  }

  const currentFiles = selectedSection ? sections[selectedSection]?.files || [] : []
  const currentExplanation = selectedFile ? explanations[selectedFile] : null

  if (loading) {
    return <LoadingAnimation message="Analyzing repository..." />
  }

  if (error) {
    return (
      <div className="relative flex h-screen w-full overflow-hidden bg-background items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-red-400 text-xl">Error</div>
          <div className="text-white/80 text-center max-w-md">{error}</div>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!sections || Object.keys(sections).length === 0) {
    return (
      <div className="relative flex h-screen w-full overflow-hidden bg-background items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-white text-xl">No repository data available</div>
          <button 
            onClick={fetchRepoData}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Fetch Repository Data
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background">
      <div className="absolute inset-0">
        <CodebaseStack onSectionClick={handleSectionClick} selectedSection={selectedSection} />
      </div>

      {/* Exit Button - Bottom Left */}
      <div className="pointer-events-none absolute bottom-8 left-8 z-50">
        <button
          onClick={handleExit}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500/20 to-gray-600/20 border border-gray-500/30 rounded-lg backdrop-blur-sm min-w-[80px]"
          style={{ transition: 'opacity 0.2s' }}
          title="Return to home"
        >
          <Home className="h-4 w-4 text-gray-300" />
          <span className="text-sm font-medium text-gray-300">Exit</span>
        </button>
      </div>

      {selectedSection && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-8">
          <div className="pointer-events-auto floating-card">
            <FileTree
              files={currentFiles}
              selectedFile={selectedFile}
              onFileClick={handleFileClick}
              sectionName={sections[selectedSection]?.name}
            />
          </div>
        </div>
      )}

      {currentExplanation && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-8">
          <div className="pointer-events-auto floating-card">
            <ExplanationPanel 
              explanation={currentExplanation} 
              onAnalyzeFile={handleAnalyzeFile}
              onClearAnalysis={handleClearAnalysis}
              filePath={currentExplanation.details[0]?.replace('Path: ', '')}
              analysisResult={selectedFile ? analysisResults[selectedFile] : null}
              repoUrl={githubRepoUrl || undefined}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Wrap in Suspense for Next.js 15 useSearchParams requirement
export default function CodebaseVisualizer() {
  return (
    <Suspense fallback={
      <div className="relative flex h-screen w-full overflow-hidden bg-background items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <CodebaseVisualizerContent />
    </Suspense>
  )
}

