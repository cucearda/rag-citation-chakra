# Auth Guardrails + Navbar User State

**Date:** 2026-03-14
**Status:** Approved

## Problem

- Routes `/` and `/projects/:projectId` are unguarded — any unauthenticated user can access them
- The Navbar always shows Login/Sign up buttons regardless of auth state
- There is no reactive current user state in the app (no `onAuthStateChanged` listener)

## Approach: AuthContext

A single `AuthContext` wraps the app, listens to Firebase auth state once via `onAuthStateChanged`, and provides `currentUser`, `authLoading`, and `signOut` to all components.

## Components

### `src/context/AuthContext.tsx` (new)

- Calls `onAuthStateChanged` on mount, stores `currentUser: User | null`
- Tracks `authLoading: boolean` — true until Firebase resolves initial auth state
- Exposes `signOut` (calls `auth.signOut()`)
- Wraps the app at the top level (in `App.tsx` or `main.tsx`)

### `src/components/ui/ProtectedRoute.tsx` (new)

- If `authLoading` → render a centered spinner (prevents flash-redirect on reload)
- If `!currentUser` → `<Navigate to="/login" replace />`
- Otherwise → `<Outlet />`
- Applied to the `'/'` route in `App.tsx`, covering all children

### `src/components/ui/Navbar.tsx` (update)

- Reads `currentUser` from `AuthContext`
- **Logged out**: Login button (links to `/login`) + Sign up button (links to `/signup`)
- **Logged in**: display `currentUser.email` as text + Logout button (calls `signOut`, navigates to `/login`)

### `src/hooks/useAuth.ts` (no change)

Existing hook handles sign-in/sign-up actions and stays as-is.

## Data Flow

```
App.tsx
└── AuthProvider (onAuthStateChanged → currentUser, authLoading, signOut)
    └── RouterProvider
        ├── /login    (public)
        ├── /signup   (public)
        └── ProtectedRoute (checks currentUser)
            └── RootLayout → Navbar (reads currentUser from AuthContext)
                └── /projects/:projectId → ProjectLayout → ConversationView
```

## Error / Edge Cases

- **Page reload while logged in**: `authLoading` is true briefly → spinner shown → Firebase resolves → user stays on page
- **Page reload while logged out**: `authLoading` resolves → redirect to `/login`
- **Token expires / 401**: `apiClient` already redirects to `/login` on 401 (existing behavior, unchanged)
