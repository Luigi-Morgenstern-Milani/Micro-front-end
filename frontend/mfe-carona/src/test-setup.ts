// Node 22+ expoe um `localStorage` global experimental que, sem `--localstorage-file`,
// fica `undefined` e esconde o `localStorage` do jsdom. Aqui garantimos uma implementacao
// funcional para os testes, usando a do jsdom quando ela estiver acessivel.
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
}

const current = (globalThis as { localStorage?: Storage }).localStorage;
const fromWindow =
  typeof window !== "undefined" ? (window as { localStorage?: Storage }).localStorage : undefined;

if (!current) {
  Object.defineProperty(globalThis, "localStorage", {
    value: fromWindow ?? createMemoryStorage(),
    configurable: true,
    writable: true,
  });
}
