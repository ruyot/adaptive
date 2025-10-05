"use client"

import { useState } from "react"
import { FileTree } from "@/components/file-tree"
import { ExplanationPanel } from "@/components/explanation-panel"
import { CodebaseStack } from "@/components/codebase-stack"

// Mock data - replace with your actual API calls
const mockSections = {
  frontend: {
    name: "Frontend",
    files: [
      { id: "1", name: "App.tsx", path: "src/App.tsx", type: "file" },
      {
        id: "2",
        name: "components",
        path: "src/components",
        type: "folder",
        children: [
          { id: "3", name: "Header.tsx", path: "src/components/Header.tsx", type: "file" },
          { id: "4", name: "Footer.tsx", path: "src/components/Footer.tsx", type: "file" },
        ],
      },
      {
        id: "5",
        name: "styles",
        path: "src/styles",
        type: "folder",
        children: [{ id: "6", name: "globals.css", path: "src/styles/globals.css", type: "file" }],
      },
    ],
  },
  backend: {
    name: "Backend",
    files: [
      { id: "7", name: "server.ts", path: "api/server.ts", type: "file" },
      {
        id: "8",
        name: "routes",
        path: "api/routes",
        type: "folder",
        children: [
          { id: "9", name: "users.ts", path: "api/routes/users.ts", type: "file" },
          { id: "10", name: "auth.ts", path: "api/routes/auth.ts", type: "file" },
        ],
      },
    ],
  },
  database: {
    name: "Database",
    files: [
      { id: "11", name: "schema.sql", path: "db/schema.sql", type: "file" },
      {
        id: "12",
        name: "migrations",
        path: "db/migrations",
        type: "folder",
        children: [{ id: "13", name: "001_initial.sql", path: "db/migrations/001_initial.sql", type: "file" }],
      },
    ],
  },
}

const mockExplanations: Record<string, { title: string; description: string; details: string[] }> = {
  "1": {
    title: "App.tsx",
    description: "Main application component that serves as the entry point for the React application.",
    details: [
      "Initializes the application routing",
      "Sets up global state management",
      "Configures theme and styling providers",
      "Handles top-level error boundaries",
    ],
  },
  "3": {
    title: "Header.tsx",
    description: "Navigation header component displayed across all pages.",
    details: [
      "Contains main navigation menu",
      "Implements responsive mobile menu",
      "Manages user authentication state",
      "Provides search functionality",
    ],
  },
  "7": {
    title: "server.ts",
    description: "Main server entry point that initializes the Express application.",
    details: [
      "Configures middleware and routes",
      "Sets up database connections",
      "Handles error logging",
      "Manages server lifecycle",
    ],
  },
  "11": {
    title: "schema.sql",
    description: "Database schema definition with table structures and relationships.",
    details: [
      "Defines user and authentication tables",
      "Sets up foreign key constraints",
      "Creates indexes for performance",
      "Establishes data validation rules",
    ],
  },
}

export default function CodebaseVisualizer() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const handleSectionClick = (section: string) => {
    setSelectedSection(section)
    setSelectedFile(null)
  }

  const handleFileClick = (fileId: string) => {
    setSelectedFile(fileId)
  }

  const currentFiles = selectedSection ? mockSections[selectedSection as keyof typeof mockSections]?.files : []
  const currentExplanation = selectedFile ? mockExplanations[selectedFile] : null

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
              sectionName={mockSections[selectedSection as keyof typeof mockSections]?.name}
            />
          </div>
        </div>
      )}

      {currentExplanation && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-8">
          <div className="pointer-events-auto floating-card">
            <ExplanationPanel explanation={currentExplanation} />
          </div>
        </div>
      )}
    </div>
  )
}
