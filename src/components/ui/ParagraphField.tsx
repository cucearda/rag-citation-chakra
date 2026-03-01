import {
  Textarea,
  IconButton,
  Box,
  Stack,
  FileUpload,
  Button,
} from "@chakra-ui/react";
import { HiUpload } from "react-icons/hi";
import React, { useState } from "react";
import { LuArrowRight } from "react-icons/lu";

export default function ParagraphField() {
  const [text, setText] = useState("");

  return (
    <Stack border="2px solid" borderColor="gray.300" padding="10px" margin="15px" borderRadius="md" boxShadow="md" flex="1" minH="0">
      <Box position="relative" flex="1" display="flex" flexDirection="column" minH="0">
        <Textarea
          placeholder="enter your paragraph here"
          size="xl"
          value={text}
          onChange={(e) => setText(e.target.value)}
          paddingBottom="50px"
          boxShadow="md"
          style={{ flex: 1 }}
        />
        <IconButton
          aria-label="Submit"
          borderRadius="full"
          disabled={!text}
          colorPalette={text ? "green" : "gray"}
          size="sm"
          position="absolute"
          bottom="10px"
          right="10px"
        >
          <LuArrowRight />
        </IconButton>
      </Box>
      <FileUpload.Root accept={["image/png"]}>
        <FileUpload.HiddenInput />
        <FileUpload.Trigger asChild>
          <Button variant="outline" size="sm">
            <HiUpload /> Upload file
          </Button>
        </FileUpload.Trigger>
        <FileUpload.List />
      </FileUpload.Root>
    </Stack>
  );
}
