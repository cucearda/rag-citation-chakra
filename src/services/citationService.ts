import { apiFetch } from "@/lib/apiClient"
import type { ApiCitationResponse } from "@/types/api"

export async function getCitations(
  projectId: string,
  paragraph: string
): Promise<ApiCitationResponse> {
  const res = await apiFetch(`/projects/${projectId}/citations`, {
    method: "POST",
    body: JSON.stringify({ paragraph }),
  })
  return res.json()
}
