import { apiFetch } from "@/lib/apiClient"
import type { ApiProject } from "@/types/api"

export async function listProjects(): Promise<ApiProject[]> {
  const res = await apiFetch("/projects")
  return res.json()
}

export async function createProject(name: string): Promise<ApiProject> {
  const res = await apiFetch("/projects", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
  return res.json()
}

export async function deleteProject(projectId: string): Promise<void> {
  await apiFetch(`/projects/${projectId}`, { method: "DELETE" })
}
