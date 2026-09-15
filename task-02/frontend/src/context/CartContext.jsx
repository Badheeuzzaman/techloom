// CartContext.jsx
// A small React Context to hold the shopping cart so any page can
// read or update it, without passing props through every component.

import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // cart is a list of { productId, name, price, qty, stock }
  const [cart, setCart] = useState([]);

  function addToCart(product, qty = 1) {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, qty: Math.min(item.qty + qty, product.stock) }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          qty,
          stock: product.stock,
        },
      ];
    });
  }

  function updateQty(productId, qty) {
    setCart((prev) =>
      prev
        .map((item) => (item.productId === productId ? { ...item, qty } : item))
        .filter((item) => item.qty > 0)
    );
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }

  function clearCart() {
    setCart([]);
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, updateQty, removeFromCart, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
