"use client"

import { useState, useEffect } from "react"
import { FileTree } from "@/components/file-tree"
import { ExplanationPanel } from "@/components/explanation-panel"
import { CodebaseStack } from "@/components/codebase-stack"

// Helper function to create nested directory structure
function createFileTree(files: any[], type: string) {
  const tree: any = {}
  const explanations: Record<string, any> = {}
  
  files.forEach((item: any, index: number) => {
    const fileId = `${type}-${index}`
    const pathParts = item.path.split('/')
    
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
  
  return { tree, explanations }
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
  
  if (!data || !Array.isArray(data)) {
    console.error('Data is not an array:', data)
    return { sections, explanations }
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
      const { tree, explanations: typeExplanations } = createFileTree(filesByType[type], type)
      sections[type].files = treeToArray(tree)
      Object.assign(explanations, typeExplanations)
    }
  })
  
  console.log('Final sections:', sections)
  return { sections, explanations }
}

export default function CodebaseVisualizer() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [sections, setSections] = useState<any>({})
  const [explanations, setExplanations] = useState<Record<string, { title: string; description: string; details: string[] }>>({})
  const [loading, setLoading] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<Record<string, any>>({})

  const fetchRepoData = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3002/process-repo')
      const result = await response.json()
      
      if (response.ok && result.all) {
        console.log('API Response:', result)
        const { sections: processedSections, explanations: processedExplanations } = processRepoData(result.all)
        console.log('Processed sections:', processedSections)
        setSections(processedSections)
        setExplanations(processedExplanations)
      } else {
        console.error('API Error:', result)
      }
    } catch (error) {
      console.error('Error fetching repo data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSectionClick = (section: string) => {
    setSelectedSection(section)
    setSelectedFile(null)
  }

  const handleFileClick = (fileId: string) => {
    setSelectedFile(fileId)
  }

  const handleAnalyzeFile = async (path: string, content: string) => {
    try {
      console.log('Analyzing file:', path)
      
      const response = await fetch('http://localhost:3002/process-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: path,
          content: content
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
    return (
      <div className="relative flex h-screen w-full overflow-hidden bg-background items-center justify-center">
        <div className="text-white text-xl">Loading repository data...</div>
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
              filePath={currentExplanation.details[0]?.replace('Path: ', '')}
              analysisResult={selectedFile ? analysisResults[selectedFile] : null}
            />
          </div>
        </div>
      )}
    </div>
  )
}

