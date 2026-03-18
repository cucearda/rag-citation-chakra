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
  const userId = currentUser?.uid
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
      await addMessage(errMsg)
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
