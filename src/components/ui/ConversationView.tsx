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
