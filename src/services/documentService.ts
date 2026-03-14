import { apiFetch } from "@/lib/apiClient"
import type { ApiDocument, ApiUploadedDocument } from "@/types/api"

export async function listDocuments(projectId: string): Promise<ApiDocument[]> {
  const res = await apiFetch(`/projects/${projectId}/documents`)
  return res.json()
}

export async function uploadDocument(projectId: string, file: File): Promise<ApiUploadedDocument> {
  const form = new FormData()
  form.append("file", file)
  const res = await apiFetch(`/projects/${projectId}/documents`, {
    method: "POST",
    body: form,
  })
  return res.json()
}

export async function deleteDocument(projectId: string, documentId: string): Promise<void> {
  await apiFetch(`/projects/${projectId}/documents/${documentId}`, { method: "DELETE" })
}
