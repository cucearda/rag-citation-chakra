# Auth Hooks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `useAuth` hook with email/password and Google SSO support, wired into SignupForm and LoginForm.

**Architecture:** A single `useAuth` hook wraps Firebase auth calls and exposes `loading` and `error` state. Forms call the hook methods, own their own redirect logic via `useNavigate`, and render errors inline.

**Tech Stack:** Firebase 12, React 19, React Router 7, TypeScript

---

### Task 1: Create `useAuth` hook

**Files:**
- Create: `src/hooks/useAuth.ts`

**Step 1: Create the hooks directory and file**

```bash
mkdir -p src/hooks
```

**Step 2: Write `src/hooks/useAuth.ts`**

```ts
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

function getErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed. Please try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signUpWithEmail(email: string, password: string): Promise<User | null> {
    setLoading(true);
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(getErrorMessage(code));
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function signInWithEmail(email: string, password: string): Promise<User | null> {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(getErrorMessage(code));
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle(): Promise<User | null> {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(getErrorMessage(code));
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { signUpWithEmail, signInWithEmail, signInWithGoogle, loading, error };
}
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 4: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "feat: add useAuth hook with email and Google SSO"
```

---

### Task 2: Wire `useAuth` into `SignupForm`

**Files:**
- Modify: `src/components/ui/loginComponents/SignupForm.tsx`

**Step 1: Update SignupForm**

Replace the existing `SignupForm` component body with the following. The `FloatingLabelInput` component and `floatingStyles` at the top of the file stay unchanged — only update imports and the `SignupForm` function itself.

Add to imports:
```ts
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { projects } from "@/data/mockProjects";
```

Replace the `SignupForm` function:
```tsx
export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { signUpWithEmail, signInWithGoogle, loading, error } = useAuth();
  const navigate = useNavigate();

  const firstProjectPath =
    projects.length > 0 ? `/projects/${projects[0].id}` : "/";

  async function handleEmailSignup() {
    if (password !== confirmPassword) return;
    const user = await signUpWithEmail(email, password);
    if (user) navigate(firstProjectPath);
  }

  async function handleGoogleSignup() {
    const user = await signInWithGoogle();
    if (user) navigate(firstProjectPath);
  }

  return (
    <Stack
      flexDirection="column"
      mb="2"
      justifyContent="center"
      alignItems="center"
      w="full"
      maxW="sm"
      gap="6"
    >
      <Heading color="teal.400">Create Account</Heading>

      <Stack w="full" gap="5">
        <Field.Root>
          <FloatingLabelInput
            label="Email"
            type="email"
            onValueChange={setEmail}
          />
        </Field.Root>

        <Field.Root>
          <FloatingLabelInput
            label="Password"
            type="password"
            onValueChange={setPassword}
          />
        </Field.Root>

        <Field.Root>
          <FloatingLabelInput
            label="Confirm Password"
            type="password"
            onValueChange={setConfirmPassword}
          />
        </Field.Root>

        {error && (
          <Text textStyle="sm" color="red.400">
            {error}
          </Text>
        )}

        <Button
          colorPalette="teal"
          w="full"
          size="lg"
          onClick={handleEmailSignup}
          loading={loading}
          disabled={password !== confirmPassword || loading}
        >
          Sign Up
        </Button>
      </Stack>

      <Stack direction="row" align="center" w="full">
        <Separator flex="1" />
        <Text textStyle="sm" color="fg.muted" whiteSpace="nowrap">
          or continue with
        </Text>
        <Separator flex="1" />
      </Stack>

      <Button
        variant="outline"
        w="full"
        size="lg"
        gap="3"
        onClick={handleGoogleSignup}
        loading={loading}
        disabled={loading}
      >
        <FcGoogle size={20} />
        Sign up with Google
      </Button>

      <Text textStyle="sm" color="fg.muted">
        Already have an account?{" "}
        <Link to="/login">
          <Text as="span" color="teal.400" fontWeight="semibold">
            Sign in
          </Text>
        </Link>
      </Text>
    </Stack>
  );
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Manual smoke test**

```bash
npm run dev
```

- Navigate to `/signup`
- Try submitting with mismatched passwords — button should remain disabled
- Try submitting with a valid email and password — should redirect to first project on success
- Try submitting with an already-registered email — should show inline error

**Step 4: Commit**

```bash
git add src/components/ui/loginComponents/SignupForm.tsx
git commit -m "feat: wire useAuth into SignupForm"
```

---

### Task 3: Wire `useAuth` into `LoginForm`

**Files:**
- Modify: `src/components/ui/loginComponents/LoginForm.tsx`

**Step 1: Update LoginForm**

Add to imports:
```ts
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { projects } from "@/data/mockProjects";
```

Replace the `LoginForm` function:
```tsx
export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signInWithEmail, signInWithGoogle, loading, error } = useAuth();
  const navigate = useNavigate();

  const firstProjectPath =
    projects.length > 0 ? `/projects/${projects[0].id}` : "/";

  async function handleEmailLogin() {
    const user = await signInWithEmail(email, password);
    if (user) navigate(firstProjectPath);
  }

  async function handleGoogleLogin() {
    const user = await signInWithGoogle();
    if (user) navigate(firstProjectPath);
  }

  return (
    <Stack
      flexDirection="column"
      mb="2"
      justifyContent="center"
      alignItems="center"
      w="full"
      maxW="sm"
      gap="6"
    >
      <Heading color="teal.400">Welcome</Heading>

      <Stack w="full" gap="5">
        <Field.Root>
          <FloatingLabelInput
            label="Email"
            type="email"
            onValueChange={setEmail}
          />
        </Field.Root>

        <Field.Root>
          <FloatingLabelInput
            label="Password"
            type="password"
            onValueChange={setPassword}
          />
        </Field.Root>

        {error && (
          <Text textStyle="sm" color="red.400">
            {error}
          </Text>
        )}

        <Button
          colorPalette="teal"
          w="full"
          size="lg"
          onClick={handleEmailLogin}
          loading={loading}
          disabled={loading}
        >
          Sign In
        </Button>
      </Stack>

      <Stack direction="row" align="center" w="full">
        <Separator flex="1" />
        <Text textStyle="sm" color="fg.muted" whiteSpace="nowrap">
          or continue with
        </Text>
        <Separator flex="1" />
      </Stack>

      <Button
        variant="outline"
        w="full"
        size="lg"
        gap="3"
        onClick={handleGoogleLogin}
        loading={loading}
        disabled={loading}
      >
        <FcGoogle size={20} />
        Sign in with Google
      </Button>

      <Text textStyle="sm" color="fg.muted">
        Do not have an account yet?{" "}
        <Link to="/signup">
          <Text as="span" color="teal.400" fontWeight="semibold">
            Sign up
          </Text>
        </Link>
      </Text>
    </Stack>
  );
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Manual smoke test**

- Navigate to `/login`
- Try signing in with wrong credentials — should show "Invalid email or password."
- Try signing in with valid credentials — should redirect to first project
- Try Google sign-in — popup should open, redirect on success

**Step 4: Commit**

```bash
git add src/components/ui/loginComponents/LoginForm.tsx
git commit -m "feat: wire useAuth into LoginForm"
```
