import { HStack, Box } from "@chakra-ui/react";
import CitationTable from "./CitationTable";
import ResultTextField from "./ResultTextField"

export default function ResultsPanel() {
  return (
    <HStack style={{ flex: 1 }} alignItems="stretch">
      <Box flex="2" overflow="auto">
        <CitationTable />
      </Box>
      <Box flex="5" display="flex">
        <ResultTextField/>
      </Box>
    </HStack>
  );
}
