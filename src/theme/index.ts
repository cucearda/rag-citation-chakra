import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        canvas: { value: "#F7F7F5" },
        sidebar: { value: "#F0EFEB" },
        userBubble: { value: "#2F2F2F" },
        borderDefault: { value: "#E5E4DF" },
        textSecondary: { value: "#6B6B6B" },
      },
      fonts: {
        body: { value: `"Inter", system-ui, sans-serif` },
        heading: { value: `"Inter", system-ui, sans-serif` },
      },
      radii: {
        bubble: { value: "18px" },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
