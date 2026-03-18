import { Box, Text, HStack } from "@chakra-ui/react"
import { LuFileText } from "react-icons/lu"
import type { Citation } from "@/types/api"

interface CitationCardProps {
  citation: Citation
}

export default function CitationCard({ citation }: CitationCardProps) {
  const { source, relevant_quote, reason, citation_format, relevance_explanation } = citation

  return (
    <Box
      border="1px solid"
      borderColor="borderDefault"
      borderRadius="sm"
      px="3" py="2"
      bg="white"
    >
      <HStack gap="1.5" mb="1">
        <LuFileText size={12} color="var(--chakra-colors-textSecondary)" />
        <Text fontSize="xs" color="textSecondary" fontWeight="medium">
          {source.paper_title} · {source.year} · {source.authors}
        </Text>
      </HStack>
      <Text fontSize="xs" color="textSecondary" fontStyle="italic" mb="1">
        {citation_format}
      </Text>
      <Text fontSize="sm" fontStyle="italic" color="fg" mb="1">
        "{relevant_quote}"
      </Text>
      <Text fontSize="xs" color="textSecondary" mb="1">{relevance_explanation}</Text>
      <Text fontSize="xs" color="textSecondary" opacity={0.7}>{reason}</Text>
    </Box>
  )
}
