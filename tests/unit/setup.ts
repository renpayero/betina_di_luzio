/**
 * Setup file para tests unit (jsdom).
 *
 * Node 25 expone un `localStorage` experimental nativo que sombrea al de jsdom
 * y deja `clear()` indefinido (solo soporta get/set/removeItem). Para tener un
 * `Storage` confiable y determinístico, instalamos un shim Map-backed que
 * cumple con la interfaz `Storage` de Web Storage.
 *
 * Side-effect: emite `StorageEvent` en `window` cuando cambia, para mantener
 * paridad con el comportamiento real (aunque cart.ts dispara su propio evento).
 */
import { beforeEach } from 'vitest';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const memStorage = new MemoryStorage();

Object.defineProperty(globalThis, 'localStorage', {
  value: memStorage,
  configurable: true,
  writable: true,
});

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: memStorage,
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  memStorage.clear();
});
