import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"

const mockSocket = { on: vi.fn(), disconnect: vi.fn() }
const mockIo = vi.fn(() => mockSocket)

vi.mock("socket.io-client", () => ({ io: (...args: unknown[]) => mockIo(...args) }))

interface MockAuth { token: string | null }
const mockAuth = vi.hoisted((): MockAuth => ({ token: "test-ws-token" }))

vi.mock("@/context/auth-context", () => ({
  useAuth: () => mockAuth,
}))

describe("useWebSocket", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.token = "test-ws-token"
    mockSocket.on.mockReset()
    mockSocket.disconnect.mockReset()
    mockSocket.on.mockImplementation((event: string, cb: () => void) => {
      if (event === 'connect') cb()
      return mockSocket
    })
  })

  it("connects when token is present", async () => {
    mockAuth.token = "test-ws-token"
    const { useWebSocket } = await import("@/hooks/use-websocket")
    const { result } = renderHook(() => useWebSocket())

    expect(mockIo).toHaveBeenCalledTimes(1)
    expect(mockIo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ auth: { token: "test-ws-token" }, reconnection: true })
    )
    expect(result.current.connected).toBe(true)
  })

  it("returns null socket when no token", async () => {
    mockAuth.token = null
    const { useWebSocket } = await import("@/hooks/use-websocket")
    const { result } = renderHook(() => useWebSocket())

    expect(mockIo).not.toHaveBeenCalled()
    expect(result.current.socket).toBeNull()
    expect(result.current.connected).toBe(false)
  })

  it("disconnects on unmount", async () => {
    mockAuth.token = "test-ws-token"
    const { useWebSocket } = await import("@/hooks/use-websocket")
    const { unmount } = renderHook(() => useWebSocket())

    act(() => unmount())
    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1)
  })
})
