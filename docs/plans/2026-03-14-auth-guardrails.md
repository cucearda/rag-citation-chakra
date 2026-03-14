# Auth Guardrails + Navbar User State Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Firebase auth-aware route protection and update the Navbar to show user email + logout when logged in.

**Architecture:** A new `AuthContext` wraps the app via `onAuthStateChanged`, providing reactive `currentUser`, `authLoading`, and `signOut`. A `ProtectedRoute` component gates the main routes. The Navbar conditionally renders based on `currentUser`.

**Tech Stack:** React 19, Firebase 12, React Router 7, Chakra UI 3, TypeScript, Vite

---

### Task 1: Create AuthContext

**Files:**
- Create: `src/context/AuthContext.tsx`

**Step 1: Create the file**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"

interface AuthContextValue {
  currentUser: User | null
  authLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

  async function signOut() {
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ currentUser, authLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider")
  return ctx
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

**Step 3: Commit**

```bash
git add src/context/AuthContext.tsx
git commit -m "feat: add AuthContext with onAuthStateChanged"
```

---

### Task 2: Wrap the app with AuthProvider

**Files:**
- Modify: `src/App.tsx`

**Step 1: Update App.tsx**

Import `AuthProvider` and wrap `RouterProvider`:

```tsx
import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import RootLayout from './layouts/root-layout'
import ProjectLayout from './layouts/project-layout'
import LoginLayout from './layouts/login-layout'
import SignupLayout from './layouts/signup-layout'
import ConversationView from './components/ui/ConversationView'
import { AuthProvider } from './context/AuthContext'

const router = createBrowserRouter([
  { path: '/login', element: <LoginLayout /> },
  { path: '/signup', element: <SignupLayout /> },
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: null },
      {
        path: 'projects/:projectId',
        element: <ProjectLayout />,
        children: [{ index: true, element: <ConversationView /> }],
      },
    ],
  },
])

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wrap app with AuthProvider"
```

---

### Task 3: Create ProtectedRoute component

**Files:**
- Create: `src/components/ui/ProtectedRoute.tsx`

**Step 1: Create the file**

```tsx
import { Navigate, Outlet } from "react-router-dom"
import { Center, Spinner } from "@chakra-ui/react"
import { useAuthContext } from "@/context/AuthContext"

export default function ProtectedRoute() {
  const { currentUser, authLoading } = useAuthContext()

  if (authLoading) {
    return (
      <Center flex="1" h="100vh">
        <Spinner size="xl" />
      </Center>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

**Step 3: Commit**

```bash
git add src/components/ui/ProtectedRoute.tsx
git commit -m "feat: add ProtectedRoute component"
```

---

### Task 4: Apply ProtectedRoute to guarded routes in App.tsx

**Files:**
- Modify: `src/App.tsx`

**Step 1: Import and apply ProtectedRoute**

Update the router definition in `App.tsx`. The `'/'` route gets `ProtectedRoute` as its element, and `RootLayout` moves to be a child:

```tsx
import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import RootLayout from './layouts/root-layout'
import ProjectLayout from './layouts/project-layout'
import LoginLayout from './layouts/login-layout'
import SignupLayout from './layouts/signup-layout'
import ConversationView from './components/ui/ConversationView'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ui/ProtectedRoute'

const router = createBrowserRouter([
  { path: '/login', element: <LoginLayout /> },
  { path: '/signup', element: <SignupLayout /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <RootLayout />,
        children: [
          { index: true, element: null },
          {
            path: 'projects/:projectId',
            element: <ProjectLayout />,
            children: [{ index: true, element: <ConversationView /> }],
          },
        ],
      },
    ],
  },
])

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
```

**Step 2: Manually verify route protection**

```bash
npm run dev
```

- Open `http://localhost:5173/` while logged out → should redirect to `/login`
- Open `http://localhost:5173/projects/anything` while logged out → should redirect to `/login`
- Log in → should stay on `/`

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: apply ProtectedRoute to guarded routes"
```

---

### Task 5: Update Navbar to show user state

**Files:**
- Modify: `src/components/ui/Navbar.tsx`

**Step 1: Update Navbar**

```tsx
import { Flex, Heading, Button, Spacer, HStack, Text } from "@chakra-ui/react"
import { useNavigate, Link } from "react-router-dom"
import { useAuthContext } from "@/context/AuthContext"

export default function Navbar() {
  const { currentUser, signOut } = useAuthContext()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate("/login")
  }

  return (
    <Flex as="nav" p="0px" alignItems="center" borderBottom="1px solid" borderColor="gray.300" boxShadow="md">
      <Heading margin="9px" as="h1">Rag Citator</Heading>
      <Spacer />

      <HStack gap="10px">
        {currentUser ? (
          <>
            <Text fontWeight="medium" fontSize="sm">{currentUser.email}</Text>
            <Button variant="plain" fontWeight="bold" onClick={handleLogout}>Logout</Button>
          </>
        ) : (
          <>
            <Button as={Link} to="/login" variant="plain" fontWeight="bold">Login</Button>
            <Button as={Link} to="/signup" colorPalette="green" fontWeight="bold">Sign up</Button>
          </>
        )}
      </HStack>
    </Flex>
  )
}
```

**Step 2: Manually verify Navbar behavior**

```bash
npm run dev
```

- While logged out on `/login`: Navbar shows Login + Sign up buttons
- After logging in and landing on `/`: Navbar shows user email + Logout button
- Click Logout: redirects to `/login`, Navbar shows Login + Sign up again

**Step 3: Commit**

```bash
git add src/components/ui/Navbar.tsx
git commit -m "feat: update Navbar to show user email and logout when authenticated"
```

---

### Task 6: Verify full flow end-to-end

**Step 1: Run the app**

```bash
npm run dev
```

**Step 2: Test all scenarios**

| Scenario | Expected |
|---|---|
| Visit `/` logged out | Redirect to `/login` |
| Visit `/projects/abc` logged out | Redirect to `/login` |
| Log in | Stay on app, Navbar shows email + Logout |
| Reload while logged in | Brief spinner, then app loads normally |
| Click Logout | Redirect to `/login`, Navbar shows Login + Sign up |

**Step 3: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors

**Step 4: Final commit if any loose ends**

```bash
git add -A
git commit -m "feat: complete auth guardrails and navbar user state"
```
