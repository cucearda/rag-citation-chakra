import { useEffect, useState, useCallback } from "react"
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

    // Instant render from cache
    const cached = loadFromLocalStorage(userId, projectId)
    setMessages(cached)

    // Authoritative fetch from Firestore
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
    async (msg: Message) => {
      // Error messages: local-only, not persisted
      if (msg.role === "error") {
        setMessages((prev) => [...prev, msg])
        return
      }

      // Optimistic local update
      setMessages((prev) => [...prev, msg])

      const messagesRef = collection(db, "users", userId, "projects", projectId, "messages")

      // Compute index = number of persisted messages before this one
      setMessages((prev) => {
        const persisted = prev.filter((m): m is PersistedMessage => m.role !== "error")
        const index = persisted.length - 1

        const doc: Record<string, unknown> = {
          index,
          type: msg.role,
          content: msg.content,
        }
        if (msg.role === "ai") {
          doc.citations = (msg as AiMessage).citations
        }

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
