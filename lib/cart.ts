'use client';

const STORAGE_KEY = 'fruit-shop-cart-v1';
const CART_EVENT = 'cart-updated';

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function readRaw(): CartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (it): it is CartItem =>
        it &&
        typeof it.productId === 'string' &&
        typeof it.name === 'string' &&
        typeof it.price === 'number' &&
        typeof it.quantity === 'number' &&
        it.quantity > 0,
    );
  } catch {
    return [];
  }
}

function writeRaw(items: CartItem[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

export function getCart(): CartItem[] {
  return readRaw();
}

export function addToCart(item: Omit<CartItem, 'quantity'>, quantity: number) {
  if (quantity < 1) return;
  const items = readRaw();
  const existing = items.find((it) => it.productId === item.productId);
  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + quantity);
  } else {
    items.push({ ...item, quantity: Math.min(99, quantity) });
  }
  writeRaw(items);
}

export function updateQuantity(productId: string, quantity: number) {
  const items = readRaw();
  const target = items.find((it) => it.productId === productId);
  if (!target) return;
  if (quantity < 1) {
    removeFromCart(productId);
    return;
  }
  target.quantity = Math.min(99, Math.max(1, Math.floor(quantity)));
  writeRaw(items);
}

export function removeFromCart(productId: string) {
  const items = readRaw().filter((it) => it.productId !== productId);
  writeRaw(items);
}

export function clearCart() {
  writeRaw([]);
}

export function getCartTotal(): number {
  return readRaw().reduce((sum, it) => sum + it.price * it.quantity, 0);
}

export function getCartCount(): number {
  return readRaw().reduce((sum, it) => sum + it.quantity, 0);
}

export const CART_UPDATED_EVENT = CART_EVENT;
