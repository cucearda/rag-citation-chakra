# Backend Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all mock data with real API calls to the RAG Citation backend (projects, documents, citations).

**Architecture:** Plain fetch in hooks — `apiClient.ts` injects auth token + base URL, service files call it, hooks own React state, components call hooks only.

**Tech Stack:** React 19, TypeScript, Vite, Firebase Auth, Chakra UI v3

---

### Task 1: Env files + apiClient

**Files:**
- Create: `.env.local`
- Create: `.env.production`
- Create: `src/lib/apiClient.ts`

**Step 1: Create `.env.local`**

```
VITE_API_URL=http://localhost:8000
```

Do NOT commit this file. Verify `.gitignore` already ignores `.env.local` (Vite projects do by default).

**Step 2: Create `.env.production`**

```
VITE_API_URL=https://<your-railway-domain>.up.railway.app
```

Replace the placeholder with the real Railway URL when known. This file IS committed.

**Step 3: Create `src/lib/apiClient.ts`**

```ts
import { getAuth } from "firebase/auth"

const BASE_URL = import.meta.env.VITE_API_URL
if (!BASE_URL) throw new Error("VITE_API_URL is not set")

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const user = getAuth().currentUser
  const token = user ? await user.getIdToken() : null

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    window.location.href = "/login"
    throw new Error("Unauthorized")
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail ?? "Request failed")
  }

  return res
}
```

Note: FormData (file upload) must not set `Content-Type` — the browser sets it with the boundary automatically.

**Step 4: Verify**

Run `npm run build`. It should compile without errors. If `VITE_API_URL` is not set in the build environment, the throw will surface during startup — that's correct behaviour.

**Step 5: Commit**

```bash
git add src/lib/apiClient.ts .env.production
git commit -m "feat: add apiClient with auth token injection"
```

---

### Task 2: API types

**Files:**
- Create: `src/types/api.ts`

**Step 1: Create `src/types/api.ts`**

These types mirror the exact shapes returned by the backend.

```ts
export interface ApiProject {
  id: string
  name: string
  namespace: string
  created_at: string
}

export interface ApiDocument {
  id: string
  filename: string
  chunks_indexed: number
  authors?: string
  year?: string
  created_at: string
}

export interface ApiUploadedDocument {
  id: string
  filename: string
  chunks_indexed: number
}

export interface ApiCitationSource {
  paper_title: string
  authors: string
  year: string
  section_title: string
  section_number: string | null
  pages: string | null
}

export interface ApiCitation {
  start: number
  end: number
  citation_format: string
  reason: string
  relevant_quote: string
  relevance_explanation: string
  source: ApiCitationSource
}

export interface ApiCitationResponse {
  cited_paragraph: string
  citations: ApiCitation[]
}
```

**Step 2: Commit**

```bash
git add src/types/api.ts
git commit -m "feat: add API response types"
```

---

### Task 3: projectService + useProjects

**Files:**
- Create: `src/services/projectService.ts`
- Create: `src/hooks/useProjects.ts`

**Step 1: Create `src/services/projectService.ts`**

```ts
import { apiFetch } from "@/lib/apiClient"
import type { ApiProject } from "@/types/api"

export async function listProjects(): Promise<ApiProject[]> {
  const res = await apiFetch("/projects")
  return res.json()
}

export async function createProject(name: string): Promise<ApiProject> {
  const res = await apiFetch("/projects", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
  return res.json()
}

export async function deleteProject(projectId: string): Promise<void> {
  await apiFetch(`/projects/${projectId}`, { method: "DELETE" })
}
```

**Step 2: Create `src/hooks/useProjects.ts`**

```ts
import { useState, useEffect, useCallback } from "react"
import { listProjects, createProject, deleteProject } from "@/services/projectService"
import type { ApiProject } from "@/types/api"

export function useProjects() {
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listProjects()
      setProjects(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchProjects() }, [fetchProjects])

  async function create(name: string): Promise<ApiProject> {
    const project = await createProject(name)
    setProjects((prev) => [...prev, project])
    return project
  }

  async function remove(projectId: string): Promise<void> {
    await deleteProject(projectId)
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
  }

  return { projects, loading, error, create, remove, refetch: fetchProjects }
}
```

**Step 3: Commit**

```bash
git add src/services/projectService.ts src/hooks/useProjects.ts
git commit -m "feat: add projectService and useProjects hook"
```

---

### Task 4: documentService + useDocuments

**Files:**
- Create: `src/services/documentService.ts`
- Create: `src/hooks/useDocuments.ts`

**Step 1: Create `src/services/documentService.ts`**

```ts
import { apiFetch } from "@/lib/apiClient"
import type { ApiDocument, ApiUploadedDocument } from "@/types/api"

export async function listDocuments(projectId: string): Promise<ApiDocument[]> {
  const res = await apiFetch(`/projects/${projectId}/documents`)
  return res.json()
}

export async function uploadDocument(projectId: string, file: File): Promise<ApiUploadedDocument> {
  const form = new FormData()
  form.append("file", file)
  const res = await apiFetch(`/projects/${projectId}/documents`, {
    method: "POST",
    body: form,
  })
  return res.json()
}

export async function deleteDocument(projectId: string, documentId: string): Promise<void> {
  await apiFetch(`/projects/${projectId}/documents/${documentId}`, { method: "DELETE" })
}
```

**Step 2: Create `src/hooks/useDocuments.ts`**

```ts
import { useState, useEffect, useCallback } from "react"
import { listDocuments, uploadDocument, deleteDocument } from "@/services/documentService"
import type { ApiDocument } from "@/types/api"

export function useDocuments(projectId: string) {
  const [documents, setDocuments] = useState<ApiDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    if (!projectId) return
    try {
      setLoading(true)
      setError(null)
      const data = await listDocuments(projectId)
      setDocuments(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents")
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { void fetchDocuments() }, [fetchDocuments])

  async function upload(file: File): Promise<void> {
    try {
      setUploading(true)
      setError(null)
      const uploaded = await uploadDocument(projectId, file)
      // Append a normalised ApiDocument shape from the upload response
      const newDoc: ApiDocument = {
        id: uploaded.id,
        filename: uploaded.filename,
        chunks_indexed: uploaded.chunks_indexed,
        created_at: new Date().toISOString(),
      }
      setDocuments((prev) => [...prev, newDoc])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function remove(documentId: string): Promise<void> {
    await deleteDocument(projectId, documentId)
    setDocuments((prev) => prev.filter((d) => d.id !== documentId))
  }

  return { documents, loading, uploading, error, upload, remove, refetch: fetchDocuments }
}
```

**Step 3: Commit**

```bash
git add src/services/documentService.ts src/hooks/useDocuments.ts
git commit -m "feat: add documentService and useDocuments hook"
```

---

### Task 5: citationService + useCitations

**Files:**
- Create: `src/services/citationService.ts`
- Create: `src/hooks/useCitations.ts`

**Step 1: Create `src/services/citationService.ts`**

```ts
import { apiFetch } from "@/lib/apiClient"
import type { ApiCitationResponse } from "@/types/api"

export async function getCitations(
  projectId: string,
  paragraph: string
): Promise<ApiCitationResponse> {
  const res = await apiFetch(`/projects/${projectId}/citations`, {
    method: "POST",
    body: JSON.stringify({ paragraph }),
  })
  return res.json()
}
```

**Step 2: Create `src/hooks/useCitations.ts`**

```ts
import { useState } from "react"
import { getCitations } from "@/services/citationService"
import type { ApiCitationResponse } from "@/types/api"

export function useCitations(projectId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchCitations(paragraph: string): Promise<ApiCitationResponse | null> {
    try {
      setLoading(true)
      setError(null)
      return await getCitations(projectId, paragraph)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Citation request failed")
      return null
    } finally {
      setLoading(false)
    }
  }

  return { fetchCitations, loading, error }
}
```

**Step 3: Commit**

```bash
git add src/services/citationService.ts src/hooks/useCitations.ts
git commit -m "feat: add citationService and useCitations hook"
```

---

### Task 6: Update ProjectContext

Replace mock state with the real `useProjects` hook. Documents are now fetched per-project in the sidebar directly, so remove document state from context.

**Files:**
- Modify: `src/context/ProjectContext.tsx`

**Step 1: Rewrite `src/context/ProjectContext.tsx`**

```tsx
import { createContext, useContext, type ReactNode } from "react"
import { useParams } from "react-router-dom"
import { useProjects } from "@/hooks/useProjects"
import type { ApiProject } from "@/types/api"

interface ProjectContextValue {
  projectId: string
  projects: ApiProject[]
  projectsLoading: boolean
  projectsError: string | null
  createProject: (name: string) => Promise<ApiProject>
  removeProject: (id: string) => Promise<void>
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { projectId = "" } = useParams<{ projectId: string }>()
  const { projects, loading, error, create, remove } = useProjects()

  return (
    <ProjectContext.Provider value={{
      projectId,
      projects,
      projectsLoading: loading,
      projectsError: error,
      createProject: create,
      removeProject: remove,
    }}>
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

**Step 2: Commit**

```bash
git add src/context/ProjectContext.tsx
git commit -m "feat: wire ProjectContext to real API via useProjects"
```

---

### Task 7: Update CitationCard

Rework to use `ApiCitation` shape from the real backend. Remove all references to `@/data/mockProjects`.

**Files:**
- Modify: `src/components/ui/CitationCard.tsx`

**Step 1: Rewrite `src/components/ui/CitationCard.tsx`**

```tsx
import { Box, Text, HStack } from "@chakra-ui/react"
import { LuFileText } from "react-icons/lu"
import type { ApiCitation } from "@/types/api"

interface CitationCardProps {
  citation: ApiCitation
}

export default function CitationCard({ citation }: CitationCardProps) {
  const { source, relevant_quote, reason, citation_format, relevance_explanation } = citation

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
          {source.paper_title} · {source.year} · {source.authors}
        </Text>
      </HStack>
      <Text fontSize="xs" color="textSecondary" fontStyle="italic" mb="1">
        {citation_format}
      </Text>
      <Text fontSize="sm" fontStyle="italic" color="fg" mb="1">
        "{relevant_quote}"
      </Text>
      <Text fontSize="xs" color="textSecondary" mb="1">{relevance_explanation}</Text>
      <Text fontSize="xs" color="textSecondary" opacity={0.7}>{reason}</Text>
    </Box>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/ui/CitationCard.tsx
git commit -m "feat: rework CitationCard to real API shape"
```

---

### Task 8: Update ConversationView

Replace mock response with `useCitations`. The AI message text becomes `cited_paragraph`. Citation cards use `ApiCitation[]`.

**Files:**
- Modify: `src/components/ui/ConversationView.tsx`

**Step 1: Rewrite `src/components/ui/ConversationView.tsx`**

```tsx
import { useRef, useEffect, useState } from "react"
import { Box, Text, VStack } from "@chakra-ui/react"
import { useParams } from "react-router-dom"
import type { ApiCitation } from "@/types/api"
import { useProjectContext } from "@/context/ProjectContext"
import { useCitations } from "@/hooks/useCitations"
import CitationCard from "./CitationCard"
import ChatInputBar from "./ChatInputBar"

interface UserMessage {
  role: "user"
  content: string
}

interface AiMessage {
  role: "ai"
  content: string
  citations: ApiCitation[]
}

interface ErrorMessage {
  role: "error"
  content: string
}

type Message = UserMessage | AiMessage | ErrorMessage

export default function ConversationView() {
  const { projectId = "" } = useParams<{ projectId: string }>()
  const { projects } = useProjectContext()
  const { fetchCitations, loading } = useCitations(projectId)
  const [messages, setMessages] = useState<Message[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  const project = projects.find((p) => p.id === projectId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSubmit(text: string) {
    const userMsg: UserMessage = { role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])

    const result = await fetchCitations(text)
    if (result) {
      const aiMsg: AiMessage = {
        role: "ai",
        content: result.cited_paragraph,
        citations: result.citations,
      }
      setMessages((prev) => [...prev, aiMsg])
    } else {
      const errMsg: ErrorMessage = {
        role: "error",
        content: "Failed to get citations. Please try again.",
      }
      setMessages((prev) => [...prev, errMsg])
    }
  }

  return (
    <Box display="flex" flexDirection="column" flex="1" minH="0" bg="canvas">
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
                {msg.role === "user" && (
                  <Box display="flex" justifyContent="flex-end">
                    <Box
                      bg="userBubble" color="white"
                      px="4" py="2.5" borderRadius="bubble"
                      maxW="70%" fontSize="sm" lineHeight="1.6" whiteSpace="pre-wrap"
                    >
                      {msg.content}
                    </Box>
                  </Box>
                )}
                {msg.role === "ai" && (
                  <Box>
                    <Text fontSize="sm" lineHeight="1.6" color="fg" mb="3">
                      {msg.content}
                    </Text>
                    {msg.citations.length > 0 && (
                      <VStack gap="2" align="stretch">
                        {msg.citations.map((c, ci) => (
                          <CitationCard key={ci} citation={c} />
                        ))}
                      </VStack>
                    )}
                  </Box>
                )}
                {msg.role === "error" && (
                  <Box>
                    <Text fontSize="sm" color="red.500">{msg.content}</Text>
                  </Box>
                )}
              </Box>
            ))}
            <div ref={bottomRef} />
          </VStack>
        )}
      </Box>
      <ChatInputBar onSubmit={handleSubmit} disabled={loading} />
    </Box>
  )
}
```

Note: `ChatInputBar` needs a `disabled` prop. Check its current signature — if it doesn't accept `disabled`, add it in the next step.

**Step 2: Check ChatInputBar for `disabled` prop**

Read `src/components/ui/ChatInputBar.tsx`. If it doesn't have a `disabled` prop, add one:

```tsx
// In ChatInputBar props interface, add:
disabled?: boolean

// On the submit button, add:
disabled={disabled || !value.trim()}
```

**Step 3: Commit**

```bash
git add src/components/ui/ConversationView.tsx src/components/ui/ChatInputBar.tsx
git commit -m "feat: wire ConversationView to real citations API"
```

---

### Task 9: Update ProjectSidebar

Replace the partial ad-hoc fetch calls with `useProjectContext` (for projects) and `useDocuments` (for docs). Add a file picker for uploads.

**Files:**
- Modify: `src/components/ui/ProjectSidebar.tsx`

**Step 1: Rewrite `src/components/ui/ProjectSidebar.tsx`**

```tsx
import { useEffect, useRef, useState } from "react"
import {
  Box, VStack, Text, IconButton, Button, Input, HStack, Dialog, Portal, CloseButton, Spinner,
} from "@chakra-ui/react"
import {
  LuChevronLeft, LuChevronRight, LuChevronDown, LuPlus, LuTrash2, LuFileText, LuUpload,
} from "react-icons/lu"
import { useNavigate } from "react-router-dom"
import { useProjectContext } from "@/context/ProjectContext"
import { useDocuments } from "@/hooks/useDocuments"
import type { ApiProject } from "@/types/api"

const EXPANDED_WIDTH = "220px"
const COLLAPSED_WIDTH = "48px"

export default function ProjectSidebar() {
  const navigate = useNavigate()
  const { projectId, projects, projectsLoading, createProject, removeProject } = useProjectContext()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<ApiProject | null>(null)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set([projectId]))

  useEffect(() => {
    setExpandedProjects((prev) => new Set([...prev, projectId]))
  }, [projectId])

  function toggleProjectFiles(id: string) {
    setExpandedProjects((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleCreate() {
    if (!newName.trim()) return
    const project = await createProject(newName.trim())
    setNewName("")
    setCreating(false)
    navigate(`/projects/${project.id}`)
  }

  async function handleDelete(project: ApiProject) {
    await removeProject(project.id)
    setDeleteTarget(null)
    if (projectId === project.id) {
      const remaining = projects.filter((p) => p.id !== project.id)
      navigate(remaining.length > 0 ? `/projects/${remaining[0].id}` : "/")
    }
  }

  return (
    <>
      <Box
        w={sidebarOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH}
        minW={sidebarOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH}
        borderRight="1px solid" borderColor="borderDefault"
        display="flex" flexDirection="column"
        transition="width 0.2s, min-width 0.2s"
        overflow="hidden" bg="sidebar"
      >
        {/* Header */}
        <HStack
          px="2" py="3"
          justifyContent={sidebarOpen ? "space-between" : "center"}
          borderBottom="1px solid" borderColor="borderDefault"
        >
          {sidebarOpen && (
            <Text fontWeight="semibold" fontSize="sm" ml="1" color="fg">Projects</Text>
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
                    if (e.key === "Enter") void handleCreate()
                    if (e.key === "Escape") { setCreating(false); setNewName("") }
                  }}
                />
                <HStack gap="1">
                  <Button size="xs" colorPalette="orange" flex="1" onClick={() => void handleCreate()}>Create</Button>
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
          {projectsLoading && (
            <Box display="flex" justifyContent="center" py="4">
              <Spinner size="sm" />
            </Box>
          )}
          {projects.map((project) => {
            const isActive = project.id === projectId
            const isFilesOpen = expandedProjects.has(project.id)

            return (
              <Box key={project.id}>
                <HStack
                  px="2" py="1.5" cursor="pointer"
                  bg={isActive ? "bg.subtle" : "transparent"}
                  borderRadius="md" mx="1" gap="1"
                  justifyContent={sidebarOpen ? "space-between" : "center"}
                  _hover={{ bg: "bg.subtle" }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  {sidebarOpen ? (
                    <>
                      <IconButton
                        aria-label="Toggle files" variant="ghost" size="2xs"
                        onClick={(e) => { e.stopPropagation(); toggleProjectFiles(project.id) }}
                      >
                        {isFilesOpen ? <LuChevronDown /> : <LuChevronRight />}
                      </IconButton>
                      <Text fontSize="sm" fontWeight={isActive ? "semibold" : "normal"} flex="1" truncate>
                        {project.name}
                      </Text>
                      <IconButton
                        aria-label="Delete project" variant="ghost" size="2xs" colorPalette="red"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(project) }}
                      >
                        <LuTrash2 />
                      </IconButton>
                    </>
                  ) : (
                    <Box w="8px" h="8px" borderRadius="full" bg={isActive ? "orange.500" : "gray.300"} />
                  )}
                </HStack>

                {sidebarOpen && isFilesOpen && (
                  <DocumentList projectId={project.id} />
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
                <Button colorPalette="red" onClick={() => deleteTarget && void handleDelete(deleteTarget)}>Delete</Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}

function DocumentList({ projectId }: { projectId: string }) {
  const { documents, loading, uploading, error, upload, remove } = useDocuments(projectId)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void upload(file)
    e.target.value = ""
  }

  return (
    <VStack gap="0" align="stretch" pl="6" pr="2" pb="1">
      {loading && <Spinner size="xs" alignSelf="center" my="1" />}
      {error && <Text fontSize="xs" color="red.500" px="2" py="1">{error}</Text>}
      {!loading && documents.length === 0 && (
        <Text fontSize="xs" color="textSecondary" px="2" py="1">No files yet</Text>
      )}
      {documents.map((doc) => (
        <HStack
          key={doc.id}
          px="2" py="1" borderRadius="md" gap="1.5"
          _hover={{ bg: "bg.subtle" }}
          role="group"
        >
          <LuFileText size={12} color="var(--chakra-colors-textSecondary)" />
          <Text fontSize="xs" flex="1" truncate color="fg.muted">{doc.filename}</Text>
          <IconButton
            aria-label="Delete file" variant="ghost" size="2xs" colorPalette="red"
            onClick={() => void remove(doc.id)}
          >
            <LuTrash2 />
          </IconButton>
        </HStack>
      ))}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <Button
        size="xs" variant="ghost" justifyContent="flex-start"
        loading={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <LuUpload /> Upload PDF
      </Button>
    </VStack>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/ui/ProjectSidebar.tsx
git commit -m "feat: wire ProjectSidebar to real API (projects + documents + upload)"
```

---

### Task 10: Delete mock data

**Files:**
- Delete: `src/data/mockProjects.ts`

**Step 1: Verify no remaining imports**

Search for any remaining imports of `@/data/mockProjects` or `../data/mockProjects`:

```bash
grep -r "mockProjects" src/
```

Expected: no output. If any files still import from it, fix them before deleting.

**Step 2: Delete the file**

```bash
git rm src/data/mockProjects.ts
```

**Step 3: Run TypeScript check**

```bash
npm run build
```

Expected: compiles cleanly with no errors.

**Step 4: Commit**

```bash
git commit -m "chore: remove mock data — all data now comes from real API"
```

---

### Task 11: Manual verification

**Step 1: Start local backend**

Ensure `rag-citation-langchain` backend is running on `http://localhost:8000`.

**Step 2: Start frontend**

```bash
npm run dev
```

**Step 3: Verify each flow**

- [ ] Log in — should redirect to projects list
- [ ] Projects load from `GET /projects` (check Network tab)
- [ ] Create a project — appears in sidebar, navigates to it
- [ ] Upload a PDF — appears in the document list under the project
- [ ] Delete a document — disappears from list
- [ ] Submit a paragraph in the chat — `cited_paragraph` shown as AI response, citation cards below
- [ ] Delete a project — removed from sidebar, navigates away
- [ ] Log out and back in — projects still load (Firebase token refreshed)

**Step 4: Verify production build**

```bash
npm run build
```

Expected: no TypeScript errors, no missing env var errors (since `.env.production` is present).
