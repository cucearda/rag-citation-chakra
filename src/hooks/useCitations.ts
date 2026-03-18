import { useState, useCallback } from "react"
import { getCitations } from "@/services/citationService"
import type { CitationResponse } from "@/types/api"

export function useCitations(projectId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCitations = useCallback(async (paragraph: string): Promise<CitationResponse | null> => {
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
  }, [projectId])

  return { fetchCitations, loading, error }
}
