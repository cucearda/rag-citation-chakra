import { HStack, Box } from "@chakra-ui/react"
import { Outlet, useParams } from "react-router-dom"
import ProjectSidebar from "@/components/ui/ProjectSidebar"
import { ProjectProvider } from "@/context/ProjectContext"

export default function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <ProjectProvider>
      <HStack flex="1" minH="0" gap="0" alignItems="stretch">
        <ProjectSidebar />
        <Box key={projectId} flex="1" minH="0" display="flex" flexDirection="column">
          <Outlet />
        </Box>
      </HStack>
    </ProjectProvider>
  )
}
