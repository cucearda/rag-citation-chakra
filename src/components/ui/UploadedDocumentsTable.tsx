import { Table } from "@chakra-ui/react"

const items = [
  { id: 1, fileName: "xfd.pdf", title:"Hope in startups",authors: "Arda et. al", year: 1999 },
  { id: 2, fileName: "hello.pdf", title: "a VeryVery VeryVery VeryVery VeryVery VeryVery Long Title",authors: "Johnson Watson", year: 2007 },
  { id: 3, fileName: "zuko.pdf", title:"", authors: "Marry Jane Sakso", year: 1453 },
    { id: 1, fileName: "xfd.pdf", title:"Hope in startups",authors: "Arda et. al", year: 1999 },
  { id: 2, fileName: "hello.pdf", title: "a VeryVery VeryVery VeryVery VeryVery VeryVery Long Title",authors: "Johnson Watson", year: 2007 },
  { id: 3, fileName: "zuko.pdf", title:"", authors: "Marry Jane Sakso", year: 1453 },  { id: 1, fileName: "xfd.pdf", title:"Hope in startups",authors: "Arda et. al", year: 1999 },
  { id: 2, fileName: "hello.pdf", title: "a VeryVery VeryVery VeryVery VeryVery VeryVery Long Title",authors: "Johnson Watson", year: 2007 },
  { id: 3, fileName: "zuko.pdf", title:"", authors: "Marry Jane Sakso", year: 1453 },
]

export default function UploadedDocumentsTable() {
  return (
    <Table.Root size="sm" striped>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader fontWeight="bold">File Name</Table.ColumnHeader>
          <Table.ColumnHeader  fontWeight="bold">Title</Table.ColumnHeader>
          <Table.ColumnHeader  fontWeight="bold">Authors</Table.ColumnHeader>
          <Table.ColumnHeader  fontWeight="bold" textAlign="end">Year</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map((item) => (
          <Table.Row key={item.id}>
            <Table.Cell>{item.fileName}</Table.Cell>
            <Table.Cell>{item.title}</Table.Cell>
            <Table.Cell>{item.authors}</Table.Cell>
            <Table.Cell textAlign="end">{item.year}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}
