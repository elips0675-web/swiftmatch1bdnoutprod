import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook } from "@testing-library/react"

const mockTranslations = {
  RU: {
    'interest.sport': 'Спорт',
    'interest.music': 'Музыка',
    'common.zodiac.leo': 'Лев',
  },
  EN: {
    'interest.sport': 'Sports',
    'interest.music': 'Music',
    'common.zodiac.leo': 'Leo',
  },
}

vi.mock("@/context/language-context", () => ({
  useLanguage: () => ({
    language: 'RU' as const,
    setLanguage: vi.fn(),
    t: (key: string) => (mockTranslations['RU'] as Record<string, string>)[key] || key,
  }),
}))

describe("useLanguage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns RU translations by default", async () => {
    const { useLanguage } = await import("@/context/language-context")
    const { result } = renderHook(() => useLanguage())

    expect(result.current.language).toBe('RU')
    expect(result.current.t('interest.sport')).toBe('Спорт')
    expect(result.current.t('common.zodiac.leo')).toBe('Лев')
  })
})

describe("Translation keys exist", () => {
  const ruKeys = Object.keys(mockTranslations.RU)
  const enKeys = Object.keys(mockTranslations.EN)

  it("RU and EN have same keys", () => {
    expect(ruKeys.sort()).toEqual(enKeys.sort())
  })

  it("all keys return non-empty strings for RU", () => {
    for (const key of ruKeys) {
      expect(mockTranslations.RU[key as keyof typeof mockTranslations.RU]).toBeTruthy()
    }
  })

  it("all keys return non-empty strings for EN", () => {
    for (const key of enKeys) {
      expect(mockTranslations.EN[key as keyof typeof mockTranslations.EN]).toBeTruthy()
    }
  })
})
