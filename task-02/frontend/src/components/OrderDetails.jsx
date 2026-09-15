import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import StatusBadge from "./StatusBadge.jsx";

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    api.getOrder(id).then(setOrder).catch((err) => setError(err.message));
  }

  useEffect(load, [id]);

  async function handleCancel() {
    setBusy(true);
    setError("");
    try {
      const updated = await api.cancelOrder(order.id);
      setOrder(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRefund() {
    setBusy(true);
    setError("");
    try {
      const updated = await api.refundOrder(order.id);
      setOrder(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !order) return <p className="status-text status-error">{error}</p>;
  if (!order) return <p className="status-text">Loading…</p>;

  const canCancel = order.status === "RESERVED" || order.status === "PAID";
  const canRefund = order.status === "PAID";

  return (
    <section className="checkout">
      <button className="link-button" onClick={() => navigate("/orders")}>
        ← Back to orders
      </button>
      <div className="order-details-header">
        <h1>Order #{order.id}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="stock-hint">Placed {new Date(order.createdAt).toLocaleString()}</p>

      <div className="order-summary-card">
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

      {order.refunded && <p className="status-text">This order was refunded.</p>}
      {error && <p className="status-text status-error">{error}</p>}

      <div className="payment-buttons">
        {canCancel && (
          <button className="btn btn-outline" disabled={busy} onClick={handleCancel}>
            Cancel order
          </button>
        )}
        {canRefund && (
          <button className="btn btn-outline" disabled={busy} onClick={handleRefund}>
            Request refund
          </button>
        )}
      </div>
    </section>
  );
}
