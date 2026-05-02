import { describe, it, expect, beforeEach, vi } from 'vitest';

const STORAGE_KEY = 'bdl_cart_v1';
const CART_CHANGE_EVENT = 'bdl-cart-change';

async function loadCart(): Promise<typeof import('~/lib/cart')> {
  vi.resetModules();
  return await import('~/lib/cart');
}

describe('cart', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('add: producto nuevo crea entry con qty=1', async () => {
    const { cart } = await loadCart();
    cart.add({
      id: 'p01',
      name: 'Sweater',
      price: 89000,
      placeholder: 'SW',
    });
    const items = cart.items();
    expect(items).toHaveLength(1);
    expect(items[0]?.qty).toBe(1);
    expect(items[0]?.id).toBe('p01');
  });

  it('add: mismo id+size+color suma qty (no duplica entry)', async () => {
    const { cart } = await loadCart();
    cart.add({ id: 'p01', name: 'Sweater', price: 89000, placeholder: '', size: 'M', color: '#CB674C' });
    cart.add({ id: 'p01', name: 'Sweater', price: 89000, placeholder: '', size: 'M', color: '#CB674C' });
    const items = cart.items();
    expect(items).toHaveLength(1);
    expect(items[0]?.qty).toBe(2);
  });

  it('add: mismo id pero distinto size genera items separados', async () => {
    const { cart } = await loadCart();
    cart.add({ id: 'p01', name: 'Sweater', price: 89000, placeholder: '', size: 'M' });
    cart.add({ id: 'p01', name: 'Sweater', price: 89000, placeholder: '', size: 'L' });
    const items = cart.items();
    expect(items).toHaveLength(2);
  });

  it('remove(key): elimina sólo ese key', async () => {
    const { cart } = await loadCart();
    cart.add({ id: 'p01', name: 'A', price: 100, placeholder: '', size: 'M' });
    cart.add({ id: 'p02', name: 'B', price: 200, placeholder: '', size: 'M' });
    const [first] = cart.items();
    expect(first).toBeDefined();
    cart.remove(first!.key);
    const items = cart.items();
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('p02');
  });

  it('setQty(key, 0): clampa a 1', async () => {
    const { cart } = await loadCart();
    cart.add({ id: 'p01', name: 'A', price: 100, placeholder: '', qty: 5 });
    const [item] = cart.items();
    expect(item).toBeDefined();
    cart.setQty(item!.key, 0);
    expect(cart.items()[0]?.qty).toBe(1);
  });

  it('count y total reflejan varios items con sus qty', async () => {
    const { cart } = await loadCart();
    cart.add({ id: 'p01', name: 'A', price: 100, placeholder: '', qty: 2 });
    cart.add({ id: 'p02', name: 'B', price: 250, placeholder: '', qty: 3 });
    expect(cart.count()).toBe(5);
    expect(cart.total()).toBe(2 * 100 + 3 * 250);
  });

  it('clear: vacía el carrito y dispara bdl-cart-change con detail vacío', async () => {
    const { cart } = await loadCart();
    cart.add({ id: 'p01', name: 'A', price: 100, placeholder: '' });

    const handler = vi.fn();
    window.addEventListener(CART_CHANGE_EVENT, handler);
    cart.clear();
    window.removeEventListener(CART_CHANGE_EVENT, handler);

    expect(cart.items()).toEqual([]);
    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0]?.[0] as CustomEvent<unknown[]>;
    expect(event.detail).toEqual([]);
  });

  it('multi-tab sync: storage event re-lee y re-emite bdl-cart-change', async () => {
    const { cart } = await loadCart();
    expect(cart.items()).toEqual([]);

    const newItem = [
      {
        key: 'p99||',
        id: 'p99',
        name: 'X',
        price: 500,
        qty: 2,
        placeholder: '',
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItem));

    const handler = vi.fn();
    window.addEventListener(CART_CHANGE_EVENT, handler);

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: JSON.stringify(newItem),
      })
    );

    window.removeEventListener(CART_CHANGE_EVENT, handler);

    // Cada loadCart() del beforeEach re-registra el listener de 'storage' en
    // cart.ts (top-level side effect). El handler se dispara N veces, una por
    // cada import acumulado. Lo importante es que SE DISPARE y que items()
    // refleje el estado nuevo del localStorage.
    expect(handler).toHaveBeenCalled();
    expect(cart.items()).toHaveLength(1);
    expect(cart.items()[0]?.id).toBe('p99');
  });

  it('defensivo: JSON corrupto en localStorage → items() devuelve []', async () => {
    localStorage.setItem(STORAGE_KEY, '{not json}');
    const { cart } = await loadCart();
    expect(cart.items()).toEqual([]);
  });
});
