import { useEffect, useState, useCallback } from "react";
import { api } from "../api.js";
import OrderRow from "../components/OrderRow.jsx";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const { orders } = await api.listOrders();
      setOrders(orders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000); // picks up sweeper-driven expiries automatically
    return () => clearInterval(id);
  }, [load]);

  async function handleCancel(orderId) {
    try {
      await api.cancelOrder(orderId);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-1 text-xl font-bold text-ink-900">Orders</h1>
      <p className="mb-6 text-sm text-stone-500">
        Reserved orders auto-expire 5 minutes after checkout if payment isn't completed.
      </p>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {loading ? (
        <p className="text-sm text-stone-400">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone-300 py-10 text-center text-sm text-stone-400">
          No orders yet — add something to your cart and check out.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs font-semibold uppercase text-stone-400">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reservation</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <OrderRow key={o.id} order={o} onCancel={handleCancel} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
