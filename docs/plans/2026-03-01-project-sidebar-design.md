# Project Sidebar Design

**Date:** 2026-03-01
**Feature:** Collapsible project sidebar with create/delete and URL-based project namespacing

---

## Overview

Add a collapsible sidebar to the left of the main workstation that lists projects, highlights the active one, and provides create/delete actions. Citations and uploaded documents are namespaced by project via URL routing.

---

## Routing Structure

```
/                          → redirect to /projects/:id (first project)
/projects/:projectId       → main workstation for that project
```

- `RootLayout` keeps the navbar and renders `<Outlet>`
- A new `ProjectLayout` wraps the workstation, renders the sidebar + `<Outlet>` for the workstation content
- Active project ID is always derived from `useParams()` — no extra state needed

---

## Sidebar Component

Located at `src/components/ui/ProjectSidebar.tsx`.

### Expanded state (~220px wide)
- Header: "Projects" label + collapse toggle button `[<]`
- "+ New Project" button at top of list
- List of projects; active project highlighted with distinct background
- Trash icon appears on hover per project item

### Collapsed state (~48px wide)
- Expand toggle button `[>]`
- "+" icon button for new project
- Dot indicators for each project (filled dot = active)

### Collapse behavior
- Toggle button in sidebar header controls expanded/collapsed
- State held in local `useState` within the sidebar component (no need to persist)

---

## Data Model

**`src/data/mockProjects.ts`** — shared mock data module:

```ts
interface Project { id: string; name: string }
interface Document { id: number; projectId: string; fileName: string; title: string; authors: string; year: number }
interface Citation { id: number; projectId: string; start: number; end: number; reason: string; source: CitationSource; relevant_quote: string; relevance_explanation: string }

export const projects: Project[]
export const documents: Document[]
export const citations: Citation[]
```

---

## Component Changes

| Component | Change |
|---|---|
| `App.tsx` | Add `/projects/:projectId` route; redirect `/` to first project |
| `root-layout.tsx` | Render navbar + `<Outlet>` (no workstation here) |
| `ProjectLayout` (new) | Horizontal flex: `ProjectSidebar` + `<Outlet>` |
| `ProjectSidebar` (new) | Collapsible sidebar with project list, create, delete |
| `UploadedDocumentsTable` | Read `projectId` from `useParams()`, filter mock documents |
| `CitationTable` | Read `projectId` from `useParams()`, filter mock citations |

---

## Create Project UX

- Clicking "+ New Project" reveals an inline text input in the sidebar
- Confirm/Cancel controls below input
- On confirm: call `POST /projects`, navigate to `/projects/:newId`
- On cancel: hide input, no change

---

## Delete Project UX

- Trash icon visible on hover for each project item
- Clicking trash opens a Chakra `Dialog`: "Delete 'Project Name'? This cannot be undone."
- On confirm: call `DELETE /projects/:id`
  - If deleted project was active → redirect to first remaining project
  - If no projects remain → navigate to an empty state route

---

## API Integration

Real endpoints exist; mock data used as initial state:

| Action | Endpoint |
|---|---|
| Create | `POST /projects` |
| Delete | `DELETE /projects/:id` |

Both calls optimistically update the local projects list before awaiting response.
