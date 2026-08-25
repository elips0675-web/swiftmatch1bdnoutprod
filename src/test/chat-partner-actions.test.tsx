import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import React from "react"

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

vi.mock("@/lib/token", () => ({
  getToken: () => "test-token",
}))

const mockUseLanguage = {
  t: (key: string) => key,
  language: "RU",
  setLanguage: vi.fn(),
}

vi.mock("@/context/language-context", () => ({
  useLanguage: () => mockUseLanguage,
}))

const sampleOffers = [
  { id: 1, partner_name: "Yandex Go", category: "taxi", title: "Такси", description: "d" },
  { id: 2, partner_name: "Afisha", category: "cinema", title: "Кино", description: null },
]

import { ChatPartnerActions } from "@/components/chat/chat-partner-actions"

describe("ChatPartnerActions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    vi.stubGlobal("open", vi.fn())
  })

  it("renders chips for placement offers", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(sampleOffers) })

    render(<ChatPartnerActions placement="chat" />)

    await waitFor(() => {
      expect(screen.getByTestId("partner-action-taxi")).toBeTruthy()
      expect(screen.getByTestId("partner-action-cinema")).toBeTruthy()
    })
    expect(String(mockFetch.mock.calls[0][0])).toContain("placement=chat")
  })

  it("tracks click and opens http deeplink", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([sampleOffers[0]]) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ deeplink: "https://x.ru/?utm_source=swiftmatch&ref=ABC" }),
      })

    render(<ChatPartnerActions />)
    await waitFor(() => expect(screen.getByTestId("partner-action-taxi")).toBeTruthy())

    fireEvent.click(screen.getByTestId("partner-action-taxi"))

    await waitFor(() => {
      const trackCall = mockFetch.mock.calls.find(([url]) => String(url).includes("/api/partners/track"))
      expect(trackCall).toBeTruthy()
      expect(JSON.parse(trackCall![1].body)).toEqual({ offer_id: 1 })
      expect(window.open).toHaveBeenCalledWith(
        "https://x.ru/?utm_source=swiftmatch&ref=ABC",
        "_blank",
        "noopener",
      )
    })
  })

  it("renders nothing when no offers", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })

    const { container } = render(<ChatPartnerActions />)

    await waitFor(() => {
      expect(screen.queryByTestId("partner-actions")).toBeNull()
      expect(container.textContent).toBe("")
    })
  })
})
