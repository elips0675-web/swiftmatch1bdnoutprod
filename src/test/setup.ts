import "@testing-library/jest-dom";

function ensureStorage(kind: "localStorage" | "sessionStorage") {
  const existing = globalThis[kind]
  if (existing && typeof existing.removeItem === "function") return
  const store = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(String(key)) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => void store.delete(String(key)),
    setItem: (key, value) => void store.set(String(key), String(value)),
  }
  Object.defineProperty(globalThis, kind, { value: storage, configurable: true })
}

ensureStorage("localStorage")
ensureStorage("sessionStorage")

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
