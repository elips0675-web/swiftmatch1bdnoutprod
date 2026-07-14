import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ErrorBoundary } from "@/components/shared/error-boundary"

const ErrorThrower = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) throw new Error("Test error")
  return <div>All good</div>
}

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Hello world</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText("Hello world")).toBeTruthy()
  })

  it("renders error UI when child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ErrorThrower shouldThrow />
      </ErrorBoundary>,
    )

    expect(screen.getByText("Что-то пошло не так")).toBeTruthy()
    expect(screen.getByText("Test error")).toBeTruthy()
    expect(screen.getByText("Попробовать снова")).toBeTruthy()

    vi.restoreAllMocks()
  })

  it("retry button resets error state", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})

    const { rerender } = render(
      <ErrorBoundary>
        <ErrorThrower shouldThrow />
      </ErrorBoundary>,
    )

    expect(screen.getByText("Что-то пошло не так")).toBeTruthy()

    rerender(
      <ErrorBoundary>
        <ErrorThrower shouldThrow={false} />
      </ErrorBoundary>,
    )

    fireEvent.click(screen.getByText("Попробовать снова"))
    expect(screen.getByText("All good")).toBeTruthy()

    vi.restoreAllMocks()
  })

  it("renders custom fallback when provided", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})

    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ErrorThrower shouldThrow />
      </ErrorBoundary>,
    )

    expect(screen.getByText("Custom error UI")).toBeTruthy()

    vi.restoreAllMocks()
  })

  it("calls onError when child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const onError = vi.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ErrorThrower shouldThrow />
      </ErrorBoundary>,
    )

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(onError.mock.calls[0][0].message).toBe("Test error")

    vi.restoreAllMocks()
  })
})
