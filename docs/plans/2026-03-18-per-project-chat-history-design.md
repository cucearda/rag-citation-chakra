# Per-Project Chat History Design

## Overview

Each project has its own persistent chat window. Chat history survives page refreshes and project switching. Firestore is the source of truth; localStorage is a read cache for instant display on load.

## Data Model

Firestore path: `users/{userId}/projects/{projectId}/messages/{messageId}`

Fields:
- `index: number` — sort order
- `type: "user" | "ai"` — message role
- `content: string` — message text
- `citations?: Citation[]` — only present on ai messages

Error messages (transient UI failures) are never persisted.

localStorage key: `chat:${userId}:${projectId}` → serialized `Message[]` sorted by `index`.

## Architecture

A `useChatHistory` hook owns all persistence logic.

### Load flow (on project open)
1. Parse localStorage → set messages immediately (instant render)
2. Query Firestore `orderBy("index")` → overwrite state + re-sync localStorage

### Write flow (on new message)
1. Append to local state optimistically
2. Write to Firestore `addDoc`
3. Update localStorage

### Project switching
`ConversationView` remounts per project (via `projectId` as React key or `useEffect`). The hook runs fresh for the new project.

## Components Changed

- **`src/hooks/useChatHistory.ts`** — new hook, returns `{ messages, addMessage, loading }`
- **`src/components/ui/ConversationView.tsx`** — replaces `useState<Message[]>` with `useChatHistory`; gets `userId` from `useAuth()`
- **`src/types/api.ts`** — rename `ApiCitation` → `Citation`, update all usages

## Approach Considered

- **Option A (chosen):** Firestore-primary, localStorage as read cache. Clean source of truth, no merge complexity.
- **Option B:** localStorage-primary, background Firestore sync. More complex, merge risk.
- **Option C:** In-memory context, Firestore on first visit. No cache benefit.
