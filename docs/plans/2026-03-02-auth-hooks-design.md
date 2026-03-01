# Auth Hooks Design

## Overview

Add Firebase authentication to the app via a single `useAuth` hook. Supports email/password and Google SSO (popup flow). Forms own redirect logic; the hook owns only Firebase calls and loading/error state.

## Architecture

### `src/hooks/useAuth.ts`

A single hook exposing three auth methods plus shared state.

**Returns:**
- `signUpWithEmail(email, password): Promise<User | null>`
- `signInWithEmail(email, password): Promise<User | null>`
- `signInWithGoogle(): Promise<User | null>`
- `loading: boolean` — true while any Firebase call is in flight
- `error: string | null` — human-readable Firebase error message, null on success

**Dependencies:**
- `src/lib/firebase.tsx` — imports `auth` singleton
- `firebase/auth` — `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signInWithPopup`, `GoogleAuthProvider`

## Data Flow

```
Form (SignupForm / LoginForm)
  └── calls useAuth() method
        └── Firebase SDK call
              ├── success → returns User, clears error
              └── failure → sets error string, returns null

Form
  ├── on User returned → useNavigate() to /projects/:id
  └── on null returned → renders error inline below submit button
```

## Error Handling

Firebase error codes are mapped to human-readable strings inside the hook. The form renders `error` as a `<Text color="red">` below the submit button. The button is disabled while `loading` is true.

## Google Flow

Uses `signInWithPopup` with `GoogleAuthProvider` — no redirect handling required. Works for both new and existing Google users (Firebase handles both cases with the same call).

## Files Affected

| File | Change |
|---|---|
| `src/hooks/useAuth.ts` | Create — auth hook |
| `src/components/ui/loginComponents/SignupForm.tsx` | Wire up `signUpWithEmail` + `signInWithGoogle` + redirect |
| `src/components/ui/loginComponents/LoginForm.tsx` | Wire up `signInWithEmail` + `signInWithGoogle` + redirect |
