import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../CartContext.jsx";
import { api } from "../api.js";
import StatusBadge from "./StatusBadge.jsx";

function useCountdown(targetIso) {
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    if (!targetIso) return;
    function tick() {
      const diff = Math.max(0, Math.floor((new Date(targetIso).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return secondsLeft;
}

export default function CartDrawer({ onClose }) {
  const { items, updateQuantity, removeItem, clearCart, totalAmount } = useCart();
  const navigate = useNavigate();
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const [order, setOrder] = useState(null); // the reserved order, once checkout succeeds
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [payingOutcome, setPayingOutcome] = useState(null);

  const secondsLeft = useCountdown(order?.status === "reserved" ? order.reserved_until : null);
  const isExpiredLocally = order?.status === "reserved" && secondsLeft === 0;

  async function handleCheckout() {
    setError("");
    setSubmitting(true);
    try {
      const { order: created } = await api.createOrder({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        idempotencyKey: idempotencyKeyRef.current,
      });
      setOrder(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePay(outcome) {
    setPayingOutcome(outcome);
    setError("");
    try {
      const { order: updated } = await api.payOrder(order.id, outcome);
      setOrder(updated);
      if (updated.status === "paid") clearCart();
    } catch (err) {
      setError(err.message);
      // Refresh order state — likely means it expired out from under us.
      try {
        const { order: refreshed } = await api.getOrder(order.id);
        setOrder(refreshed);
      } catch {
        /* ignore */
      }
    } finally {
      setPayingOutcome(null);
    }
  }

  async function handleCancel() {
    try {
      const { order: updated } = await api.cancelOrder(order.id);
      setOrder(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  function finish() {
    idempotencyKeyRef.current = crypto.randomUUID();
    setOrder(null);
    onClose();
    navigate("/orders");
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/40">
      <div className="flex h-full w-full max-w-sm flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-base font-bold text-ink-900">{order ? "Checkout" : "Your cart"}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600" aria-label="Close cart">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          {!order && (
            <>
              {items.length === 0 ? (
                <p className="py-10 text-center text-sm text-stone-400">Your cart is empty.</p>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item.productId} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink-900">{item.name}</p>
                        <p className="text-xs text-stone-400">${item.price.toFixed(2)} each</p>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={item.availableStock}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                        className="w-14 rounded-md border border-stone-300 px-2 py-1 text-center text-sm"
                      />
                      <button onClick={() => removeItem(item.productId)} className="text-stone-400 hover:text-red-600" aria-label="Remove">
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {order && (
            <div className="space-y-4">
              <div className="rounded-lg border border-stone-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-500">Order #{order.id}</span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-2 text-2xl font-bold text-ink-900">${Number(order.total_amount).toFixed(2)}</p>
                <ul className="mt-2 space-y-0.5 text-xs text-stone-500">
                  {order.items.map((it) => (
                    <li key={it.product_id}>
                      {it.quantity} × {it.product_name}
                    </li>
                  ))}
                </ul>
              </div>

              {order.status === "reserved" && !isExpiredLocally && (
                <>
                  <div className="rounded-lg bg-blue-50 px-3 py-2 text-center text-sm text-blue-700">
                    Reservation holds for <strong>{String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}</strong>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-stone-400">Simulate payment gateway</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handlePay("success")}
                        disabled={payingOutcome !== null}
                        className="rounded-lg bg-blue-600 px-2 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {payingOutcome === "success" ? "…" : "Success"}
                      </button>
                      <button
                        onClick={() => handlePay("failure")}
                        disabled={payingOutcome !== null}
                        className="rounded-lg bg-red-600 px-2 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {payingOutcome === "failure" ? "…" : "Failure"}
                      </button>
                      <button
                        onClick={() => handlePay("timeout")}
                        disabled={payingOutcome !== null}
                        className="rounded-lg bg-slate-500 px-2 py-2 text-xs font-semibold text-white hover:bg-slate-600 disabled:opacity-60"
                      >
                        {payingOutcome === "timeout" ? "…" : "Timeout"}
                      </button>
                    </div>
                  </div>

                  <button onClick={handleCancel} className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-stone-50">
                    Cancel reservation
                  </button>
                </>
              )}

              {(isExpiredLocally || order.status !== "reserved") && (
                <div className="rounded-lg border border-stone-200 p-3 text-center text-sm text-stone-500">
                  {order.status === "paid" && "Payment confirmed. Stock has been permanently deducted."}
                  {order.status === "failed" && "Payment failed. Your items were released back to stock."}
                  {order.status === "expired" && "This reservation expired. Your items were released back to stock."}
                  {order.status === "cancelled" && "Order cancelled. Your items were released back to stock."}
                  {order.status === "reserved" && isExpiredLocally && "Reservation window closed — refresh to confirm."}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-stone-200 px-5 py-4">
          {!order ? (
            <>
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-stone-500">Total</span>
                <span className="text-lg font-bold text-ink-900">${totalAmount.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={items.length === 0 || submitting}
                className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {submitting ? "Reserving stock…" : "Checkout"}
              </button>
            </>
          ) : (
            (order.status !== "reserved" || isExpiredLocally) && (
              <button onClick={finish} className="w-full rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-700">
                Done
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
