export interface ApiProject {
  id: string
  name: string
  namespace: string
  created_at: string
}

export interface ApiDocument {
  id: string
  filename: string
  chunks_indexed: number
  authors?: string
  year?: string
  created_at: string
}

export interface ApiUploadedDocument {
  id: string
  filename: string
  chunks_indexed: number
}

export interface CitationSource {
  paper_title: string
  authors: string
  year: string
  section_title: string
  section_number: string | null
  pages: string | null
}

export interface Citation {
  start: number
  end: number
  citation_format: string
  reason: string
  relevant_quote: string
  relevance_explanation: string
  source: CitationSource
}

export interface CitationResponse {
  cited_paragraph: string
  citations: Citation[]
}
