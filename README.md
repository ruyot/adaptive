# Adaptive

A 3D codebase visualization platform that transforms repositories into interactive, visually organized stack systems. Adaptive automatically categorizes code files into Frontend, Backend, and Database layers using AI-powered classification.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Classification System](#classification-system)
- [Usage Guide](#usage-guide)
- [Development](#development)

## Overview

Adaptive revolutionizes code exploration by providing a visual, interactive 3D representation of any codebase. Instead of navigating through traditional file explorers, developers can see their code organized into three distinct layers:

- **Frontend Layer** (Blue): UI components, pages, styles, client-side code
- **Backend Layer** (Purple): API routes, services, middleware, server logic
- **Database Layer** (Pink): SQL files, schema definitions, migrations, ORM configs

Each file can be analyzed using Google Gemini AI to provide instant summaries and function descriptions.

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USER INPUT                          │
│                   (GitHub Repository URL)                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  Hero Card  │  │ 3D Visualizer│  │ Explanation Panel│    │
│  │   (Input)   │→ │   (Canvas)   │→ │   (AI Analysis)  │    │
│  └─────────────┘  └──────────────┘  └──────────────────┘    │
│          │              │  ▲                │               │
└──────────┼──────────────┼──┼────────────────┼───────────────┘
           │              │  │                │
           ▼              ▼  │                ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js)                      │
│                       Port: 3002                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                API Endpoints                        │    │
│  │  • GET  /process-repo    (Fetch & Classify)         │    │
│  │  • POST /process-file    (AI Analysis)              │    │
│  │  • GET  /healthtest      (Health Check)             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────┬────────────────────────┬──────────────────────┘
              │                        │
              ▼                        ▼
   ┌──────────────────┐    ┌─────────────────────┐
   │  GitHub Service  │    │  Classification     │
   │  (Fetch Files)   │    │     Engine          │
   └────────┬─────────┘    └──────────┬──────────┘
            │                         │
            ▼                         ▼
   ┌────────────────┐      ┌─────────────────────┐
   │  GitHub API    │      │  Multi-Classifier   │
   │  (Repository)  │      │  (Rule-based)       │
   └────────────────┘      └──────────┬──────────┘
                                      │
                         Confidence < 0.6?
                                      │
                                      ▼
                          ┌─────────────────────┐
                          │   Gemini AI         │
                          │   (Google AI)       │
                          └─────────────────────┘
```

### Data Flow

```
1. User enters GitHub URL
   │
   ├─→ Frontend sends request to /process-repo
       │
       ├─→ Backend fetches repository tree from GitHub API
           │
           ├─→ For each file:
               │
               ├─→ Filter by allowed extensions
               │   (.js, .ts, .py, .sql, etc.)
               │
               ├─→ Check if database extension
               │   (.sql, .prisma, .dbml)
               │   ├─→ YES: Classify as "database"
               │   └─→ NO: Continue to classifier
               │
               ├─→ Multi-Classifier analyzes:
               │   • File path patterns
               │   • Content samples
               │   • Framework signatures
               │   • Language detection
               │   │
               │   └─→ Calculate scores:
               │       • Frontend score
               │       • Backend score
               │       • Confidence level
               │
               ├─→ If confidence >= 0.6:
               │   └─→ Use multi-classifier result
               │
               └─→ If confidence < 0.6:
                   └─→ Send to Gemini AI for classification
   │
   └─→ Return categorized file structure to frontend

2. User clicks file
   │
   ├─→ Display file metadata
   │
   └─→ User clicks "Analyze" button
       │
       └─→ Send file content to /process-file
           │
           └─→ Gemini AI generates:
               • Summary (1-3 sentences)
               • Function descriptions
               │
               └─→ Display in explanation panel
```

## Features

### 3D Visualization
- Interactive WebGL-based 3D stack representation
- Smooth floating animations and particle effects
- Glass morphism and holographic UI elements
- Orbital camera controls with zoom and rotation

### Intelligent Classification
- Dual-layer classification system
- Rule-based multi-classifier with confidence scoring
- AI fallback using Google Gemini for ambiguous files
- Support for 40+ file extensions and frameworks

### AI-Powered Analysis
- Instant file summaries
- Function-by-function descriptions
- Context-aware explanations
- Retry logic for robust API handling

### Interactive File Explorer
- Hierarchical file tree with nested folders
- Collapsible directory structure
- Click-to-analyze functionality
- Real-time metadata display

## Technology Stack

### Frontend
- **Framework**: Next.js 15.2.4
- **UI Library**: React 19
- **Language**: TypeScript 5
- **3D Engine**: Three.js with React Three Fiber
- **3D Helpers**: @react-three/drei
- **Styling**: TailwindCSS 4.1.9
- **Components**: Radix UI
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 4.21.2
- **HTTP Client**: Axios 1.12.2
- **AI SDK**: @google/generative-ai 0.24.1
- **Environment**: dotenv 17.2.3

### External Services
- **Version Control**: GitHub API
- **AI Model**: Google Gemini (gemma-3-27b-it)

## Project Structure

```
adaptive/
│
├── client/                      # Frontend application
│   ├── app/                     # Next.js app router
│   │   ├── globals.css          # Global styles
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Landing page
│   │   └── visualizer/
│   │       └── page.tsx         # Main visualizer page
│   │
│   ├── components/              # React components
│   │   ├── codebase-stack.tsx   # 3D stack visualization
│   │   ├── file-tree.tsx        # File explorer component
│   │   ├── explanation-panel.tsx # AI analysis display
│   │   ├── hero-card.tsx        # Landing page card
│   │   ├── theme-provider.tsx   # Theme management
│   │   └── ui/                  # Radix UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── [40+ components]
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   │
│   ├── lib/                     # Utility functions
│   │   └── utils.ts
│   │
│   ├── public/                  # Static assets
│   │   └── [images]
│   │
│   ├── styles/                  # Additional styles
│   │   └── globals.css
│   │
│   ├── components.json          # Shadcn config
│   ├── next.config.mjs          # Next.js config
│   ├── package.json             # Frontend dependencies
│   ├── postcss.config.mjs       # PostCSS config
│   └── tsconfig.json            # TypeScript config
│
├── services/                    # Backend services
│   ├── github.js                # GitHub API integration
│   ├── multiclassifier.js       # Rule-based classifier
│   └── gemini.js                # AI analysis service
│
├── old/                         # Legacy Python scripts
│   ├── gemini.py
│   ├── getgithub.py
│   └── main.py
│
├── server.js                    # Express server entry point
├── package.json                 # Backend dependencies
└── README.md                    # This file
```

### Component Hierarchy

```
App
│
├── Landing Page (/)
│   └── HeroCard
│       └── CodebaseStack (background)
│
└── Visualizer (/visualizer)
    ├── CodebaseStack (interactive)
    │   ├── Canvas
    │   │   ├── StackLayer (Frontend)
    │   │   ├── StackLayer (Backend)
    │   │   ├── StackLayer (Database)
    │   │   ├── ParticleField
    │   │   └── OrbitControls
    │   └── Environment Lighting
    │
    ├── FileTree (left panel)
    │   └── FileTreeNode (recursive)
    │       ├── Folder
    │       └── File
    │
    └── ExplanationPanel (right panel)
        ├── File Metadata
        ├── Analyze Button
        └── AI Results Display
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- GitHub Personal Access Token
- Google Gemini API Key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd adaptive
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

4. Create environment file:
```bash
touch .env
```

5. Add the following environment variables to `.env`:
```env
# GitHub API Token
GITHUB_TOKEN=your_github_personal_access_token

# Google Gemini API Key
GOOGLE_KEY=your_google_gemini_api_key

# Optional: Model Configuration
GEMINI_MODEL=gemma-3-27b-it
GEMINI_MAX_CHARS=2000000000000
GEMINI_MAX_RETRIES=2
GEMINI_RETRY_DELAY_MS=500
```

### Getting API Keys

#### GitHub Personal Access Token
1. Go to GitHub Settings > Developer Settings > Personal Access Tokens
2. Generate new token (classic)
3. Select scope: `repo` (Full control of private repositories)
4. Copy token to `.env` file

#### Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy key to `.env` file

### Running the Application

1. Start the backend server:
```bash
npm run dev
```
Backend will run on `http://localhost:3002`

2. In a new terminal, start the frontend:
```bash
cd client
npm run dev
```
Frontend will run on `http://localhost:3000`

3. Open browser and navigate to `http://localhost:3000`

### Building for Production

Backend:
```bash
npm start
```

Frontend:
```bash
cd client
npm run build
npm start
```

## API Documentation

### Endpoints

#### Health Check
```http
GET /healthtest
```

Response:
```json
{
  "status": "healthy",
  "message": "Backend is running successfully",
  "timestamp": "2025-10-05T12:34:56.789Z"
}
```

#### Process Repository
```http
GET /process-repo
```

Description: Fetches and classifies all files from a GitHub repository.

Response:
```json
{
  "success": true,
  "message": "Repository processed successfully",
  "all": [
    {
      "type": "frontend",
      "path": "src/components/Button.tsx",
      "lines": "import React from 'react';\n..."
    },
    {
      "type": "backend",
      "path": "server/api/routes.js",
      "lines": "const express = require('express');\n..."
    }
  ]
}
```

#### Analyze File
```http
POST /process-file
Content-Type: application/json

{
  "path": "src/components/Button.tsx",
  "content": "file content here..."
}
```

Response:
```json
{
  "success": true,
  "message": "Returned file summary successfully",
  "summary": "A reusable button component with variant styles.",
  "functions": {
    "Button": "Renders a customizable button element with props",
    "getVariantClass": "Returns CSS class based on button variant"
  }
}
```

## Classification System

### Multi-Classifier Logic

The multi-classifier uses a scoring system to categorize files:

#### Frontend Indicators
- **Path Patterns**: `app/`, `pages/`, `components/`, `public/`, `styles/`, `assets/`, `static/`, `client/`, `ui/`
- **Frameworks**: React, Next.js, Vue, Svelte, Vite
- **Browser APIs**: `window`, `document`, `localStorage`, `navigator`
- **Libraries**: `@mui/`, `chakra-ui`, `tailwindcss`, `framer-motion`

#### Backend Indicators
- **Path Patterns**: `server/`, `api/`, `backend/`, `controllers/`, `routes/`, `services/`, `middleware/`, `handlers/`
- **Frameworks**: Express, Fastify, Koa, Django, FastAPI, Spring Boot, Gin
- **Node.js**: `require('dotenv')`, `process.env`, `fs.`, `path.`
- **Server Patterns**: `app.get()`, `router.post()`, `server.use()`

#### Database Indicators
- **Extensions**: `.sql`, `.prisma`, `.dbml`, `.ddl`, `.dump`
- **SQL Keywords**: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `CREATE TABLE`, `ALTER TABLE`
- **ORMs**: Prisma, Sequelize, TypeORM, Mongoose, SQLAlchemy, Hibernate

#### Confidence Calculation
```javascript
confidence = (topScore * 0.15) + (scoreGap * 0.20)
```

- **topScore**: Highest score between frontend/backend
- **scoreGap**: Absolute difference between scores
- **Range**: 0.0 to 1.0

If `confidence < 0.6`, the system falls back to Gemini AI for classification.

### Supported File Extensions

#### Code Files
`.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.py`, `.java`, `.c`, `.cc`, `.cpp`, `.cxx`, `.h`, `.hh`, `.hpp`, `.hxx`, `.cs`, `.go`, `.rs`, `.php`, `.rb`, `.swift`, `.kt`, `.kts`, `.m`, `.mm`, `.scala`, `.dart`, `.pl`, `.pm`, `.r`, `.jl`, `.lua`, `.sh`, `.bash`, `.zsh`

#### Markup & Styles
`.html`, `.htm`, `.css`, `.scss`, `.sass`, `.less`

#### Configuration
`.json`, `.yml`, `.yaml`, `.toml`, `.ini`, `.cfg`, `.env`

#### Database
`.sql`, `.prisma`, `.dbml`, `.ddl`, `.dump`

### Excluded Files
- Hidden files (starting with `.`)
- Files without extensions
- Config files: `webpack.config.js`, `next.config.js`, etc.
- Infrastructure: `Dockerfile`, `docker-compose.yml`

## Usage Guide

### Step-by-Step Walkthrough

1. **Launch Application**
   - Open browser to `http://localhost:3000`
   - See landing page with 3D background and hero card

2. **Enter Repository URL**
   - Input GitHub repository URL in the text field
   - Example: `https://github.com/username/repository`
   - Press Enter or click outside to proceed

3. **Navigate to Visualizer**
   - Click automatically redirects to `/visualizer`
   - Backend fetches and processes repository

4. **Interact with 3D Stack**
   - Use mouse to rotate camera (click and drag)
   - Scroll to zoom in/out
   - Hover over layers to see glow effects
   - Click on Frontend, Backend, or Database layer

5. **Browse File Tree**
   - File tree appears on left side after clicking layer
   - Click folders to expand/collapse
   - Click files to view details

6. **View File Details**
   - Explanation panel appears on right side
   - Shows file path, classification, and content preview
   - Click "Analyze" button for AI insights

7. **AI Analysis**
   - Gemini AI generates summary and function descriptions
   - Results appear in green-bordered box
   - View detailed function-by-function breakdown

### Keyboard Shortcuts

- **Escape**: Deselect current file/section
- **Mouse Wheel**: Zoom in/out on 3D stack
- **Click + Drag**: Rotate camera view

## Development

### Code Style

#### Frontend
- Use TypeScript for type safety
- Follow React hooks best practices
- Use `"use client"` directive for client components
- Prefer functional components over class components

#### Backend
- Use async/await for asynchronous operations
- Implement proper error handling with try/catch
- Add console logs for debugging classification decisions
- Follow RESTful API conventions

### Adding New File Type Support

1. Update `LANG_BY_EXT` in `services/multiclassifier.js`:
```javascript
const LANG_BY_EXT = {
  ".newext": "newlang",
  // ... existing extensions
};
```

2. Add framework hints if applicable:
```javascript
const HINTS = {
  newlang: /\b(framework1|framework2|library)\b/,
  // ... existing hints
};
```

3. Update allowed extensions in `services/github.js`:
```javascript
const allowedExtensions = new Set([
  ".newext",
  // ... existing extensions
]);
```

### Modifying Classification Rules

Edit scoring functions in `services/multiclassifier.js`:

```javascript
function scoreFrontend(p, lang, s) {
  let sc = 0;
  if (FRONTEND_DIRS.test(p)) sc += 2;
  if (YOUR_NEW_RULE.test(s)) sc += 1.5;
  // ... additional rules
  return sc;
}
```

### Customizing 3D Visuals

Edit `client/components/codebase-stack.tsx`:

```typescript
// Change colors
<StackLayer
  position={[0, 1.5, 0]}
  color="#your_hex_color"
  label="YOUR_LABEL"
  // ...
/>

// Adjust materials
<meshPhysicalMaterial
  metalness={0.5}      // Increase for shinier look
  roughness={0.1}      // Decrease for smoother surface
  transmission={0.2}   // Increase for glass effect
  emissiveIntensity={0.6}  // Increase for brighter glow
/>
```

### Testing

#### Backend Tests
```bash
# Test health endpoint
curl http://localhost:3002/healthtest

# Test repository processing
curl http://localhost:3002/process-repo

# Test file analysis
curl -X POST http://localhost:3002/process-file \
  -H "Content-Type: application/json" \
  -d '{"path":"test.js","content":"console.log(\"hello\");"}'
```

#### Frontend Tests
- Check console for API response logs
- Verify 3D rendering performance in DevTools
- Test file tree navigation and selections
- Validate AI analysis button functionality

### Performance Optimization

#### Backend
- Implement caching for repeated repository requests
- Add rate limiting for API endpoints
- Use streaming for large file processing
- Batch multiple file classifications

#### Frontend
- Lazy load file tree nodes for large repositories
- Implement virtual scrolling for long file lists
- Optimize Three.js scene with LOD (Level of Detail)
- Memoize expensive React components

## Troubleshooting

### Common Issues

**Backend fails to start:**
- Check if port 3002 is already in use
- Verify `.env` file exists with required keys
- Run `npm install` to ensure dependencies are installed

**GitHub API rate limit exceeded:**
- Use authenticated requests with GITHUB_TOKEN
- Implement caching to reduce API calls
- Wait for rate limit reset (check response headers)

**Gemini AI returns errors:**
- Verify GOOGLE_KEY is valid and active
- Check if model name is correct in `.env`
- Ensure file content is not exceeding token limits

**3D visualization not rendering:**
- Check browser WebGL support
- Clear browser cache and reload
- Update graphics drivers
- Test in different browser

**Classification seems incorrect:**
- Review file path patterns in multi-classifier
- Check confidence scores in console logs
- Adjust scoring weights in `multiclassifier.js`
- Force Gemini AI by lowering confidence threshold

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow
- Write clean, documented code
- Test thoroughly before submitting
- Follow existing code style
- Update README if adding new features

---

Built with passion for making programming simple and visual.

