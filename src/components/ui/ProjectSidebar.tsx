import { useState } from "react"
import {
  Box, VStack, Text, IconButton, Button, Input, HStack, Dialog, Portal, CloseButton,
} from "@chakra-ui/react"
import {
  LuChevronLeft, LuChevronRight, LuChevronDown, LuPlus, LuTrash2, LuFileText,
} from "react-icons/lu"
import { useNavigate } from "react-router-dom"
import { projects as initialProjects } from "@/data/mockProjects"
import type { Project } from "@/data/mockProjects"
import { useProjectContext } from "@/context/ProjectContext"

const EXPANDED_WIDTH = "220px"
const COLLAPSED_WIDTH = "48px"

export default function ProjectSidebar() {
  const navigate = useNavigate()
  const { projectId, allDocuments, removeDocument } = useProjectContext()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set([projectId])
  )

  function toggleProjectFiles(id: string) {
    setExpandedProjects((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleCreate() {
    if (!newName.trim()) return
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    }).catch(() => null)
    const id = res?.ok ? (await res.json()).id : `proj-${Date.now()}`
    const created: Project = { id, name: newName.trim() }
    setProjects((prev) => [...prev, created])
    setNewName("")
    setCreating(false)
    navigate(`/projects/${id}`)
  }

  async function handleDelete(project: Project) {
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" }).catch(() => null)
    const remaining = projects.filter((p) => p.id !== project.id)
    setProjects(remaining)
    setDeleteTarget(null)
    if (projectId === project.id) {
      navigate(remaining.length > 0 ? `/projects/${remaining[0].id}` : "/")
    }
  }

  return (
    <>
      <Box
        w={sidebarOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH}
        minW={sidebarOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH}
        borderRight="1px solid"
        borderColor="borderDefault"
        display="flex"
        flexDirection="column"
        transition="width 0.2s, min-width 0.2s"
        overflow="hidden"
        bg="sidebar"
      >
        {/* Header */}
        <HStack
          px="2" py="3"
          justifyContent={sidebarOpen ? "space-between" : "center"}
          borderBottom="1px solid"
          borderColor="borderDefault"
        >
          {sidebarOpen && (
            <Text fontWeight="semibold" fontSize="sm" ml="1" color="fg">
              Projects
            </Text>
          )}
          <IconButton
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            variant="ghost" size="sm"
            onClick={() => setSidebarOpen((e) => !e)}
          >
            {sidebarOpen ? <LuChevronLeft /> : <LuChevronRight />}
          </IconButton>
        </HStack>

        {/* New project button */}
        <Box px="2" py="2" borderBottom="1px solid" borderColor="borderDefault">
          {sidebarOpen ? (
            creating ? (
              <VStack gap="1" align="stretch">
                <Input
                  size="sm" autoFocus placeholder="Project name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleCreate()
                    if (e.key === "Escape") { setCreating(false); setNewName("") }
                  }}
                />
                <HStack gap="1">
                  <Button size="xs" colorPalette="orange" flex="1" onClick={() => void handleCreate()}>Create</Button>
                  <Button size="xs" variant="outline" flex="1" onClick={() => { setCreating(false); setNewName("") }}>Cancel</Button>
                </HStack>
              </VStack>
            ) : (
              <Button size="sm" variant="ghost" w="full" justifyContent="flex-start" onClick={() => setCreating(true)}>
                <LuPlus /> New Project
              </Button>
            )
          ) : (
            <IconButton
              aria-label="New project" variant="ghost" size="sm" w="full"
              onClick={() => { setSidebarOpen(true); setCreating(true) }}
            >
              <LuPlus />
            </IconButton>
          )}
        </Box>

        {/* Project list */}
        <VStack gap="0" align="stretch" flex="1" overflowY="auto" py="1">
          {projects.map((project) => {
            const isActive = project.id === projectId
            const isFilesOpen = expandedProjects.has(project.id)
            const projectDocs = allDocuments.filter((d) => d.projectId === project.id)

            return (
              <Box key={project.id}>
                <HStack
                  px="2" py="1.5"
                  cursor="pointer"
                  bg={isActive ? "bg.subtle" : "transparent"}
                  borderRadius="md" mx="1" gap="1"
                  justifyContent={sidebarOpen ? "space-between" : "center"}
                  _hover={{ bg: "bg.subtle" }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  {sidebarOpen ? (
                    <>
                      <IconButton
                        aria-label="Toggle files"
                        variant="ghost" size="2xs"
                        onClick={(e) => { e.stopPropagation(); toggleProjectFiles(project.id) }}
                      >
                        {isFilesOpen ? <LuChevronDown /> : <LuChevronRight />}
                      </IconButton>
                      <Text fontSize="sm" fontWeight={isActive ? "semibold" : "normal"} flex="1" truncate>
                        {project.name}
                      </Text>
                      <IconButton
                        aria-label="Delete project" variant="ghost" size="2xs"
                        colorPalette="red"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(project) }}
                      >
                        <LuTrash2 />
                      </IconButton>
                    </>
                  ) : (
                    <Box w="8px" h="8px" borderRadius="full" bg={isActive ? "orange.500" : "gray.300"} />
                  )}
                </HStack>

                {/* File list under project — only shown for active project */}
                {sidebarOpen && isFilesOpen && (
                  <VStack gap="0" align="stretch" pl="6" pr="2" pb="1">
                    {projectDocs.length === 0 && (
                      <Text fontSize="xs" color="textSecondary" px="2" py="1">No files yet</Text>
                    )}
                    {projectDocs.map((doc) => (
                      <FileRow
                        key={doc.id}
                        fileName={doc.fileName}
                        onDelete={() => removeDocument(doc.id)}
                      />
                    ))}
                  </VStack>
                )}
              </Box>
            )
          })}
        </VStack>
      </Box>

      {/* Delete project dialog */}
      <Dialog.Root
        role="alertdialog"
        open={!!deleteTarget}
        onOpenChange={(e) => { if (!e.open) setDeleteTarget(null) }}
        size="sm"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header><Dialog.Title>Delete project?</Dialog.Title></Dialog.Header>
              <Dialog.Body>
                <Text>Delete "{deleteTarget?.name}"? This cannot be undone.</Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                </Dialog.ActionTrigger>
                <Button colorPalette="red" onClick={() => deleteTarget && void handleDelete(deleteTarget)}>Delete</Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}

function FileRow({ fileName, onDelete }: { fileName: string; onDelete: () => void }) {
  return (
    <HStack
      px="2" py="1" borderRadius="md" gap="1.5"
      _hover={{ bg: "bg.subtle" }}
      role="group"
    >
      <LuFileText size={12} color="var(--chakra-colors-textSecondary)" />
      <Text fontSize="xs" flex="1" truncate color="fg.muted">{fileName}</Text>
      <IconButton
        aria-label="Delete file" variant="ghost" size="2xs"
        colorPalette="red"
        onClick={onDelete}
      >
        <LuTrash2 />
      </IconButton>
    </HStack>
  )
}
