import { Stack, Box } from "@chakra-ui/react";
import WorkPanel from "./WorkPanel";
import ResultsPanel from "./ResultsPanel";

export default function CompleteWorkstation() {
  return (
      <Stack gap="10px" flex="1" minH="0">
        <Box flex="3" minH="0" display="flex" margin="1" borderColor="gray.300" boxShadow="md">
          <WorkPanel></WorkPanel>
        </Box>
        <Box flex="5" minH="0" display="flex" margin="1" borderColor="gray.300" boxShadow="md">
            <ResultsPanel></ResultsPanel>
        </Box>
      </Stack>  
    )
}
