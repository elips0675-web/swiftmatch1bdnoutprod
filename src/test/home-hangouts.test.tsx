import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockFlags = vi.hoisted(() => ({ hangoutsEnabled: true }));

vi.mock("@/context/language-context", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: "ru",
    setLanguage: () => {},
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/context/feature-flags-context", () => ({
  useFeatureFlags: () => mockFlags,
}));

vi.mock("@/shims/next-dynamic", () => ({
  default: () => () => null,
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: () => (props: Record<string, unknown>) => {
      const { layoutId, ...rest } = props as { layoutId?: string };
      return <div {...(rest as object)} />;
    },
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/layout/app-header", () => ({
  AppHeader: () => <div data-testid="mock-app-header" />,
}));

vi.mock("@/components/navigation/bottom-nav", () => ({
  BottomNav: () => <div data-testid="mock-bottom-nav" />,
}));

vi.mock("@/lib/demo-data", () => ({
  ALL_DEMO_USERS: [],
  GROUP_CATEGORIES: [],
}));

import Home from "@/pages/Home";

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

describe("Home hangouts banner", () => {
  beforeEach(() => {
    cleanup();
    mockFlags.hangoutsEnabled = true;
  });

  it("renders banner when hangoutsEnabled is true", () => {
    renderHome();
    expect(screen.getByTestId("home-hangouts")).toBeTruthy();
  });

  it("hides banner when hangoutsEnabled is false", () => {
    mockFlags.hangoutsEnabled = false;
    renderHome();
    expect(screen.queryByTestId("home-hangouts")).toBeNull();
  });
});
