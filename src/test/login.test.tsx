import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderWithProviders } from "./test-utils"
import LoginPage from "@/pages/login"

const mockPush = vi.fn()
const mockBack = vi.fn()

vi.mock("@/shims/next-navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    pathname: "/login",
    query: {},
    replace: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

vi.mock("@/shims/next-link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href?: string; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

const mockToast = vi.hoisted(() => vi.fn())
vi.mock("@/hooks/use-toast", () => ({
  toast: mockToast,
}))

vi.mock("@/lib/token", () => ({
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}))

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockReset()
})

function getByTextContent(text: string): HTMLElement {
  return screen.getByText((content, element) => {
    return element?.textContent?.trim() === text || false
  })
}

describe("LoginPage", () => {
  it("renders login form with all elements", () => {
    renderWithProviders(<LoginPage />)

    expect(getByTextContent("SwiftMatch")).toBeTruthy()
    expect(screen.getByPlaceholderText("Email")).toBeTruthy()
    expect(screen.getByPlaceholderText("Пароль")).toBeTruthy()
    expect(screen.getByText("Продолжить")).toBeTruthy()
    expect(screen.getByText("Забыли пароль?")).toBeTruthy()
    expect(screen.getByText("Войти с Google")).toBeTruthy()
  })

  it("submits login form successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: "test-token", refresh_token: "refresh", email_verified: true }),
    })

    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByPlaceholderText("Email"), "test@test.com")
    await user.type(screen.getByPlaceholderText("Пароль"), "password123")
    await user.click(screen.getByText("Продолжить"))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "test@test.com", password: "password123" }),
      }))
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/")
    })
  })

  it("shows error on failed login", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Invalid credentials" }),
    })

    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByPlaceholderText("Email"), "wrong@test.com")
    await user.type(screen.getByPlaceholderText("Пароль"), "wrong")
    await user.click(screen.getByText("Продолжить"))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: "destructive",
      }))
    })
  })

  it("toggles between phone and email login methods", async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.click(screen.getByText("ТЕЛЕФОН"))
    expect(screen.getByPlaceholderText("+7 (999) 000-00-00")).toBeTruthy()

    await user.click(screen.getByText("Email"))
    expect(screen.getByPlaceholderText("Email")).toBeTruthy()
  })

  it("has link to register page", () => {
    renderWithProviders(<LoginPage />)

    const registerLink = screen.getByText("ЗАРЕГИСТРИРОВАТЬСЯ")
    expect(registerLink.getAttribute("href")).toBe("/register")
  })

  it("has link to forgot password", () => {
    renderWithProviders(<LoginPage />)

    const forgotLink = screen.getByText("Забыли пароль?")
    expect(forgotLink.getAttribute("href")).toBe("/forgot-password")
  })
})
