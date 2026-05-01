export type CartItem = {
  key: string;
  id: string;
  name: string;
  price: number;
  qty: number;
  color?: string;
  size?: string;
  placeholder?: string;
  slug?: string;
};

const STORAGE_KEY = 'bdl_cart_v1';
export const CART_CHANGE_EVENT = 'bdl-cart-change';

const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const read = (): CartItem[] => {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (it): it is CartItem =>
        it != null &&
        typeof it === 'object' &&
        typeof (it as CartItem).id === 'string' &&
        typeof (it as CartItem).price === 'number' &&
        typeof (it as CartItem).qty === 'number'
    );
  } catch {
    return [];
  }
};

const notify = (items: CartItem[]): void => {
  if (!isBrowser()) return;
  window.dispatchEvent(
    new CustomEvent<CartItem[]>(CART_CHANGE_EVENT, { detail: items })
  );
};

const write = (items: CartItem[]): void => {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  notify(items);
};

const itemKey = (id: string, size?: string, color?: string): string =>
  `${id}|${size ?? ''}|${color ?? ''}`;

export const cart = {
  items: (): CartItem[] => read(),
  count: (): number => read().reduce((a, b) => a + b.qty, 0),
  total: (): number => read().reduce((a, b) => a + b.price * b.qty, 0),
  add(item: Omit<CartItem, 'key' | 'qty'> & { qty?: number }): void {
    const items = read();
    const key = itemKey(item.id, item.size, item.color);
    const existing = items.find((i) => i.key === key);
    if (existing) {
      existing.qty += item.qty ?? 1;
    } else {
      items.push({ ...item, key, qty: item.qty ?? 1 });
    }
    write(items);
  },
  remove(key: string): void {
    write(read().filter((i) => i.key !== key));
  },
  setQty(key: string, qty: number): void {
    const items = read();
    const item = items.find((i) => i.key === key);
    if (!item) return;
    item.qty = Math.max(1, qty);
    write(items);
  },
  clear(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(STORAGE_KEY);
    notify([]);
  },
};

if (isBrowser()) {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) notify(read());
  });
}
