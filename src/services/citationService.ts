import { apiFetch } from "@/lib/apiClient"
import type { CitationResponse } from "@/types/api"

export async function getCitations(
  projectId: string,
  paragraph: string
): Promise<CitationResponse> {
  const res = await apiFetch(`/projects/${projectId}/citations`, {
    method: "POST",
    body: JSON.stringify({ paragraph }),
  })
  return res.json()
}
