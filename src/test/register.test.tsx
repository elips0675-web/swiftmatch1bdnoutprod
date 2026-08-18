import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderWithProviders } from "./test-utils"
import RegisterPage from "@/pages/register"

const mockPush = vi.fn()
const mockBack = vi.fn()

vi.mock("@/shims/next-navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    pathname: "/register",
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

describe("RegisterPage", () => {
  it("renders registration form with all elements", () => {
    renderWithProviders(<RegisterPage />)

    expect(getByTextContent("SwiftMatch")).toBeTruthy()
    expect(screen.getByPlaceholderText("Имя")).toBeTruthy()
    expect(screen.getByPlaceholderText("Email")).toBeTruthy()
    expect(screen.getByPlaceholderText("Пароль (мин. 8 символов)")).toBeTruthy()
    expect(screen.getByText("СОЗДАТЬ АККАУНТ")).toBeTruthy()
  })

  it("submits registration form successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    })

    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await user.type(screen.getByPlaceholderText("Имя"), "Test User")
    await user.type(screen.getByPlaceholderText("Email"), "new@test.com")
    await user.type(screen.getByPlaceholderText("Пароль (мин. 8 символов)"), "password123")
    await user.click(screen.getByTestId("age-checkbox"))
    await user.click(screen.getByTestId("consent-checkbox"))
    await user.click(screen.getByText("СОЗДАТЬ АККАУНТ"))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/register", expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "new@test.com", password: "password123", displayName: "Test User", consent: true }),
      }))
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login")
    })
  })

  it("validates name is required", async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await user.type(screen.getByPlaceholderText("Email"), "test@test.com")
    await user.type(screen.getByPlaceholderText("Пароль (мин. 8 символов)"), "password123")
    await user.click(screen.getByText("СОЗДАТЬ АККАУНТ"))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        description: "Имя обязательно",
      }))
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("validates email format", async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await user.type(screen.getByPlaceholderText("Имя"), "Test")
    await user.type(screen.getByPlaceholderText("Email"), "invalid-email")
    await user.type(screen.getByPlaceholderText("Пароль (мин. 8 символов)"), "password123")
    await user.click(screen.getByText("СОЗДАТЬ АККАУНТ"))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        description: "Неверный email",
      }))
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("validates password length", async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await user.type(screen.getByPlaceholderText("Имя"), "Test")
    await user.type(screen.getByPlaceholderText("Email"), "test@test.com")
    await user.type(screen.getByPlaceholderText("Пароль (мин. 8 символов)"), "short")
    await user.click(screen.getByText("СОЗДАТЬ АККАУНТ"))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        description: "Пароль должен быть минимум 8 символов",
      }))
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("blocks submit without consent checkbox", async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await user.type(screen.getByPlaceholderText("Имя"), "Test")
    await user.type(screen.getByPlaceholderText("Email"), "test@test.com")
    await user.type(screen.getByPlaceholderText("Пароль (мин. 8 символов)"), "password123")
    await user.click(screen.getByTestId("age-checkbox"))
    await user.click(screen.getByText("СОЗДАТЬ АККАУНТ"))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        description: "Необходимо согласие на обработку персональных данных",
      }))
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("blocks submit without age confirmation", async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await user.type(screen.getByPlaceholderText("Имя"), "Test")
    await user.type(screen.getByPlaceholderText("Email"), "test@test.com")
    await user.type(screen.getByPlaceholderText("Пароль (мин. 8 символов)"), "password123")
    await user.click(screen.getByText("СОЗДАТЬ АККАУНТ"))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        description: "Подтвердите, что вам есть 18 лет",
      }))
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("shows error on failed registration", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Email already in use" }),
    })

    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await user.type(screen.getByPlaceholderText("Имя"), "Test")
    await user.type(screen.getByPlaceholderText("Email"), "exists@test.com")
    await user.type(screen.getByPlaceholderText("Пароль (мин. 8 символов)"), "password123")
    await user.click(screen.getByText("СОЗДАТЬ АККАУНТ"))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: "destructive",
      }))
    })
  })

  it("has link to login page", () => {
    renderWithProviders(<RegisterPage />)

    const loginLink = screen.getByText("ВОЙТИ")
    expect(loginLink.getAttribute("href")).toBe("/login")
  })
})
