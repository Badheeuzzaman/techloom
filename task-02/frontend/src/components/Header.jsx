import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

export default function Header() {
  const { itemCount } = useCart();

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand">
          <span className="brand-dot" />
          Peacock &amp; Blue
        </Link>
        <nav className="nav">
          <Link to="/">Shop</Link>
          <Link to="/orders">My Orders</Link>
          <Link to="/cart" className="cart-link">
            Cart
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}
