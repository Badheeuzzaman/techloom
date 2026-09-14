import { NavLink } from "react-router-dom";
import { useCart } from "../CartContext.jsx";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          isActive ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-stone-100"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Header({ onOpenCart }) {
  const { itemCount } = useCart();

  return (
    <header className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 text-sm font-bold text-white">
          C
        </div>
        <span className="text-lg font-bold text-ink-900">Counter POS</span>
      </div>

      <nav className="flex items-center gap-1">
        <NavItem to="/">Products</NavItem>
        <NavItem to="/orders">Orders</NavItem>
      </nav>

      <button
        onClick={onOpenCart}
        className="relative flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-ink-900 transition hover:bg-stone-50"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
        </svg>
        Cart
        {itemCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
            {itemCount}
          </span>
        )}
      </button>
    </header>
  );
}
