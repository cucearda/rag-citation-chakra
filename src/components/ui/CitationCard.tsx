import { Box, Text, HStack } from "@chakra-ui/react"
import { LuFileText } from "react-icons/lu"
import type { Citation } from "@/data/mockProjects"

interface CitationCardProps {
  citation: Citation
}

export default function CitationCard({ citation }: CitationCardProps) {
  const { source, relevantQuote, reason } = citation

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
          {source.title || source.fileName} · {source.year} · {source.authors}
        </Text>
      </HStack>
      <Text fontSize="sm" fontStyle="italic" color="fg" mb="1">
        "{relevantQuote}"
      </Text>
      <Text fontSize="xs" color="textSecondary">{reason}</Text>
    </Box>
  )
}
