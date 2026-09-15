import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

export default function Cart() {
  const { cart, updateQty, removeFromCart, total } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <section className="empty-state">
        <h2>Your cart is empty</h2>
        <p>Add a few things you like — nothing is reserved until checkout.</p>
        <Link to="/" className="btn btn-primary">
          Browse products
        </Link>
      </section>
    );
  }

  return (
    <section>
      <h1>Your cart</h1>
      <div className="cart-list">
        {cart.map((item) => (
          <div className="cart-row" key={item.productId}>
            <div>
              <p className="cart-item-name">{item.name}</p>
              <p className="stock-hint">${item.price.toFixed(2)} each</p>
            </div>
            <input
              type="number"
              min="1"
              max={item.stock}
              value={item.qty}
              onChange={(e) => updateQty(item.productId, Number(e.target.value))}
              className="qty-input"
            />
            <p className="cart-line-total">${(item.price * item.qty).toFixed(2)}</p>
            <button className="link-button remove-button" onClick={() => removeFromCart(item.productId)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <span>Total</span>
        <span className="price price-large">${total.toFixed(2)}</span>
      </div>

      <button className="btn btn-primary btn-block" onClick={() => navigate("/checkout")}>
        Go to checkout
      </button>
    </section>
  );
}
