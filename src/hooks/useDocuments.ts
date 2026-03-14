import { useState, useEffect, useCallback } from "react"
import { listDocuments, uploadDocument, deleteDocument } from "@/services/documentService"
import type { ApiDocument } from "@/types/api"

export function useDocuments(projectId: string) {
  const [documents, setDocuments] = useState<ApiDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    if (!projectId) return
    try {
      setLoading(true)
      setError(null)
      const data = await listDocuments(projectId)
      setDocuments(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents")
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { void fetchDocuments() }, [fetchDocuments])

  async function upload(file: File): Promise<void> {
    try {
      setUploading(true)
      setError(null)
      const uploaded = await uploadDocument(projectId, file)
      const newDoc: ApiDocument = {
        id: uploaded.id,
        filename: uploaded.filename,
        chunks_indexed: uploaded.chunks_indexed,
        created_at: new Date().toISOString(),
      }
      setDocuments((prev) => [...prev, newDoc])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function remove(documentId: string): Promise<void> {
    try {
      setError(null)
      await deleteDocument(projectId, documentId)
      setDocuments((prev) => prev.filter((d) => d.id !== documentId))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete document")
    }
  }

  return { documents, loading, uploading, error, upload, remove, refetch: fetchDocuments }
}
