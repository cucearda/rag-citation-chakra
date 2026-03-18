import { useEffect, useState, useCallback, useRef } from "react"
import { collection, addDoc, getDocs, orderBy, query } from "firebase/firestore"
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
  try {
    localStorage.setItem(localKey(userId, projectId), JSON.stringify(messages))
  } catch {
    // QuotaExceededError or storage unavailable — non-fatal
  }
}

function isPersistedMessage(doc: unknown): doc is PersistedMessage {
  if (typeof doc !== "object" || doc === null) return false
  const role = (doc as Record<string, unknown>).role
  return role === "user" || role === "ai"
}

export function useChatHistory(userId: string | null | undefined, projectId: string | null | undefined) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const indexRef = useRef(0)

  useEffect(() => {
    if (!userId || !projectId) {
      setMessages([])
      setLoading(false)
      return
    }

    let cancelled = false

    // Instant render from cache
    const cached = loadFromLocalStorage(userId, projectId)
    setMessages(cached)
    indexRef.current = cached.length

    // Authoritative fetch from Firestore
    const messagesRef = collection(db, "users", userId, "projects", projectId, "messages")
    const q = query(messagesRef, orderBy("index"))

    getDocs(q)
      .then((snap) => {
        if (cancelled) return
        const fetched = snap.docs
          .map((d) => d.data())
          .filter(isPersistedMessage)
        setMessages(fetched)
        saveToLocalStorage(userId, projectId, fetched)
        indexRef.current = fetched.length
      })
      .catch(() => {
        // keep cached messages on fetch error
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, projectId])

  const addMessage = useCallback(
    async (msg: Message) => {
      if (msg.role === "error") {
        setMessages((prev) => [...prev, msg])
        return
      }

      // Atomically assign index
      const index = indexRef.current++

      // Optimistic local update + localStorage sync
      setMessages((prev) => {
        const updated = [...prev, msg]
        const persisted = updated.filter((m): m is PersistedMessage => m.role !== "error")
        saveToLocalStorage(userId!, projectId!, persisted)
        return updated
      })

      const messagesRef = collection(db, "users", userId!, "projects", projectId!, "messages")

      const doc: Record<string, unknown> = {
        index,
        role: msg.role,
        content: msg.content,
      }
      if (msg.role === "ai") {
        doc.citations = (msg as AiMessage).citations
      }

      await addDoc(messagesRef, doc)
    },
    [userId, projectId],
  )

  return { messages, addMessage, loading }
}
