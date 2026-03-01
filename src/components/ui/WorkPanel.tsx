import { HStack, Box } from "@chakra-ui/react";
import UploadedDocumentsTable from "./UploadedDocumentsTable";
import ParagraphField from "./ParagraphField";

export default function WorkPanel() {
  return (
    <HStack>
      <Box flex="2">
        <UploadedDocumentsTable />
      </Box>
      <Box flex="5">
        <ParagraphField />
      </Box>
    </HStack>
  );
}
