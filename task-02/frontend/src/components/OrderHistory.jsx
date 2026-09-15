import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import StatusBadge from "./StatusBadge.jsx";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .getOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p className="status-text">Loading orders…</p>;

  if (orders.length === 0) {
    return (
      <section className="empty-state">
        <h2>No orders yet</h2>
        <p>Orders you place will show up here with their current status.</p>
        <Link to="/" className="btn btn-primary">
          Browse products
        </Link>
      </section>
    );
  }

  return (
    <section>
      <h1>My orders</h1>
      <div className="order-list">
        {orders.map((order) => (
          <Link to={`/orders/${order.id}`} className="order-row" key={order.id}>
            <div>
              <p className="cart-item-name">Order #{order.id}</p>
              <p className="stock-hint">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <span className="price">${order.total.toFixed(2)}</span>
            <StatusBadge status={order.status} />
          </Link>
        ))}
      </div>
    </section>
  );
}
