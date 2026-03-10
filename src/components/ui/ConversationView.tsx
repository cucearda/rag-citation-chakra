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
