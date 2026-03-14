import { auth } from "@/lib/firebase"

const BASE_URL = import.meta.env.VITE_API_URL
if (!BASE_URL) throw new Error("VITE_API_URL is not set")

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser
  const token = user ? await user.getIdToken() : null

  const headers = new Headers(options.headers)
  if (token) headers.set("Authorization", `Bearer ${token}`)
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    window.location.href = "/login"
    throw new Error("Unauthorized")
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail ?? "Request failed")
  }

  return res
}
