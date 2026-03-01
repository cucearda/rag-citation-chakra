import { Box, Textarea } from "@chakra-ui/react";

export default function ResultTextField() {
  return (
      <Box border="2px solid" borderColor="gray.300" padding="10px" margin="15px" borderRadius="md" boxShadow="md" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Textarea
          placeholder="cited results will appear here..."
          size="xl"
          readOnly
          boxShadow="md"
          style={{ flex: 1 }}
        />
      </Box>
  );
}
