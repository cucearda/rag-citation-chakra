import { createContext, useContext, type ReactNode } from "react"
import { useParams } from "react-router-dom"
import { useProjects } from "@/hooks/useProjects"
import type { ApiProject } from "@/types/api"

interface ProjectContextValue {
  projectId: string
  projects: ApiProject[]
  projectsLoading: boolean
  projectsError: string | null
  createProject: (name: string) => Promise<ApiProject>
  removeProject: (id: string) => Promise<void>
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { projectId = "" } = useParams<{ projectId: string }>()
  const { projects, loading, error, create, remove } = useProjects()

  return (
    <ProjectContext.Provider value={{
      projectId,
      projects,
      projectsLoading: loading,
      projectsError: error,
      createProject: create,
      removeProject: remove,
    }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error("useProjectContext must be used inside ProjectProvider")
  return ctx
}
