import { useRef, useState } from "react"
import { Box, Textarea, IconButton } from "@chakra-ui/react"
import { LuPaperclip, LuArrowUp } from "react-icons/lu"

interface ChatInputBarProps {
  onSubmit: (text: string) => void
  disabled?: boolean
  onUpload?: (file: File) => void
}

export default function ChatInputBar({ onSubmit, disabled, onUpload }: ChatInputBarProps) {
  const [text, setText] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setText("")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (onUpload) {
      files.forEach((f) => onUpload(f))
    }
    e.target.value = ""
  }

  return (
    <Box
      borderTop="1px solid"
      borderColor="borderDefault"
      px="4" py="3"
      bg="canvas"
    >
      <Box
        border="1px solid"
        borderColor="borderDefault"
        borderRadius="md"
        bg="white"
        display="flex"
        alignItems="flex-end"
        gap="1"
        px="2" py="1.5"
      >
        {onUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <IconButton
              aria-label="Attach file"
              variant="ghost" size="sm"
              color="textSecondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <LuPaperclip />
            </IconButton>
          </>
        )}
        <Textarea
          placeholder="Reply..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          size="sm"
          border="none"
          outline="none"
          resize="none"
          minH="36px"
          maxH="120px"
          flex="1"
          p="0"
          fontSize="sm"
          _focus={{ boxShadow: "none" }}
        />
        <IconButton
          aria-label="Send"
          size="sm"
          borderRadius="full"
          disabled={disabled || !text.trim()}
          colorPalette={text.trim() && !disabled ? "orange" : "gray"}
          variant={text.trim() && !disabled ? "solid" : "ghost"}
          onClick={handleSubmit}
        >
          <LuArrowUp />
        </IconButton>
      </Box>
    </Box>
  )
}
