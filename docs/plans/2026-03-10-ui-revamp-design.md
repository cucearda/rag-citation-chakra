# UI Revamp Design — Claude Chat Style
**Date:** 2026-03-10

## Goal
Revamp the UI to match the Claude chat aesthetic: collapsible sidebar with nested file lists per project, and a single conversation thread replacing the four-panel layout.

---

## Design System (Chakra theme extension)

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `bg.canvas` | `#F7F7F5` | Main chat background |
| `bg.sidebar` | `#F0EFEB` | Sidebar background |
| `bg.userBubble` | `#2F2F2F` | User message pill |
| `bg.hover` | `rgba(0,0,0,0.04)` | Row hover state |
| `border.default` | `#E5E4DF` | Dividers, card borders |
| `text.primary` | `#1A1A1A` | Body text |
| `text.secondary` | `#6B6B6B` | Labels, metadata |
| `text.inverse` | `#FFFFFF` | Text on dark bubble |

### Typography
- Font family: `"Inter", system-ui, sans-serif`
- Base size: `14px`, line-height: `1.6`
- Secondary/meta: `13px`, color `text.secondary`

### Spacing
4px grid: `space.1=4px`, `space.2=8px`, `space.3=12px`, `space.4=16px`, `space.5=20px`, `space.6=24px`

### Border Radii
- `sm: 6px` — file rows, citation cards
- `md: 10px` — input bar
- `lg: 18px` — message bubbles
- `full: 9999px` — icon buttons

---

## Layout

### Sidebar (left, collapsible)
- **Expanded width:** 220px | **Collapsed:** 48px
- **Header:** "Projects" label + collapse toggle (`LuChevronLeft` / `LuChevronRight`)
- **New Project button:** full-width outline button; collapses to `LuPlus` icon button
- **Project rows:** clicking navigates to project; chevron (`LuChevronRight` / `LuChevronDown`) expands/collapses file list
- **File rows (nested):** filename only + trash icon on hover; new uploads from input bar appear here; delete removes from list
- **Collapsed state:** dot indicators for projects, no file list

### Main Area — Conversation View
Replaces `CompleteWorkstation`, `WorkPanel`, `ResultsPanel`.

#### Scroll area (flex: 1, overflow-y: auto)
- **Empty state:** centered heading (project name) + subtitle "Submit a paragraph to get cited results"
- **User message:** right-aligned dark pill, max-width 70%, `radius.lg`
- **AI message:** left-aligned, no background, full readable width
  - Cited paragraph text at top
  - `CitationCard` components below (one per citation)

#### CitationCard
Subtle bordered box (`border.default`, `radius.sm`) containing:
- Top row: `📎 filename · year · authors` (13px, secondary)
- Body: relevant quote in italic
- Footer: reason label (xs, secondary)

#### Input bar (fixed bottom, separated by top border)
- Auto-growing `Textarea` (1–4 lines), placeholder "Reply..."
- Left: `LuPaperclip` icon button → triggers file upload
- Right: send `IconButton` — gray when empty, `colorPalette="orange"` when has text

---

## Component Map

| Old Component | New Component | Notes |
|---------------|---------------|-------|
| `CompleteWorkstation` | `ConversationView` | New top-level wrapper |
| `WorkPanel` | _(removed)_ | Absorbed into ConversationView |
| `ResultsPanel` | _(removed)_ | Absorbed into ConversationView |
| `ParagraphField` | `ChatInputBar` | Restyled, same core logic |
| `ResultTextField` | AI message bubble | Inline in thread |
| `CitationTable` | `CitationCard` | One card per citation, inline |
| `UploadedDocumentsTable` | `ProjectFileList` | Moved into sidebar |
| `ProjectSidebar` | `ProjectSidebar` (updated) | Add file list + per-project expand |

---

## State Changes
- `ProjectSidebar` gains `expandedProjects: Set<string>` to track which project's files are open
- `ProjectSidebar` gains `documents` state (from `mockProjects`) filtered by `projectId`, with add/delete
- `ConversationView` holds `messages: Message[]` where each message is `{ role: 'user' | 'ai', content: string, citations?: Citation[] }`
- On submit: push user message, then push mock AI response with citations

---

## Files to Create
- `src/components/ui/ConversationView.tsx`
- `src/components/ui/ChatInputBar.tsx`
- `src/components/ui/CitationCard.tsx`
- `src/theme/index.ts` — Chakra theme extension

## Files to Update
- `src/components/ui/ProjectSidebar.tsx` — add file list, per-project expand/collapse
- `src/layouts/project-layout.tsx` — swap `CompleteWorkstation` outlet for `ConversationView`

## Files to Delete
- `src/components/ui/CompleteWorkstation.tsx`
- `src/components/ui/WorkPanel.tsx`
- `src/components/ui/ResultsPanel.tsx`
- `src/components/ui/ParagraphField.tsx`
- `src/components/ui/ResultTextField.tsx`
- `src/components/ui/CitationTable.tsx`
- `src/components/ui/UploadedDocumentsTable.tsx`
