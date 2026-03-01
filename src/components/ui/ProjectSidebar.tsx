import { useState } from "react"
import {
  Box,
  VStack,
  Text,
  IconButton,
  Button,
  Input,
  HStack,
  Dialog,
  Portal,
  CloseButton,
} from "@chakra-ui/react"
import { LuChevronLeft, LuChevronRight, LuPlus, LuTrash2 } from "react-icons/lu"
import { useParams, useNavigate } from "react-router-dom"
import { projects as initialProjects } from "@/data/mockProjects"
import type { Project } from "@/data/mockProjects"

export default function ProjectSidebar() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(true)
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)

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

  const EXPANDED_WIDTH = "220px"
  const COLLAPSED_WIDTH = "48px"

  return (
    <>
      <Box
        w={expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH}
        minW={expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH}
        borderRight="1px solid"
        borderColor="gray.200"
        display="flex"
        flexDirection="column"
        transition="width 0.2s, min-width 0.2s"
        overflow="hidden"
        bg="bg"
      >
        {/* Header */}
        <HStack
          px="2"
          py="3"
          justifyContent={expanded ? "space-between" : "center"}
          borderBottom="1px solid"
          borderColor="gray.200"
        >
          {expanded && (
            <Text fontWeight="bold" fontSize="sm" ml="1">
              Projects
            </Text>
          )}
          <IconButton
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? <LuChevronLeft /> : <LuChevronRight />}
          </IconButton>
        </HStack>

        {/* New project button */}
        <Box px="2" py="2" borderBottom="1px solid" borderColor="gray.100">
          {expanded ? (
            creating ? (
              <VStack gap="1" align="stretch">
                <Input
                  size="sm"
                  autoFocus
                  placeholder="Project name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate()
                    if (e.key === "Escape") { setCreating(false); setNewName("") }
                  }}
                />
                <HStack gap="1">
                  <Button size="xs" colorPalette="green" flex="1" onClick={handleCreate}>
                    Create
                  </Button>
                  <Button size="xs" variant="outline" flex="1" onClick={() => { setCreating(false); setNewName("") }}>
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <Button size="sm" variant="outline" w="full" onClick={() => setCreating(true)}>
                <LuPlus /> New Project
              </Button>
            )
          ) : (
            <IconButton
              aria-label="New project"
              variant="ghost"
              size="sm"
              w="full"
              onClick={() => { setExpanded(true); setCreating(true) }}
            >
              <LuPlus />
            </IconButton>
          )}
        </Box>

        {/* Project list */}
        <VStack gap="0" align="stretch" flex="1" overflowY="auto" py="1">
          {projects.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              active={project.id === projectId}
              expanded={expanded}
              onSelect={() => navigate(`/projects/${project.id}`)}
              onDelete={() => setDeleteTarget(project)}
            />
          ))}
        </VStack>
      </Box>

      {/* Delete confirmation dialog */}
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
              <Dialog.Header>
                <Dialog.Title>Delete project?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  Delete "{deleteTarget?.name}"? This cannot be undone.
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button colorPalette="red" onClick={() => deleteTarget && handleDelete(deleteTarget)}>
                  Delete
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}

interface ProjectItemProps {
  project: Project
  active: boolean
  expanded: boolean
  onSelect: () => void
  onDelete: () => void
}

function ProjectItem({ project, active, expanded, onSelect, onDelete }: ProjectItemProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <HStack
      px="2"
      py="2"
      cursor="pointer"
      bg={active ? "colorPalette.subtle" : hovered ? "bg.subtle" : "transparent"}
      colorPalette="blue"
      borderRadius="md"
      mx="1"
      gap="2"
      justifyContent={expanded ? "space-between" : "center"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      {expanded ? (
        <>
          <Text
            fontSize="sm"
            fontWeight={active ? "semibold" : "normal"}
            truncate
            flex="1"
          >
            {project.name}
          </Text>
          {hovered && (
            <IconButton
              aria-label="Delete project"
              variant="ghost"
              size="xs"
              colorPalette="red"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
            >
              <LuTrash2 />
            </IconButton>
          )}
        </>
      ) : (
        <Box
          w="8px"
          h="8px"
          borderRadius="full"
          bg={active ? "colorPalette.solid" : "gray.300"}
        />
      )}
    </HStack>
  )
}
