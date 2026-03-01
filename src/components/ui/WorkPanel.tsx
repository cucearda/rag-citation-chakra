import { HStack, Box } from "@chakra-ui/react";
import UploadedDocumentsTable from "./UploadedDocumentsTable";
import ParagraphField from "./ParagraphField";

export default function WorkPanel() {
  return (
    <HStack flex="1" minH="0" alignItems="stretch">
      <Box flex="2" minH="0" overflow="auto">
        <UploadedDocumentsTable />
      </Box>
      <Box flex="5" minH="0" display="flex">
        <ParagraphField />
      </Box>
    </HStack>
  );
}
