import { useState } from "react"
import { getCitations } from "@/services/citationService"
import type { ApiCitationResponse } from "@/types/api"

export function useCitations(projectId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchCitations(paragraph: string): Promise<ApiCitationResponse | null> {
    try {
      setLoading(true)
      setError(null)
      return await getCitations(projectId, paragraph)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Citation request failed")
      return null
    } finally {
      setLoading(false)
    }
  }

  return { fetchCitations, loading, error }
}
