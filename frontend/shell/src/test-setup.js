// Node 22+ expoe um `localStorage` global experimental que, sem `--localstorage-file`,
// fica `undefined` e esconde o `localStorage` do jsdom. Aqui garantimos uma implementacao
// funcional para os testes, usando a do jsdom quando ela estiver acessivel.
function createMemoryStorage() {
  const store = new Map();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, String(value));
    },
  };
}

const current = globalThis.localStorage;
const fromWindow = typeof window !== "undefined" ? window.localStorage : undefined;

if (!current) {
  Object.defineProperty(globalThis, "localStorage", {
    value: fromWindow ?? createMemoryStorage(),
    configurable: true,
    writable: true,
  });
}
