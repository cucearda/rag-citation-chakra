# UI Revamp Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the four-panel layout with a Claude-chat-style conversation thread and a collapsible sidebar with nested file lists.

**Architecture:** A `ProjectContext` lifts document state so both `ProjectSidebar` (file list) and `ConversationView` (file upload) can share it without prop-drilling through React Router's `<Outlet>`. The conversation thread holds `messages` state locally. A Chakra `createSystem` extension provides design tokens.

**Tech Stack:** React 18, TypeScript, Chakra UI v3, React Router v6, Vite

---

## Task 1: Create Chakra theme extension

**Files:**
- Create: `src/theme/index.ts`
- Modify: `src/components/ui/provider.tsx`

**Step 1: Create `src/theme/index.ts`**

```ts
import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        canvas: { value: "#F7F7F5" },
        sidebar: { value: "#F0EFEB" },
        userBubble: { value: "#2F2F2F" },
        borderDefault: { value: "#E5E4DF" },
        textSecondary: { value: "#6B6B6B" },
      },
      fonts: {
        body: { value: `"Inter", system-ui, sans-serif` },
        heading: { value: `"Inter", system-ui, sans-serif` },
      },
      radii: {
        bubble: { value: "18px" },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
```

**Step 2: Update `src/components/ui/provider.tsx` to use custom system**

Replace `defaultSystem` import and usage:

```tsx
"use client"

import { ChakraProvider } from "@chakra-ui/react"
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode"
import { system } from "@/theme/index"

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}
```

**Step 3: Start dev server and verify app still loads**

```bash
npm run dev
```
Expected: App loads, no console errors, visual appearance unchanged.

**Step 4: Commit**

```bash
git add src/theme/index.ts src/components/ui/provider.tsx
git commit -m "feat: add Chakra theme extension with design tokens"
```

---

## Task 2: Create ProjectContext

**Files:**
- Create: `src/context/ProjectContext.tsx`

**Step 1: Create `src/context/ProjectContext.tsx`**

```tsx
import { createContext, useContext, useState, type ReactNode } from "react"
import { documents as initialDocuments, type Document } from "@/data/mockProjects"
import { useParams } from "react-router-dom"

interface ProjectContextValue {
  projectId: string
  documents: Document[]
  addDocument: (fileName: string) => void
  removeDocument: (id: number) => void
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { projectId = "" } = useParams<{ projectId: string }>()
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)

  const projectDocuments = documents.filter((d) => d.projectId === projectId)

  function addDocument(fileName: string) {
    const newDoc: Document = {
      id: Date.now(),
      projectId,
      fileName,
      title: "",
      authors: "",
      year: new Date().getFullYear(),
    }
    setDocuments((prev) => [...prev, newDoc])
  }

  function removeDocument(id: number) {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <ProjectContext.Provider
      value={{ projectId, documents: projectDocuments, addDocument, removeDocument }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error("useProjectContext must be used inside ProjectProvider")
  return ctx
}
```

**Step 2: Wrap `ProjectLayout` with `ProjectProvider`**

In `src/layouts/project-layout.tsx`:

```tsx
import { HStack, Box } from "@chakra-ui/react"
import { Outlet } from "react-router-dom"
import ProjectSidebar from "@/components/ui/ProjectSidebar"
import { ProjectProvider } from "@/context/ProjectContext"

export default function ProjectLayout() {
  return (
    <ProjectProvider>
      <HStack flex="1" minH="0" gap="0" alignItems="stretch">
        <ProjectSidebar />
        <Box flex="1" minH="0" display="flex" flexDirection="column">
          <Outlet />
        </Box>
      </HStack>
    </ProjectProvider>
  )
}
```

**Step 3: Verify dev server still loads with no errors**

**Step 4: Commit**

```bash
git add src/context/ProjectContext.tsx src/layouts/project-layout.tsx
git commit -m "feat: add ProjectContext for shared document state"
```

---

## Task 3: Update ProjectSidebar with nested file list

**Files:**
- Modify: `src/components/ui/ProjectSidebar.tsx`

**Step 1: Rewrite `ProjectSidebar.tsx`**

Replace the entire file contents:

```tsx
import { useState } from "react"
import {
  Box, VStack, Text, IconButton, Button, Input, HStack, Dialog, Portal, CloseButton,
} from "@chakra-ui/react"
import {
  LuChevronLeft, LuChevronRight, LuChevronDown, LuPlus, LuTrash2, LuFileText,
} from "react-icons/lu"
import { useNavigate } from "react-router-dom"
import { projects as initialProjects } from "@/data/mockProjects"
import type { Project } from "@/data/mockProjects"
import { useProjectContext } from "@/context/ProjectContext"

const EXPANDED_WIDTH = "220px"
const COLLAPSED_WIDTH = "48px"

export default function ProjectSidebar() {
  const navigate = useNavigate()
  const { projectId, documents, removeDocument } = useProjectContext()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set([projectId])
  )

  function toggleProjectFiles(id: string) {
    setExpandedProjects((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleCreate() {
    if (!newName.trim()) return
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    }).catch(() => null)
    const id = res?.ok ? (await res.json()).id : `proj-${Date.now()}`
    const created: Project = { id, name: newName.trim() }
    setProjects((prev) => [...prev, created])
    setNewName("")
    setCreating(false)
    navigate(`/projects/${id}`)
  }

  async function handleDelete(project: Project) {
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" }).catch(() => null)
    const remaining = projects.filter((p) => p.id !== project.id)
    setProjects(remaining)
    setDeleteTarget(null)
    if (projectId === project.id) {
      navigate(remaining.length > 0 ? `/projects/${remaining[0].id}` : "/")
    }
  }

  return (
    <>
      <Box
        w={sidebarOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH}
        minW={sidebarOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH}
        borderRight="1px solid"
        borderColor="borderDefault"
        display="flex"
        flexDirection="column"
        transition="width 0.2s, min-width 0.2s"
        overflow="hidden"
        bg="sidebar"
      >
        {/* Header */}
        <HStack
          px="2" py="3"
          justifyContent={sidebarOpen ? "space-between" : "center"}
          borderBottom="1px solid"
          borderColor="borderDefault"
        >
          {sidebarOpen && (
            <Text fontWeight="semibold" fontSize="sm" ml="1" color="fg">
              Projects
            </Text>
          )}
          <IconButton
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            variant="ghost" size="sm"
            onClick={() => setSidebarOpen((e) => !e)}
          >
            {sidebarOpen ? <LuChevronLeft /> : <LuChevronRight />}
          </IconButton>
        </HStack>

        {/* New project button */}
        <Box px="2" py="2" borderBottom="1px solid" borderColor="borderDefault">
          {sidebarOpen ? (
            creating ? (
              <VStack gap="1" align="stretch">
                <Input
                  size="sm" autoFocus placeholder="Project name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate()
                    if (e.key === "Escape") { setCreating(false); setNewName("") }
                  }}
                />
                <HStack gap="1">
                  <Button size="xs" colorPalette="orange" flex="1" onClick={handleCreate}>Create</Button>
                  <Button size="xs" variant="outline" flex="1" onClick={() => { setCreating(false); setNewName("") }}>Cancel</Button>
                </HStack>
              </VStack>
            ) : (
              <Button size="sm" variant="ghost" w="full" justifyContent="flex-start" onClick={() => setCreating(true)}>
                <LuPlus /> New Project
              </Button>
            )
          ) : (
            <IconButton
              aria-label="New project" variant="ghost" size="sm" w="full"
              onClick={() => { setSidebarOpen(true); setCreating(true) }}
            >
              <LuPlus />
            </IconButton>
          )}
        </Box>

        {/* Project list */}
        <VStack gap="0" align="stretch" flex="1" overflowY="auto" py="1">
          {projects.map((project) => {
            const isActive = project.id === projectId
            const isFilesOpen = expandedProjects.has(project.id)
            const projectDocs = documents.filter
              ? documents // already filtered to current project in context — need all docs here
              : []

            return (
              <Box key={project.id}>
                <HStack
                  px="2" py="1.5"
                  cursor="pointer"
                  bg={isActive ? "bg.subtle" : "transparent"}
                  borderRadius="md" mx="1" gap="1"
                  justifyContent={sidebarOpen ? "space-between" : "center"}
                  _hover={{ bg: "bg.subtle" }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  {sidebarOpen ? (
                    <>
                      <IconButton
                        aria-label="Toggle files"
                        variant="ghost" size="2xs"
                        onClick={(e) => { e.stopPropagation(); toggleProjectFiles(project.id) }}
                      >
                        {isFilesOpen ? <LuChevronDown /> : <LuChevronRight />}
                      </IconButton>
                      <Text fontSize="sm" fontWeight={isActive ? "semibold" : "normal"} flex="1" truncate>
                        {project.name}
                      </Text>
                      <IconButton
                        aria-label="Delete project" variant="ghost" size="2xs"
                        colorPalette="red" opacity="0"
                        _groupHover={{ opacity: 1 }}
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(project) }}
                      >
                        <LuTrash2 />
                      </IconButton>
                    </>
                  ) : (
                    <Box w="8px" h="8px" borderRadius="full" bg={isActive ? "orange.500" : "gray.300"} />
                  )}
                </HStack>

                {/* File list under project */}
                {sidebarOpen && isFilesOpen && isActive && (
                  <VStack gap="0" align="stretch" pl="6" pr="2" pb="1">
                    {documents.length === 0 && (
                      <Text fontSize="xs" color="textSecondary" px="2" py="1">No files yet</Text>
                    )}
                    {documents.map((doc) => (
                      <FileRow
                        key={doc.id}
                        fileName={doc.fileName}
                        onDelete={() => removeDocument(doc.id)}
                      />
                    ))}
                  </VStack>
                )}
              </Box>
            )
          })}
        </VStack>
      </Box>

      {/* Delete project dialog */}
      <Dialog.Root
        role="alertdialog"
        open={!!deleteTarget}
        onOpenChange={(e) => { if (!e.open) setDeleteTarget(null) }}
        size="sm"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header><Dialog.Title>Delete project?</Dialog.Title></Dialog.Header>
              <Dialog.Body>
                <Text>Delete "{deleteTarget?.name}"? This cannot be undone.</Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                </Dialog.ActionTrigger>
                <Button colorPalette="red" onClick={() => deleteTarget && handleDelete(deleteTarget)}>Delete</Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}

function FileRow({ fileName, onDelete }: { fileName: string; onDelete: () => void }) {
  return (
    <HStack
      px="2" py="1" borderRadius="md" gap="1.5"
      _hover={{ bg: "bg.subtle" }}
      role="group"
    >
      <LuFileText size={12} color="var(--chakra-colors-textSecondary)" />
      <Text fontSize="xs" flex="1" truncate color="fg.muted">{fileName}</Text>
      <IconButton
        aria-label="Delete file" variant="ghost" size="2xs"
        colorPalette="red" opacity="0" _groupHover={{ opacity: 1 }}
        onClick={onDelete}
      >
        <LuTrash2 />
      </IconButton>
    </HStack>
  )
}
```

**Step 2: Verify sidebar renders, project expand/collapse works, files list shows for active project**

```bash
npm run dev
```

**Step 3: Commit**

```bash
git add src/components/ui/ProjectSidebar.tsx
git commit -m "feat: update ProjectSidebar with nested file list per project"
```

---

## Task 4: Create CitationCard component

**Files:**
- Create: `src/components/ui/CitationCard.tsx`

**Step 1: Create `src/components/ui/CitationCard.tsx`**

```tsx
import { Box, Text, HStack } from "@chakra-ui/react"
import { LuFileText } from "react-icons/lu"
import type { Citation } from "@/data/mockProjects"

interface CitationCardProps {
  citation: Citation
}

export default function CitationCard({ citation }: CitationCardProps) {
  const { source, relevantQuote, reason } = citation

  return (
    <Box
      border="1px solid"
      borderColor="borderDefault"
      borderRadius="sm"
      px="3" py="2"
      bg="white"
    >
      <HStack gap="1.5" mb="1">
        <LuFileText size={12} color="var(--chakra-colors-textSecondary)" />
        <Text fontSize="xs" color="textSecondary" fontWeight="medium">
          {source.title || source.fileName} · {source.year} · {source.authors}
        </Text>
      </HStack>
      <Text fontSize="sm" fontStyle="italic" color="fg" mb="1">
        "{relevantQuote}"
      </Text>
      <Text fontSize="xs" color="textSecondary">{reason}</Text>
    </Box>
  )
}
```

**Step 2: Verify component file is created with no TypeScript errors**

```bash
npx tsc --noEmit
```
Expected: no errors

**Step 3: Commit**

```bash
git add src/components/ui/CitationCard.tsx
git commit -m "feat: add CitationCard component"
```

---

## Task 5: Create ChatInputBar component

**Files:**
- Create: `src/components/ui/ChatInputBar.tsx`

**Step 1: Create `src/components/ui/ChatInputBar.tsx`**

```tsx
import { useRef, useState } from "react"
import { Box, Textarea, IconButton, HStack } from "@chakra-ui/react"
import { LuPaperclip, LuArrowUp } from "react-icons/lu"
import { useProjectContext } from "@/context/ProjectContext"

interface ChatInputBarProps {
  onSubmit: (text: string) => void
}

export default function ChatInputBar({ onSubmit }: ChatInputBarProps) {
  const [text, setText] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addDocument } = useProjectContext()

  function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setText("")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    files.forEach((f) => addDocument(f.name))
    e.target.value = ""
  }

  return (
    <Box
      borderTop="1px solid"
      borderColor="borderDefault"
      px="4" py="3"
      bg="canvas"
    >
      <Box
        border="1px solid"
        borderColor="borderDefault"
        borderRadius="md"
        bg="white"
        display="flex"
        alignItems="flex-end"
        gap="1"
        px="2" py="1.5"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <IconButton
          aria-label="Attach file"
          variant="ghost" size="sm"
          color="textSecondary"
          onClick={() => fileInputRef.current?.click()}
        >
          <LuPaperclip />
        </IconButton>
        <Textarea
          placeholder="Reply..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          size="sm"
          border="none"
          outline="none"
          resize="none"
          minH="36px"
          maxH="120px"
          flex="1"
          p="0"
          fontSize="sm"
          _focus={{ boxShadow: "none" }}
        />
        <IconButton
          aria-label="Send"
          size="sm"
          borderRadius="full"
          disabled={!text.trim()}
          colorPalette={text.trim() ? "orange" : "gray"}
          variant={text.trim() ? "solid" : "ghost"}
          onClick={handleSubmit}
        >
          <LuArrowUp />
        </IconButton>
      </Box>
    </Box>
  )
}
```

**Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/ui/ChatInputBar.tsx
git commit -m "feat: add ChatInputBar component"
```

---

## Task 6: Create ConversationView component

**Files:**
- Create: `src/components/ui/ConversationView.tsx`

**Step 1: Create `src/components/ui/ConversationView.tsx`**

```tsx
import { useRef, useEffect, useState } from "react"
import { Box, Text, VStack } from "@chakra-ui/react"
import { useParams } from "react-router-dom"
import { projects, citations } from "@/data/mockProjects"
import type { Citation } from "@/data/mockProjects"
import CitationCard from "./CitationCard"
import ChatInputBar from "./ChatInputBar"

interface UserMessage {
  role: "user"
  content: string
}

interface AiMessage {
  role: "ai"
  content: string
  citations: Citation[]
}

type Message = UserMessage | AiMessage

const MOCK_AI_RESPONSE = "Here is your paragraph with citations applied based on the uploaded documents."

export default function ConversationView() {
  const { projectId = "" } = useParams<{ projectId: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  const project = projects.find((p) => p.id === projectId)
  const projectCitations = citations.filter((c) => c.projectId === projectId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleSubmit(text: string) {
    const userMsg: UserMessage = { role: "user", content: text }
    const aiMsg: AiMessage = {
      role: "ai",
      content: MOCK_AI_RESPONSE,
      citations: projectCitations,
    }
    setMessages((prev) => [...prev, userMsg, aiMsg])
  }

  return (
    <Box display="flex" flexDirection="column" flex="1" minH="0" bg="canvas">
      {/* Scroll area */}
      <Box flex="1" overflowY="auto" px="6" py="4">
        {messages.length === 0 ? (
          <Box
            display="flex" flexDirection="column" alignItems="center"
            justifyContent="center" h="full" gap="2"
          >
            <Text fontSize="xl" fontWeight="semibold" color="fg">
              {project?.name ?? "Project"}
            </Text>
            <Text fontSize="sm" color="textSecondary">
              Submit a paragraph to get cited results
            </Text>
          </Box>
        ) : (
          <VStack gap="6" align="stretch" maxW="760px" mx="auto">
            {messages.map((msg, i) => (
              <Box key={i}>
                {msg.role === "user" ? (
                  <Box display="flex" justifyContent="flex-end">
                    <Box
                      bg="userBubble"
                      color="white"
                      px="4" py="2.5"
                      borderRadius="bubble"
                      maxW="70%"
                      fontSize="sm"
                      lineHeight="1.6"
                      whiteSpace="pre-wrap"
                    >
                      {msg.content}
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Text fontSize="sm" lineHeight="1.6" color="fg" mb="3">
                      {msg.content}
                    </Text>
                    {msg.citations.length > 0 && (
                      <VStack gap="2" align="stretch">
                        {msg.citations.map((c) => (
                          <CitationCard key={c.id} citation={c} />
                        ))}
                      </VStack>
                    )}
                  </Box>
                )}
              </Box>
            ))}
            <div ref={bottomRef} />
          </VStack>
        )}
      </Box>

      {/* Input bar */}
      <ChatInputBar onSubmit={handleSubmit} />
    </Box>
  )
}
```

**Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/ui/ConversationView.tsx
git commit -m "feat: add ConversationView with message thread and ChatInputBar"
```

---

## Task 7: Wire ConversationView into routing, delete old components

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/components/ui/CompleteWorkstation.tsx`
- Delete: `src/components/ui/WorkPanel.tsx`
- Delete: `src/components/ui/ResultsPanel.tsx`
- Delete: `src/components/ui/ParagraphField.tsx`
- Delete: `src/components/ui/ResultTextField.tsx`
- Delete: `src/components/ui/CitationTable.tsx`
- Delete: `src/components/ui/UploadedDocumentsTable.tsx`

**Step 1: Update `src/App.tsx`**

```tsx
import './App.css'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import RootLayout from './layouts/root-layout'
import ProjectLayout from './layouts/project-layout'
import LoginLayout from './layouts/login-layout'
import SignupLayout from './layouts/signup-layout'
import ConversationView from './components/ui/ConversationView'
import { projects } from './data/mockProjects'

const router = createBrowserRouter([
  { path: '/login', element: <LoginLayout /> },
  { path: '/signup', element: <SignupLayout /> },
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: projects.length > 0
          ? <Navigate to={`/projects/${projects[0].id}`} replace />
          : <Navigate to="/projects/empty" replace />,
      },
      {
        path: 'projects/:projectId',
        element: <ProjectLayout />,
        children: [{ index: true, element: <ConversationView /> }],
      },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
```

**Step 2: Delete old component files**

```bash
rm src/components/ui/CompleteWorkstation.tsx \
   src/components/ui/WorkPanel.tsx \
   src/components/ui/ResultsPanel.tsx \
   src/components/ui/ParagraphField.tsx \
   src/components/ui/ResultTextField.tsx \
   src/components/ui/CitationTable.tsx \
   src/components/ui/UploadedDocumentsTable.tsx
```

**Step 3: Verify no TypeScript errors and dev server loads**

```bash
npx tsc --noEmit
npm run dev
```
Expected: App loads, sidebar shows, chat area shows empty state, submitting a paragraph adds messages.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: wire ConversationView into routing, remove old panel components"
```

---

## Task 8: Fix ProjectContext documents scope for sidebar

**Context:** `ProjectContext` currently filters documents to `projectId`, but `ProjectSidebar` needs all documents (to show files under *any* project, not just the active one). This task fixes the sidebar's file list to show the correct files per project.

**Files:**
- Modify: `src/context/ProjectContext.tsx`
- Modify: `src/components/ui/ProjectSidebar.tsx`

**Step 1: Expose `allDocuments` from context**

In `src/context/ProjectContext.tsx`, add `allDocuments` to the context value:

```tsx
interface ProjectContextValue {
  projectId: string
  documents: Document[]        // filtered to current project
  allDocuments: Document[]     // unfiltered
  addDocument: (fileName: string) => void
  removeDocument: (id: number) => void
}

// In provider:
value={{ projectId, documents: projectDocuments, allDocuments: documents, addDocument, removeDocument }}
```

**Step 2: Update `ProjectSidebar` to use `allDocuments` for per-project file display**

Replace the line in the sidebar that references `documents` for each project row:

```tsx
const { projectId, documents, allDocuments, removeDocument } = useProjectContext()

// In the map over projects:
const projectDocs = allDocuments.filter((d) => d.projectId === project.id)

// In the file list render:
{projectDocs.length === 0 && (
  <Text fontSize="xs" color="textSecondary" px="2" py="1">No files yet</Text>
)}
{projectDocs.map((doc) => (
  <FileRow key={doc.id} fileName={doc.fileName} onDelete={() => removeDocument(doc.id)} />
))}
```

**Step 3: Verify files appear under the correct projects**

```bash
npm run dev
```
Expected: Expanding "Research 2024" shows xfd.pdf and hello.pdf; expanding "Market Analysis" shows zuko.pdf and markets.pdf.

**Step 4: Commit**

```bash
git add src/context/ProjectContext.tsx src/components/ui/ProjectSidebar.tsx
git commit -m "fix: expose allDocuments from context, show correct files per project in sidebar"
```

---

## Verification Checklist

After all tasks:
- [ ] Sidebar collapses/expands (chevron toggle)
- [ ] Each project row expands/collapses its file list independently
- [ ] Files show filename only + hover-reveal delete button
- [ ] Uploading a file via input bar adds it to the current project's sidebar list
- [ ] Submitting text creates a user bubble (right, dark) + AI response (left, no bubble) + citation cards
- [ ] Enter submits, Shift+Enter adds newline
- [ ] Send button is gray/disabled when input is empty, orange when has text
- [ ] Empty state shows project name + subtitle when no messages
- [ ] New project creation still works
- [ ] Delete project confirmation dialog still works
- [ ] No TypeScript errors (`npx tsc --noEmit`)
