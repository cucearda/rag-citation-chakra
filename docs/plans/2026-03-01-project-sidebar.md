# Project Sidebar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a collapsible left sidebar with URL-based project routing so citations and documents are namespaced per project.

**Architecture:** Projects are selected via `/projects/:projectId` URL — active project is always derived from `useParams()`. A new `ProjectLayout` wraps the workstation and renders the `ProjectSidebar` to its left. Mock data lives in a shared module filtered by `projectId` in each table component.

**Tech Stack:** React 19, TypeScript, Chakra UI v3, React Router v7, react-icons (LuChevronLeft, LuChevronRight, LuPlus, LuTrash2)

> **Note:** No test infrastructure exists in this project. Skip TDD; use manual browser verification steps instead.

---

### Task 1: Create shared mock data module

**Files:**
- Create: `src/data/mockProjects.ts`

**Step 1: Create the file**

```ts
export interface Project {
  id: string
  name: string
}

export interface Document {
  id: number
  projectId: string
  fileName: string
  title: string
  authors: string
  year: number
}

export interface CitationSource {
  fileName: string
  title: string
  authors: string
  year: number
}

export interface Citation {
  id: number
  projectId: string
  start: number
  end: number
  reason: string
  source: CitationSource
  relevant_quote: string
  relevance_explanation: string
}

export const projects: Project[] = [
  { id: "proj-1", name: "Research 2024" },
  { id: "proj-2", name: "Market Analysis" },
  { id: "proj-3", name: "Thesis Draft" },
]

export const documents: Document[] = [
  { id: 1, projectId: "proj-1", fileName: "xfd.pdf", title: "Hope in startups", authors: "Arda et. al", year: 1999 },
  { id: 2, projectId: "proj-1", fileName: "hello.pdf", title: "A Very Long Title About Markets", authors: "Johnson Watson", year: 2007 },
  { id: 3, projectId: "proj-2", fileName: "zuko.pdf", title: "", authors: "Marry Jane Sakso", year: 1453 },
  { id: 4, projectId: "proj-2", fileName: "markets.pdf", title: "Market Trends 2023", authors: "Alice B.", year: 2023 },
  { id: 5, projectId: "proj-3", fileName: "thesis.pdf", title: "My Thesis", authors: "Self", year: 2024 },
]

export const citations: Citation[] = [
  {
    id: 1, projectId: "proj-1", start: 0, end: 42,
    reason: "Directly supports the claim about startup growth rates",
    source: { fileName: "xfd.pdf", title: "Hope in startups", authors: "Arda et. al", year: 1999 },
    relevant_quote: "Startups that receive early funding grow 3x faster on average.",
    relevance_explanation: "This quote directly backs the paragraph's claim about early-stage funding impact.",
  },
  {
    id: 2, projectId: "proj-1", start: 43, end: 110,
    reason: "Provides empirical evidence for the stated market trends",
    source: { fileName: "hello.pdf", title: "A Very Long Title About Markets", authors: "Johnson Watson", year: 2007 },
    relevant_quote: "Market consolidation accelerates when venture capital exceeds $1B in a sector.",
    relevance_explanation: "The quote corroborates the market trend described in the highlighted span.",
  },
  {
    id: 3, projectId: "proj-2", start: 0, end: 55,
    reason: "Historical precedent for the argument made",
    source: { fileName: "zuko.pdf", title: "", authors: "Marry Jane Sakso", year: 1453 },
    relevant_quote: "Early trade networks followed patterns remarkably similar to modern distribution chains.",
    relevance_explanation: "Provides historical grounding for the analogy drawn in the paragraph.",
  },
  {
    id: 4, projectId: "proj-3", start: 0, end: 80,
    reason: "Core thesis support",
    source: { fileName: "thesis.pdf", title: "My Thesis", authors: "Self", year: 2024 },
    relevant_quote: "The evidence strongly suggests a causal relationship.",
    relevance_explanation: "Central claim of the thesis.",
  },
]
```

**Step 2: Verify**

Run `npm run build` — should compile with no errors.

**Step 3: Commit**

```bash
git add src/data/mockProjects.ts
git commit -m "feat: add shared mock project data module"
```

---

### Task 2: Update routing

**Files:**
- Modify: `src/App.tsx`

**Step 1: Rewrite App.tsx**

Replace the entire file content with:

```tsx
import './App.css'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
} from 'react-router-dom'
import RootLayout from './layouts/root-layout'
import ProjectLayout from './layouts/project-layout'
import CompleteWorkstation from './components/ui/CompleteWorkstation'
import { projects } from './data/mockProjects'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}>
      <Route index element={<Navigate to={`/projects/${projects[0].id}`} replace />} />
      <Route path="projects/:projectId" element={<ProjectLayout />}>
        <Route index element={<CompleteWorkstation />} />
      </Route>
    </Route>
  )
)

function App() {
  return <RouterProvider router={router} />
}

export default App
```

**Step 2: Verify**

Run `npm run build` — expect a TypeScript error about `ProjectLayout` not existing yet. That's fine; proceed to the next task.

**Step 3: Commit after Task 3 is done** (deferred — see Task 3 step 5)

---

### Task 3: Simplify RootLayout and create ProjectLayout

**Files:**
- Modify: `src/layouts/root-layout.tsx`
- Create: `src/layouts/project-layout.tsx`

**Step 1: Simplify root-layout.tsx**

Replace entire file with:

```tsx
import { Outlet } from "react-router-dom"
import Navbar from "@/components/ui/Navbar"

export default function RootLayout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Navbar />
      <Outlet />
    </div>
  )
}
```

**Step 2: Create project-layout.tsx**

```tsx
import { HStack, Box } from "@chakra-ui/react"
import { Outlet } from "react-router-dom"
import ProjectSidebar from "@/components/ui/ProjectSidebar"

export default function ProjectLayout() {
  return (
    <HStack flex="1" minH="0" gap="0" alignItems="stretch">
      <ProjectSidebar />
      <Box flex="1" minH="0" display="flex" flexDirection="column">
        <Outlet />
      </Box>
    </HStack>
  )
}
```

**Step 3: Verify**

Run `npm run build` — expect error about `ProjectSidebar` not existing yet. Proceed.

**Step 4: Commit after Task 4 (deferred)**

---

### Task 4: Create ProjectSidebar component

**Files:**
- Create: `src/components/ui/ProjectSidebar.tsx`

**Step 1: Create the file**

```tsx
import { useState, useRef } from "react"
import {
  Box,
  VStack,
  Text,
  IconButton,
  Button,
  Input,
  HStack,
  Dialog,
  Portal,
  CloseButton,
} from "@chakra-ui/react"
import { LuChevronLeft, LuChevronRight, LuPlus, LuTrash2 } from "react-icons/lu"
import { useParams, useNavigate } from "react-router-dom"
import { projects as initialProjects, Project } from "@/data/mockProjects"

export default function ProjectSidebar() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(true)
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)

  async function handleCreate() {
    if (!newName.trim()) return
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    }).catch(() => null)

    // Optimistic: use response id or generate a temp one
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
      navigate(remaining.length > 0 ? `/projects/${remaining[0].id}` : "/projects/empty")
    }
  }

  const EXPANDED_WIDTH = "220px"
  const COLLAPSED_WIDTH = "48px"

  return (
    <>
      <Box
        w={expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH}
        minW={expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH}
        borderRight="1px solid"
        borderColor="gray.200"
        display="flex"
        flexDirection="column"
        transition="width 0.2s, min-width 0.2s"
        overflow="hidden"
        bg="bg"
      >
        {/* Header */}
        <HStack
          px="2"
          py="3"
          justifyContent={expanded ? "space-between" : "center"}
          borderBottom="1px solid"
          borderColor="gray.200"
        >
          {expanded && (
            <Text fontWeight="bold" fontSize="sm" ml="1">
              Projects
            </Text>
          )}
          <IconButton
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? <LuChevronLeft /> : <LuChevronRight />}
          </IconButton>
        </HStack>

        {/* New project button */}
        <Box px="2" py="2" borderBottom="1px solid" borderColor="gray.100">
          {expanded ? (
            creating ? (
              <VStack gap="1" align="stretch">
                <Input
                  size="sm"
                  autoFocus
                  placeholder="Project name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate()
                    if (e.key === "Escape") { setCreating(false); setNewName("") }
                  }}
                />
                <HStack gap="1">
                  <Button size="xs" colorPalette="green" flex="1" onClick={handleCreate}>
                    Create
                  </Button>
                  <Button size="xs" variant="outline" flex="1" onClick={() => { setCreating(false); setNewName("") }}>
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <Button size="sm" variant="outline" w="full" onClick={() => setCreating(true)}>
                <LuPlus /> New Project
              </Button>
            )
          ) : (
            <IconButton
              aria-label="New project"
              variant="ghost"
              size="sm"
              w="full"
              onClick={() => { setExpanded(true); setCreating(true) }}
            >
              <LuPlus />
            </IconButton>
          )}
        </Box>

        {/* Project list */}
        <VStack gap="0" align="stretch" flex="1" overflowY="auto" py="1">
          {projects.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              active={project.id === projectId}
              expanded={expanded}
              onSelect={() => navigate(`/projects/${project.id}`)}
              onDelete={() => setDeleteTarget(project)}
            />
          ))}
        </VStack>
      </Box>

      {/* Delete confirmation dialog */}
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
              <Dialog.Header>
                <Dialog.Title>Delete project?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  Delete "{deleteTarget?.name}"? This cannot be undone.
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button colorPalette="red" onClick={() => deleteTarget && handleDelete(deleteTarget)}>
                  Delete
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}

interface ProjectItemProps {
  project: Project
  active: boolean
  expanded: boolean
  onSelect: () => void
  onDelete: () => void
}

function ProjectItem({ project, active, expanded, onSelect, onDelete }: ProjectItemProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <HStack
      px="2"
      py="2"
      cursor="pointer"
      bg={active ? "colorPalette.subtle" : hovered ? "bg.subtle" : "transparent"}
      colorPalette="blue"
      borderRadius="md"
      mx="1"
      gap="2"
      justifyContent={expanded ? "space-between" : "center"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      {expanded ? (
        <>
          <Text
            fontSize="sm"
            fontWeight={active ? "semibold" : "normal"}
            truncate
            flex="1"
          >
            {project.name}
          </Text>
          {hovered && (
            <IconButton
              aria-label="Delete project"
              variant="ghost"
              size="xs"
              colorPalette="red"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
            >
              <LuTrash2 />
            </IconButton>
          )}
        </>
      ) : (
        <Box
          w="8px"
          h="8px"
          borderRadius="full"
          bg={active ? "colorPalette.solid" : "gray.300"}
        />
      )}
    </HStack>
  )
}
```

**Step 2: Verify — run build**

```bash
npm run build
```

Expected: Compiles successfully.

**Step 3: Commit Tasks 2–4 together**

```bash
git add src/App.tsx src/layouts/root-layout.tsx src/layouts/project-layout.tsx src/components/ui/ProjectSidebar.tsx
git commit -m "feat: add project routing and collapsible sidebar"
```

**Step 4: Manual verification**

Start dev server: `npm run dev`

- [ ] Visiting `/` redirects to `/projects/proj-1`
- [ ] Sidebar appears on the left, "Research 2024" is highlighted
- [ ] Clicking "Market Analysis" navigates to `/projects/proj-2` and highlights it
- [ ] Collapse button `[<]` shrinks sidebar to icon-only mode
- [ ] Expand button `[>]` restores it
- [ ] Clicking `+` in collapsed mode expands sidebar and opens create input
- [ ] Typing a name and pressing Enter adds it to the list
- [ ] Pressing Escape cancels creation
- [ ] Hovering a project shows trash icon
- [ ] Clicking trash opens confirmation dialog
- [ ] Cancelling dialog does nothing
- [ ] Confirming delete removes project; if it was active, navigates to next project

---

### Task 5: Namespace UploadedDocumentsTable by project

**Files:**
- Modify: `src/components/ui/UploadedDocumentsTable.tsx`

**Step 1: Rewrite the component**

Replace entire file with:

```tsx
import { Table } from "@chakra-ui/react"
import { useParams } from "react-router-dom"
import { documents } from "@/data/mockProjects"

export default function UploadedDocumentsTable() {
  const { projectId } = useParams<{ projectId: string }>()
  const items = documents.filter((d) => d.projectId === projectId)

  return (
    <Table.Root size="sm" striped>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader fontWeight="bold">File Name</Table.ColumnHeader>
          <Table.ColumnHeader fontWeight="bold">Title</Table.ColumnHeader>
          <Table.ColumnHeader fontWeight="bold">Authors</Table.ColumnHeader>
          <Table.ColumnHeader fontWeight="bold" textAlign="end">Year</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map((item) => (
          <Table.Row key={item.id}>
            <Table.Cell>{item.fileName}</Table.Cell>
            <Table.Cell>{item.title}</Table.Cell>
            <Table.Cell>{item.authors}</Table.Cell>
            <Table.Cell textAlign="end">{item.year}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}
```

**Step 2: Verify**

```bash
npm run build
```

**Step 3: Manual check**

Switch between projects in the sidebar — the documents table should show only that project's files.

**Step 4: Commit**

```bash
git add src/components/ui/UploadedDocumentsTable.tsx
git commit -m "feat: filter uploaded documents by active project"
```

---

### Task 6: Namespace CitationTable by project

**Files:**
- Modify: `src/components/ui/CitationTable.tsx`

**Step 1: Rewrite the component**

Replace entire file with:

```tsx
import { Table } from "@chakra-ui/react"
import { useParams } from "react-router-dom"
import { citations } from "@/data/mockProjects"

export default function CitationTable() {
  const { projectId } = useParams<{ projectId: string }>()
  const items = citations.filter((c) => c.projectId === projectId)

  return (
    <Table.Root size="sm" striped>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader fontWeight="bold">Source</Table.ColumnHeader>
          <Table.ColumnHeader fontWeight="bold">Reason</Table.ColumnHeader>
          <Table.ColumnHeader fontWeight="bold">Relevant Quote</Table.ColumnHeader>
          <Table.ColumnHeader fontWeight="bold">Relevance Explanation</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map((item) => (
          <Table.Row key={item.id}>
            <Table.Cell>
              {item.source.title || item.source.fileName}
              <br />
              <small>{item.source.authors}, {item.source.year}</small>
            </Table.Cell>
            <Table.Cell>{item.reason}</Table.Cell>
            <Table.Cell fontStyle="italic">"{item.relevant_quote}"</Table.Cell>
            <Table.Cell>{item.relevance_explanation}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}
```

**Step 2: Verify**

```bash
npm run build
```

**Step 3: Manual check**

Switch between projects — citations table shows only that project's citations.

**Step 4: Commit**

```bash
git add src/components/ui/CitationTable.tsx
git commit -m "feat: filter citations by active project"
```

---

## Done

All 6 tasks complete. The sidebar is collapsible, projects are URL-routed, and documents/citations are namespaced per project.
