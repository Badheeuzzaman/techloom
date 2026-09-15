import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useCart } from "../context/CartContext.jsx";

// Generates a random token so the backend can tell if this exact
// checkout attempt was already submitted (e.g. a double click, or
// a network retry sending the same request twice).
function makeCheckoutToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function useCountdown(expiresAt) {
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return secondsLeft;
}

export default function Checkout() {
  const { cart, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const tokenRef = useRef(makeCheckoutToken());
  const hasCheckedOutRef = useRef(false);

  const secondsLeft = useCountdown(order?.reservationExpiresAt);
  const reservationExpired = order?.status === "RESERVED" && secondsLeft === 0;

  useEffect(() => {
    if (cart.length === 0) {
      navigate("/cart");
      return;
    }
    // Guard against React re-running this effect twice (e.g. Strict
    // Mode in development), which would otherwise fire two checkout
    // requests for the same cart.
    if (hasCheckedOutRef.current) return;
    hasCheckedOutRef.current = true;

    const items = cart.map((item) => ({ productId: item.productId, qty: item.qty }));
    api
      .checkout(items, tokenRef.current)
      .then(setOrder)
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePay(outcome) {
    if (paying || !order) return;
    setPaying(true);
    setError("");
    try {
      const updated = await api.payOrder(order.id, outcome);
      setOrder(updated);
      if (updated.status === "PAID") {
        clearCart();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  }

  if (error && !order) {
    return (
      <section className="empty-state">
        <h2>Couldn't start checkout</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate("/cart")}>
          Back to cart
        </button>
      </section>
    );
  }

  if (!order) {
    return <p className="status-text">Reserving your items…</p>;
  }

  return (
    <section className="checkout">
      <h1>Checkout</h1>

      <div className="order-summary-card">
        <h3>Order #{order.id}</h3>
        {order.items.map((item) => (
          <div className="cart-row cart-row-simple" key={item.productId}>
            <span>
              {item.name} × {item.qty}
            </span>
            <span>${(item.price * item.qty).toFixed(2)}</span>
          </div>
        ))}
        <div className="cart-summary">
          <span>Total</span>
          <span className="price price-large">${order.total.toFixed(2)}</span>
        </div>
      </div>

      {order.status === "RESERVED" && !reservationExpired && (
        <>
          <p className="reservation-timer">
            Stock reserved — complete payment within{" "}
            <strong>
              {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
            </strong>
          </p>

          <p className="status-text">
            This is a mock payment gateway. Choose an outcome to simulate it:
          </p>
          <div className="payment-buttons">
            <button className="btn btn-primary" disabled={paying} onClick={() => handlePay("success")}>
              Simulate success
            </button>
            <button className="btn btn-outline" disabled={paying} onClick={() => handlePay("fail")}>
              Simulate failure
            </button>
            <button className="btn btn-outline" disabled={paying} onClick={() => handlePay("timeout")}>
              Simulate timeout
            </button>
          </div>
          {error && <p className="status-text status-error">{error}</p>}
        </>
      )}

      {(reservationExpired || order.status === "EXPIRED") && (
        <div className="result-panel result-warning">
          <h3>Reservation expired</h3>
          <p>Your 5-minute hold on these items ran out before payment finished. Stock has been released.</p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Back to shop
          </button>
        </div>
      )}

      {order.status === "PAID" && (
        <div className="result-panel result-success">
          <h3>Payment successful</h3>
          <p>Order #{order.id} is confirmed. You can track it under My Orders.</p>
          <button className="btn btn-primary" onClick={() => navigate(`/orders/${order.id}`)}>
            View order
          </button>
        </div>
      )}

      {order.status === "FAILED" && (
        <div className="result-panel result-error">
          <h3>Payment failed</h3>
          <p>Your card wasn't charged and the reserved stock has been released.</p>
          <button className="btn btn-primary" onClick={() => navigate("/cart")}>
            Back to cart
          </button>
        </div>
      )}
    </section>
  );
}
