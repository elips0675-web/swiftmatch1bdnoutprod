import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { AuthProvider, useAuth } from "@/context/auth-context"
import { type ReactNode } from "react"

vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(() => null),
}))

vi.mock("@/lib/token", () => ({
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
  clearToken: vi.fn(),
}))

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function Wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockReset()
})

describe("AuthContext", () => {
  it("starts in loading state", () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: "demo-token" }),
    })

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })
    expect(result.current.isLoading).toBe(true)
  })

  it("performs dev-login when supabase is absent", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: "demo-token" }),
    })

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isDemo).toBe(true)
    expect(result.current.user).toBeTruthy()
    expect(result.current.user?.name).toBe("Анна")
  })

  it("handles dev-login failure gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"))

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
  })

  it("provides logout function", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: "demo-token" }),
    })

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
  })

  it("provides clearError function", () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: "demo-token" }),
    })

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })
})
