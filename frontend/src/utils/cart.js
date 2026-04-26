const KEY = "pharmahub_cart";

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

const write = (items) => {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cart:update", { detail: items }));
};

export const getCart = () => read();

export const cartCount = () =>
  read().reduce((acc, it) => acc + (it.quantity || 1), 0);

export const cartTotal = () =>
  read().reduce(
    (acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1),
    0
  );

export const addToCart = (item, qty = 1) => {
  const items = read();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    items[idx].quantity = (items[idx].quantity || 1) + qty;
  } else {
    items.push({ ...item, quantity: qty });
  }
  write(items);
  return items;
};

export const removeFromCart = (id) => {
  write(read().filter((i) => i.id !== id));
};

export const updateQty = (id, qty) => {
  const items = read().map((i) =>
    i.id === id ? { ...i, quantity: Math.max(1, Number(qty) || 1) } : i
  );
  write(items);
};

export const clearCart = () => write([]);
