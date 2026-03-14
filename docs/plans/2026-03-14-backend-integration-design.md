# Backend Integration Design

**Date:** 2026-03-14
**API reference:** `BACKEND_API.md`

## Goal

Replace all mock data with real API calls to the RAG Citation backend. Wire up projects, documents, and citations end-to-end.

---

## Architecture

Plain fetch in hooks — no new dependencies. Three layers:

1. **`src/lib/apiClient.ts`** — base fetch wrapper. Injects Firebase auth token and base URL. Throws on non-2xx with the backend's `detail` message.
2. **`src/services/`** — domain functions that call `apiFetch`. No React.
3. **`src/hooks/`** — React state wrappers around the services. Expose `{ data, loading, error }` and mutation functions.

Components call hooks only, never fetch directly.

---

## File Structure

```
src/
├── lib/
│   └── apiClient.ts          base fetch wrapper
├── services/
│   ├── projectService.ts     listProjects, createProject, deleteProject
│   ├── documentService.ts    listDocuments, uploadDocument, deleteDocument
│   └── citationService.ts    getCitations
├── hooks/
│   ├── useProjects.ts        projects state + create/delete
│   ├── useDocuments.ts       documents state + upload/delete
│   └── useCitations.ts       submit paragraph, receive cited_paragraph + citations
├── types/
│   └── api.ts                TypeScript types matching real API shapes
├── context/
│   └── ProjectContext.tsx    MODIFY — replace mock state with useProjects
├── components/ui/
│   ├── ProjectSidebar.tsx    MODIFY — wire create/delete projects, upload docs
│   ├── ConversationView.tsx  MODIFY — replace mock response with useCitations
│   └── CitationCard.tsx      MODIFY — rework to real API Citation shape
└── data/
    └── mockProjects.ts       DELETE
```

---

## Environment / Base URL

| Environment | File | Value |
|-------------|------|-------|
| Local dev (`vite dev`) | `.env.local` | `http://localhost:8000` |
| Production (`vite build`) | `.env.production` | `https://<railway-domain>.up.railway.app` |

`apiClient.ts` reads `import.meta.env.VITE_API_URL`. Vite picks the right file automatically — no `if/else` in code. A missing variable throws at startup with a clear error.

`.env.local` is gitignored. `.env.production` is committed.

---

## Data Flow

### Projects
- `ProjectContext` mounts → calls `useProjects` → `GET /projects`
- Sidebar renders real list
- Create: `POST /projects` → optimistic local append
- Delete: `DELETE /projects/{id}` → optimistic local remove

### Documents
- `useDocuments(projectId)` fetches `GET /projects/{id}/documents` on projectId change
- Upload: file picker → `POST /projects/{id}/documents` (multipart/form-data) → append to list
- Delete: `DELETE /projects/{id}/documents/{doc_id}` → remove from list

### Citations
- User submits paragraph in `ConversationView`
- `useCitations` calls `POST /projects/{id}/citations`
- Response `cited_paragraph` becomes the AI message text
- Response `citations` array renders as `CitationCard` components below the text

### Auth Token
- `apiClient.ts` calls `getAuth().currentUser?.getIdToken()` before every request
- Always fresh — no manual token storage needed

---

## CitationCard Rework

The real API `Citation` shape replaces the mock shape:

| Real API field | Displayed as |
|----------------|--------------|
| `citation_format` | inline APA string, e.g. `(Vaswani et al., 2017, p. 5)` |
| `source.paper_title` | card title |
| `source.authors` | subtitle |
| `source.year` | subtitle |
| `relevant_quote` | blockquote |
| `relevance_explanation` | body text |
| `reason` | small label |

Fields removed: `fileName`, `source.title` (was mock-only).

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| 401 | Redirect to `/login` |
| 404 | Inline error in the relevant component |
| 500 (citation agent failure) | Error message in chat thread instead of AI reply |
| Upload non-PDF / network error | Inline error in sidebar |
| Missing `VITE_API_URL` | Throw at startup with descriptive message |

All hooks expose `{ loading, error }`. Components render error states inline.

---

## Out of Scope

- React Query / caching
- Optimistic citation updates
- Password reset, MFA
- Document upload progress indicator
