export interface Project {
  id: string
  name: string
}

export interface Document {
  id: number
  projectId: string
  fileName: string
  title: string
  authors: string
  year: number
}

export interface CitationSource {
  fileName: string
  title: string
  authors: string
  year: number
}

export interface Citation {
  id: number
  projectId: string
  start: number
  end: number
  reason: string
  source: CitationSource
  relevantQuote: string
  relevanceExplanation: string
}

export const projects: Project[] = [
  { id: "proj-1", name: "Research 2024" },
  { id: "proj-2", name: "Market Analysis" },
  { id: "proj-3", name: "Thesis Draft" },
]

export const documents: Document[] = [
  { id: 1, projectId: "proj-1", fileName: "xfd.pdf", title: "Hope in startups", authors: "Arda et. al", year: 1999 },
  { id: 2, projectId: "proj-1", fileName: "hello.pdf", title: "A Very Long Title About Markets", authors: "Johnson Watson", year: 2007 },
  { id: 3, projectId: "proj-2", fileName: "zuko.pdf", title: "", authors: "Marry Jane Sakso", year: 2019 },
  { id: 4, projectId: "proj-2", fileName: "markets.pdf", title: "Market Trends 2023", authors: "Alice B.", year: 2023 },
  { id: 5, projectId: "proj-3", fileName: "thesis.pdf", title: "My Thesis", authors: "Self", year: 2024 },
]

export const citations: Citation[] = [
  {
    id: 1, projectId: "proj-1", start: 0, end: 42,
    reason: "Directly supports the claim about startup growth rates",
    source: { fileName: "xfd.pdf", title: "Hope in startups", authors: "Arda et. al", year: 1999 },
    relevantQuote: "Startups that receive early funding grow 3x faster on average.",
    relevanceExplanation: "This quote directly backs the paragraph's claim about early-stage funding impact.",
  },
  {
    id: 2, projectId: "proj-1", start: 43, end: 110,
    reason: "Provides empirical evidence for the stated market trends",
    source: { fileName: "hello.pdf", title: "A Very Long Title About Markets", authors: "Johnson Watson", year: 2007 },
    relevantQuote: "Market consolidation accelerates when venture capital exceeds $1B in a sector.",
    relevanceExplanation: "The quote corroborates the market trend described in the highlighted span.",
  },
  {
    id: 3, projectId: "proj-2", start: 0, end: 55,
    reason: "Historical precedent for the argument made",
    source: { fileName: "zuko.pdf", title: "", authors: "Marry Jane Sakso", year: 2019 },
    relevantQuote: "Early trade networks followed patterns remarkably similar to modern distribution chains.",
    relevanceExplanation: "Provides historical grounding for the analogy drawn in the paragraph.",
  },
  {
    id: 4, projectId: "proj-3", start: 0, end: 80,
    reason: "Core thesis support",
    source: { fileName: "thesis.pdf", title: "My Thesis", authors: "Self", year: 2024 },
    relevantQuote: "The evidence strongly suggests a causal relationship.",
    relevanceExplanation: "Central claim of the thesis.",
  },
]
