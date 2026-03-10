import { createContext, useContext, useState, type ReactNode } from "react"
import { documents as initialDocuments, type Document } from "@/data/mockProjects"
import { useParams } from "react-router-dom"

interface ProjectContextValue {
  projectId: string
  documents: Document[]
  addDocument: (fileName: string) => void
  removeDocument: (id: number) => void
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { projectId = "" } = useParams<{ projectId: string }>()
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)

  const projectDocuments = documents.filter((d) => d.projectId === projectId)

  function addDocument(fileName: string) {
    const newDoc: Document = {
      id: Date.now(),
      projectId,
      fileName,
      title: "",
      authors: "",
      year: new Date().getFullYear(),
    }
    setDocuments((prev) => [...prev, newDoc])
  }

  function removeDocument(id: number) {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <ProjectContext.Provider
      value={{ projectId, documents: projectDocuments, addDocument, removeDocument }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error("useProjectContext must be used inside ProjectProvider")
  return ctx
}
