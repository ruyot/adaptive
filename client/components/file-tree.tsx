"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react"

interface FileNode {
  id: string
  name: string
  path: string
  type: "file" | "folder"
  children?: FileNode[]
}

interface FileTreeProps {
  files: FileNode[]
  selectedFile: string | null
  onFileClick: (fileId: string) => void
  sectionName: string
}

function FileTreeNode({
  node,
  selectedFile,
  onFileClick,
  level = 0,
}: {
  node: FileNode
  selectedFile: string | null
  onFileClick: (fileId: string) => void
  level?: number
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const isSelected = selectedFile === node.id

  const handleClick = () => {
    if (node.type === "folder") {
      setIsExpanded(!isExpanded)
    } else {
      onFileClick(node.id)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
          isSelected ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
        }`}
        style={{ paddingLeft: `${level * 16 + 16}px` }}
      >
        {node.type === "folder" && (
          <span className="flex-shrink-0">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
        )}
        {node.type === "folder" ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 flex-shrink-0" />
          )
        ) : (
          <File className="ml-6 h-4 w-4 flex-shrink-0" />
        )}
        <span className="truncate font-mono">{node.name}</span>
      </button>
      {node.type === "folder" && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              selectedFile={selectedFile}
              onFileClick={onFileClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileTree({ files, selectedFile, onFileClick, sectionName }: FileTreeProps) {
  return (
    <div className="flex h-[600px] w-[350px] flex-col overflow-hidden rounded-2xl">
      <div className="border-b border-white/10 px-6 py-5">
        <h2 className="font-mono text-base font-semibold text-white">{sectionName}</h2>
        <p className="mt-1.5 text-xs text-white/60">Select a file to view details</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {files.map((file) => (
          <FileTreeNode key={file.id} node={file} selectedFile={selectedFile} onFileClick={onFileClick} />
        ))}
      </div>
    </div>
  )
}
