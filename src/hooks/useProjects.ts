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
    try {
      setError(null)
      const project = await createProject(name)
      setProjects((prev) => [...prev, project])
      return project
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create project")
      throw e  // re-throw so callers know it failed
    }
  }

  async function remove(projectId: string): Promise<void> {
    try {
      setError(null)
      await deleteProject(projectId)
      setProjects((prev) => prev.filter((p) => p.id !== projectId))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete project")
      throw e  // re-throw so caller can avoid navigation
    }
  }

  return { projects, loading, error, create, remove, refetch: fetchProjects }
}
