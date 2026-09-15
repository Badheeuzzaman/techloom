import { Routes, Route } from "react-router-dom";
import Header from "./components/Header.jsx";
import ProductList from "./components/ProductList.jsx";
import ProductDetails from "./components/ProductDetails.jsx";
import Cart from "./components/Cart.jsx";
import Checkout from "./components/Checkout.jsx";
import OrderHistory from "./components/OrderHistory.jsx";
import OrderDetails from "./components/OrderDetails.jsx";

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
        </Routes>
      </main>
      <footer className="footer">Built for the Techloom.ai assessment — mock payments only, no real charges.</footer>
    </div>
  );
}
