# Per-Project Chat History Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Persist per-project chat history in Firestore with localStorage as a read cache, so messages survive page refreshes and project switching shows the correct chat.

**Architecture:** Firestore is source of truth at `users/{userId}/projects/{projectId}/messages/{messageId}`. On project open, localStorage is read first for instant render, then Firestore overwrites with authoritative data. New messages are written to both Firestore and localStorage. `ConversationView` remounts per `projectId` so history is isolated.

**Tech Stack:** Firebase Firestore (firebase v12), React hooks, localStorage, TypeScript

---

### Task 1: Add Firestore to firebase.ts and rename ApiCitation → Citation

**Files:**
- Modify: `src/lib/firebase.ts`
- Modify: `src/types/api.ts`
- Modify: `src/components/ui/CitationCard.tsx`
- Modify: `src/hooks/useCitations.ts`
- Modify: `src/components/ui/ConversationView.tsx`

**Step 1: Add Firestore export to firebase.ts**

Open `src/lib/firebase.ts` and add `getFirestore`:

```ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

**Step 2: Rename ApiCitation → Citation in src/types/api.ts**

Replace `ApiCitation` with `Citation` everywhere in `src/types/api.ts`:

```ts
export interface Citation {
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
  citations: Citation[]
}
```

**Step 3: Update all files that import ApiCitation**

- In `src/hooks/useCitations.ts`: no direct import of `ApiCitation`, but `ApiCitationResponse` uses it — already updated by step 2.
- In `src/components/ui/ConversationView.tsx`: change `import type { ApiCitation }` → `import type { Citation }` and update the type annotation on `AiMessage.citations`.
- In `src/components/ui/CitationCard.tsx`: read the file first, then update any `ApiCitation` import to `Citation`.

**Step 4: Verify the app still compiles**

```bash
npm run build
```

Expected: no TypeScript errors.

**Step 5: Commit**

```bash
git add src/lib/firebase.ts src/types/api.ts src/components/ui/CitationCard.tsx src/hooks/useCitations.ts src/components/ui/ConversationView.tsx
git commit -m "feat: add Firestore client and rename ApiCitation to Citation"
```

---

### Task 2: Create the useChatHistory hook

**Files:**
- Create: `src/hooks/useChatHistory.ts`

**Step 1: Create the file**

```ts
import { useEffect, useState, useCallback } from "react"
import {
  collection, addDoc, getDocs, orderBy, query,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Citation } from "@/types/api"

export interface UserMessage {
  role: "user"
  content: string
}

export interface AiMessage {
  role: "ai"
  content: string
  citations: Citation[]
}

export interface ErrorMessage {
  role: "error"
  content: string
}

export type Message = UserMessage | AiMessage | ErrorMessage

// Only user and ai messages are persisted
type PersistedMessage = UserMessage | AiMessage

function localKey(userId: string, projectId: string) {
  return `chat:${userId}:${projectId}`
}

function loadFromLocalStorage(userId: string, projectId: string): PersistedMessage[] {
  try {
    const raw = localStorage.getItem(localKey(userId, projectId))
    return raw ? (JSON.parse(raw) as PersistedMessage[]) : []
  } catch {
    return []
  }
}

function saveToLocalStorage(userId: string, projectId: string, messages: PersistedMessage[]) {
  localStorage.setItem(localKey(userId, projectId), JSON.stringify(messages))
}

export function useChatHistory(userId: string, projectId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !projectId) {
      setMessages([])
      setLoading(false)
      return
    }

    // 1. Instant render from localStorage
    const cached = loadFromLocalStorage(userId, projectId)
    setMessages(cached)

    // 2. Authoritative fetch from Firestore
    const messagesRef = collection(db, "users", userId, "projects", projectId, "messages")
    const q = query(messagesRef, orderBy("index"))

    getDocs(q)
      .then((snap) => {
        const fetched = snap.docs.map((d) => d.data() as PersistedMessage)
        setMessages(fetched)
        saveToLocalStorage(userId, projectId, fetched)
      })
      .catch(() => {
        // keep cached messages on fetch error
      })
      .finally(() => setLoading(false))
  }, [userId, projectId])

  const addMessage = useCallback(
    async (msg: UserMessage | AiMessage) => {
      // Optimistic local update
      setMessages((prev) => [...prev, msg])

      const messagesRef = collection(db, "users", userId, "projects", projectId, "messages")

      // Derive next index from current state length
      setMessages((prev) => {
        const persisted = prev.filter((m): m is PersistedMessage => m.role !== "error")
        const index = persisted.length - 1

        const doc: Record<string, unknown> = {
          index,
          type: msg.role,
          content: msg.content,
        }
        if (msg.role === "ai") {
          doc.citations = msg.citations
        }

        // Fire-and-forget write; update localStorage after
        void addDoc(messagesRef, doc).then(() => {
          saveToLocalStorage(userId, projectId, persisted)
        })

        return prev
      })
    },
    [userId, projectId],
  )

  return { messages, addMessage, loading }
}
```

**Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/hooks/useChatHistory.ts
git commit -m "feat: add useChatHistory hook with Firestore + localStorage"
```

---

### Task 3: Update ConversationView to use useChatHistory

**Files:**
- Modify: `src/components/ui/ConversationView.tsx`

**Step 1: Read the current file**

Read `src/components/ui/ConversationView.tsx` in full before editing.

**Step 2: Replace the file content**

The updated `ConversationView` should:
- Remove local `useState<Message[]>`
- Import `useChatHistory` and the `Message` types from it
- Get `userId` from `useAuthContext()` (imported from `@/context/AuthContext`)
- Call `useChatHistory(userId, projectId)` to get `{ messages, addMessage, loading: historyLoading }`
- In `handleSubmit`: call `await addMessage(userMsg)` and `await addMessage(aiMsg)` instead of `setMessages`
- Show a full-area spinner while `historyLoading` is true (before messages render)

```tsx
import { useRef, useEffect } from "react"
import { Box, Text, VStack, Spinner, HStack } from "@chakra-ui/react"
import { useParams } from "react-router-dom"
import { useProjectContext } from "@/context/ProjectContext"
import { useAuthContext } from "@/context/AuthContext"
import { useCitations } from "@/hooks/useCitations"
import { useChatHistory, type UserMessage, type AiMessage, type ErrorMessage } from "@/hooks/useChatHistory"
import CitationCard from "./CitationCard"
import ChatInputBar from "./ChatInputBar"

export default function ConversationView() {
  const { projectId = "" } = useParams<{ projectId: string }>()
  const { projects } = useProjectContext()
  const { currentUser } = useAuthContext()
  const userId = currentUser?.uid ?? ""
  const { fetchCitations, loading: citationLoading } = useCitations(projectId)
  const { messages, addMessage, loading: historyLoading } = useChatHistory(userId, projectId)
  const bottomRef = useRef<HTMLDivElement>(null)

  const project = projects.find((p) => p.id === projectId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSubmit(text: string) {
    const userMsg: UserMessage = { role: "user", content: text }
    await addMessage(userMsg)

    const result = await fetchCitations(text)
    if (result) {
      const aiMsg: AiMessage = {
        role: "ai",
        content: result.cited_paragraph,
        citations: result.citations,
      }
      await addMessage(aiMsg)
    } else {
      const errMsg: ErrorMessage = { role: "error", content: "Failed to get citations. Please try again." }
      // error messages are not persisted — add directly to local state via a transient approach
      // Since addMessage only accepts user/ai, we handle error display separately
      // We'll keep a local error state for this
    }
  }

  if (historyLoading) {
    return (
      <Box display="flex" flex="1" alignItems="center" justifyContent="center" bg="canvas">
        <Spinner size="md" color="textSecondary" />
      </Box>
    )
  }

  return (
    <Box display="flex" flexDirection="column" flex="1" minH="0" bg="canvas">
      <Box flex="1" overflowY="auto" px="6" py="4">
        {messages.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" h="full" gap="2">
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
                    <Text fontSize="sm" lineHeight="1.6" color="fg" mb="3">{msg.content}</Text>
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
            {citationLoading && (
              <HStack gap="2" px="1">
                <Spinner size="xs" color="textSecondary" />
                <Text fontSize="sm" color="textSecondary">Thinking...</Text>
              </HStack>
            )}
            <div ref={bottomRef} />
          </VStack>
        )}
      </Box>
      <ChatInputBar onSubmit={handleSubmit} disabled={citationLoading} />
    </Box>
  )
}
```

> **Note on error messages:** `addMessage` only persists `user` and `ai` messages. Error messages are transient. To display them, update `useChatHistory` to also accept `ErrorMessage` in the state (it already does via the `Message` union type) — but `addMessage` only writes `UserMessage | AiMessage` to Firestore. For `handleSubmit` to still show errors, update the hook's `addMessage` to also accept `ErrorMessage` and only skip persisting it:

Update `useChatHistory.ts` `addMessage` signature:
```ts
const addMessage = useCallback(
  async (msg: Message) => {
    setMessages((prev) => [...prev, msg])
    if (msg.role === "error") return  // don't persist errors

    // ... rest of Firestore write logic
  },
  [userId, projectId],
)
```

And update `handleSubmit` to call `await addMessage(errMsg)` for errors too.

**Step 3: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

**Step 4: Commit**

```bash
git add src/components/ui/ConversationView.tsx src/hooks/useChatHistory.ts
git commit -m "feat: wire ConversationView to useChatHistory for persistent per-project chat"
```

---

### Task 4: Ensure project switching resets conversation view

**Files:**
- Modify: `src/layouts/project-layout.tsx`

**Step 1: Add a key prop to force remount on projectId change**

When navigating between projects, `ConversationView` must remount so `useChatHistory` resets and loads the new project's history. The cleanest way is to key the `<Outlet>` wrapper on `projectId`.

Read `src/layouts/project-layout.tsx`, then update the `<Box>` wrapping `<Outlet>` to include `key={projectId}`:

```tsx
import { HStack, Box } from "@chakra-ui/react"
import { Outlet, useParams } from "react-router-dom"
import ProjectSidebar from "@/components/ui/ProjectSidebar"
import { ProjectProvider } from "@/context/ProjectContext"

export default function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <ProjectProvider>
      <HStack flex="1" minH="0" gap="0" alignItems="stretch">
        <ProjectSidebar />
        <Box key={projectId} flex="1" minH="0" display="flex" flexDirection="column">
          <Outlet />
        </Box>
      </HStack>
    </ProjectProvider>
  )
}
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

**Step 3: Manual smoke test**

1. Open the app, navigate to a project, send a message
2. Switch to a different project — the chat should be empty (or show that project's history)
3. Switch back — original messages should reappear
4. Refresh the page — messages should still be there

**Step 4: Commit**

```bash
git add src/layouts/project-layout.tsx
git commit -m "feat: remount ConversationView on project switch for isolated chat history"
```
