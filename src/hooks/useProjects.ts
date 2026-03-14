import { useState, useEffect, useCallback } from "react"
import { listProjects, createProject, deleteProject } from "@/services/projectService"
import type { ApiProject } from "@/types/api"

export function useProjects() {
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listProjects()
      setProjects(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchProjects() }, [fetchProjects])

  async function create(name: string): Promise<ApiProject> {
    const project = await createProject(name)
    setProjects((prev) => [...prev, project])
    return project
  }

  async function remove(projectId: string): Promise<void> {
    await deleteProject(projectId)
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
  }

  return { projects, loading, error, create, remove, refetch: fetchProjects }
}
