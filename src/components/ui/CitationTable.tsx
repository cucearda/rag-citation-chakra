import { Table } from "@chakra-ui/react"

interface CitationSource {
  fileName: string
  title: string
  authors: string
  year: number
}

interface Citation {
  id: number
  start: number
  end: number
  reason: string
  source: CitationSource
  relevantQuote: string
  relevanceExplanation: string
}

const items: Citation[] = [
  {
    id: 1,
    start: 0,
    end: 42,
    reason: "Directly supports the claim about startup growth rates",
    source: { fileName: "xfd.pdf", title: "Hope in startups", authors: "Arda et. al", year: 1999 },
    relevantQuote: "Startups that receive early funding grow 3x faster on average.",
    relevanceExplanation: "This quote directly backs the paragraph's claim about early-stage funding impact.",
  },
  {
    id: 2,
    start: 43,
    end: 110,
    reason: "Provides empirical evidence for the stated market trends",
    source: { fileName: "hello.pdf", title: "A Very Long Title About Markets", authors: "Johnson Watson", year: 2007 },
    relevantQuote: "Market consolidation accelerates when venture capital exceeds $1B in a sector.",
    relevanceExplanation: "The quote corroborates the market trend described in the highlighted span.",
  },
  {
    id: 3,
    start: 111,
    end: 200,
    reason: "Historical precedent for the argument made",
    source: { fileName: "zuko.pdf", title: "", authors: "Marry Jane Sakso", year: 1453 },
    relevantQuote: "Early trade networks followed patterns remarkably similar to modern distribution chains.",
    relevanceExplanation: "Provides historical grounding for the analogy drawn in the paragraph.",
  },
    {
    id: 1,
    start: 0,
    end: 42,
    reason: "Directly supports the claim about startup growth rates",
    source: { fileName: "xfd.pdf", title: "Hope in startups", authors: "Arda et. al", year: 1999 },
    relevantQuote: "Startups that receive early funding grow 3x faster on average.",
    relevanceExplanation: "This quote directly backs the paragraph's claim about early-stage funding impact.",
  },
  {
    id: 2,
    start: 43,
    end: 110,
    reason: "Provides empirical evidence for the stated market trends",
    source: { fileName: "hello.pdf", title: "A Very Long Title About Markets", authors: "Johnson Watson", year: 2007 },
    relevantQuote: "Market consolidation accelerates when venture capital exceeds $1B in a sector.",
    relevanceExplanation: "The quote corroborates the market trend described in the highlighted span.",
  },
  {
    id: 3,
    start: 111,
    end: 200,
    reason: "Historical precedent for the argument made",
    source: { fileName: "zuko.pdf", title: "", authors: "Marry Jane Sakso", year: 1453 },
    relevantQuote: "Early trade networks followed patterns remarkably similar to modern distribution chains.",
    relevanceExplanation: "Provides historical grounding for the analogy drawn in the paragraph.",
  },
    {
    id: 1,
    start: 0,
    end: 42,
    reason: "Directly supports the claim about startup growth rates",
    source: { fileName: "xfd.pdf", title: "Hope in startups", authors: "Arda et. al", year: 1999 },
    relevantQuote: "Startups that receive early funding grow 3x faster on average.",
    relevanceExplanation: "This quote directly backs the paragraph's claim about early-stage funding impact.",
  },
  {
    id: 2,
    start: 43,
    end: 110,
    reason: "Provides empirical evidence for the stated market trends",
    source: { fileName: "hello.pdf", title: "A Very Long Title About Markets", authors: "Johnson Watson", year: 2007 },
    relevantQuote: "Market consolidation accelerates when venture capital exceeds $1B in a sector.",
    relevanceExplanation: "The quote corroborates the market trend described in the highlighted span.",
  },
  {
    id: 3,
    start: 111,
    end: 200,
    reason: "Historical precedent for the argument made",
    source: { fileName: "zuko.pdf", title: "", authors: "Marry Jane Sakso", year: 1453 },
    relevantQuote: "Early trade networks followed patterns remarkably similar to modern distribution chains.",
    relevanceExplanation: "Provides historical grounding for the analogy drawn in the paragraph.",
  },
]

export default function CitationTable() {
  return (
    <Table.Root size="sm" striped>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader fontWeight="bold">Source</Table.ColumnHeader>
          <Table.ColumnHeader fontWeight="bold">Reason</Table.ColumnHeader>
          <Table.ColumnHeader fontWeight="bold">Relevant Quote</Table.ColumnHeader>
          <Table.ColumnHeader fontWeight="bold">Relevance Explanation</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map((item) => (
          <Table.Row key={item.id}>
            <Table.Cell>
              {item.source.title || item.source.fileName}
              <br />
              <small>{item.source.authors}, {item.source.year}</small>
            </Table.Cell>
            <Table.Cell>{item.reason}</Table.Cell>
            <Table.Cell fontStyle="italic">"{item.relevantQuote}"</Table.Cell>
            <Table.Cell>{item.relevanceExplanation}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}
