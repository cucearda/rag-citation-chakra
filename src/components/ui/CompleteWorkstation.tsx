import { Stack, Box } from "@chakra-ui/react";
import WorkPanel from "./WorkPanel";
import ResultsPanel from "./ResultsPanel";

export default function CompleteWorkstation() {
  return (
      <Stack gap="10px" flex="1">
        <Box flex="1">
          <WorkPanel></WorkPanel>
        </Box>
        <Box flex="5" display="flex">
            <ResultsPanel></ResultsPanel>
        </Box>
      </Stack>  
    )
}
