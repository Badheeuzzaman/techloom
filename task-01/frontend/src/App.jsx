import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { CartProvider } from "./CartContext.jsx";
import Header from "./components/Header.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <CartProvider>
      <div className="min-h-screen bg-stone-50">
        <Header onOpenCart={() => setCartOpen(true)} />
        <Routes>
          <Route path="/" element={<ProductsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
        </Routes>
        {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
      </div>
    </CartProvider>
  );
}
