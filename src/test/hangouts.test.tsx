import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import React from "react"
import { MemoryRouter } from "react-router-dom"

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

vi.mock("@/lib/token", () => ({
  getToken: () => "test-token",
}))

vi.mock("@/hooks/use-websocket", () => ({
  useWebSocket: () => ({ socket: null, connected: false }),
}))

const mockUseLanguage = {
  t: (key: string, options?: Record<string, any>) => {
    let value = (mockTranslations as Record<string, string>)[key] || key
    if (options) {
      Object.entries(options).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, String(v))
      })
    }
    return value
  },
  language: "RU",
  setLanguage: vi.fn(),
}

const mockTranslations: Record<string, string> = {
  "hangout.title": "Куда пойдем",
  "hangout.action.create": "Создать встречу",
  "hangout.filter.all_categories": "Все категории",
  "hangout.filter.radius": "Радиус: {km} км",
  "hangout.category.cinema": "Кино",
  "hangout.empty": "Пока нет активных встреч",
  "hangout.disabled": "Встречи скоро появятся",
  "hangout.disabled_desc": "Эта функция пока выключена. Загляните позже!",
  "hangout.label.companions_count": "{count} из {max}",
  "nav.hangouts": "Встречи",
  "hangout.my_listings": "Мои объявления",
  "hangout.my_responses": "Мои отклики",
  "hangout.empty_my_listings": "Вы еще не создавали встречи",
  "hangout.empty_my_responses": "Вы пока никуда не откликались",
}

vi.mock("@/context/language-context", () => ({
  useLanguage: () => mockUseLanguage,
}))

const mockFlags = { hangoutsEnabled: true }

vi.mock("@/context/feature-flags-context", () => ({
  useFeatureFlags: () => mockFlags,
}))

vi.mock("@/components/layout/app-header", () => ({
  AppHeader: () => <div data-testid="app-header" />,
}))

vi.mock("@/components/navigation/bottom-nav", () => ({
  BottomNav: () => <div data-testid="bottom-nav" />,
}))

const sampleHangouts = [
  {
    id: 1,
    author_id: 10,
    category: "cinema",
    title: "Иду на Дюну",
    description: null,
    place_name: "Аврора",
    place_address: null,
    city: "Москва",
    event_date: new Date(Date.now() + 86_400_000).toISOString(),
    max_companions: 2,
    status: "active",
    display_name: "Максим",
    avatar_url: null,
    accepted_count: 1,
  },
]

function renderPage(ui: React.ReactElement) {
  return render(<MemoryRouter initialEntries={["/"]}>{ui}</MemoryRouter>)
}

describe("HangoutsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    mockFlags.hangoutsEnabled = true
    ;(navigator as any).geolocation = undefined
  })

  it("renders feed with hangout cards", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(sampleHangouts) })
    const HangoutsPage = (await import("@/pages/hangouts")).default

    renderPage(<HangoutsPage />)

    await waitFor(() => {
      expect(screen.getByTestId("hangout-card-1")).toBeTruthy()
    })
    expect(screen.getByText("Иду на Дюну")).toBeTruthy()
  })

  it("filters by category when chip clicked", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
    const HangoutsPage = (await import("@/pages/hangouts")).default

    renderPage(<HangoutsPage />)
    await waitFor(() => {
      expect(screen.getByTestId("hangout-category-chips")).toBeTruthy()
    })

    fireEvent.click(screen.getByTestId("hangout-category-cinema"))

    await waitFor(() => {
      const calls = mockFetch.mock.calls.filter(([url]) => String(url).includes("/api/hangouts"))
      const last = String(calls[calls.length - 1][0])
      expect(last).toContain("category=cinema")
    })
  })

  it("shows disabled state when flag is off", async () => {
    mockFlags.hangoutsEnabled = false
    const HangoutsPage = (await import("@/pages/hangouts")).default

    renderPage(<HangoutsPage />)

    await waitFor(() => {
      expect(screen.getByTestId("hangouts-disabled")).toBeTruthy()
    })
  })

  it("shows empty message when feed is empty", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
    const HangoutsPage = (await import("@/pages/hangouts")).default

    renderPage(<HangoutsPage />)

    await waitFor(() => {
      expect(screen.getByText("Пока нет активных встреч")).toBeTruthy()
    })
  })
})

describe("HangoutsMyPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it("renders tabs and loads listings", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (String(url).includes("/api/hangouts/my")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(sampleHangouts) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })
    const HangoutsMyPage = (await import("@/pages/hangouts-my")).default

    renderPage(<HangoutsMyPage />)

    await waitFor(() => {
      expect(screen.getByTestId("tab-listings")).toBeTruthy()
      expect(screen.getByTestId("my-hangout-1")).toBeTruthy()
    })
  })
})
