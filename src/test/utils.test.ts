import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"
import { getUserTitles } from "@/lib/utils"
import type { UserProfile } from "@/types"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2")
  })

  it("handles conditional classes", () => {
    expect(cn("base", (false as boolean) && "hidden", "visible")).toBe("base visible")
  })

  it("merges Tailwind classes correctly", () => {
    expect(cn("px-4", "px-6")).toBe("px-6")
  })
})

describe("getUserTitles", () => {
  it("returns rookie for empty user", () => {
    const titles = getUserTitles({} as UserProfile, "RU")
    expect(titles[0].id).toBe("rookie")
  })

  it("returns king for match >= 90", () => {
    const titles = getUserTitles({ match: 95 } as UserProfile, "RU")
    expect(titles[0].id).toBe("king")
  })

  it("returns party for 5+ interests", () => {
    const titles = getUserTitles(
      { match: 50, interests: ["a", "b", "c", "d", "e"] } as UserProfile,
      "RU",
    )
    expect(titles[0].id).toBe("party")
  })

  it("returns romantic for long bio", () => {
    const titles = getUserTitles(
      { match: 50, interests: ["a"], bio: "A".repeat(30) } as UserProfile,
      "RU",
    )
    expect(titles[0].id).toBe("romantic")
  })

  it("uses correct language for display name", () => {
    const ru = getUserTitles({} as UserProfile, "RU")
    const en = getUserTitles({} as UserProfile, "EN")
    expect(ru[0].displayName).toBe("Новичок")
    expect(en[0].displayName).toBe("Rookie")
  })
})
