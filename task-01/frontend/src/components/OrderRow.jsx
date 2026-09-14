import { useEffect, useState } from "react";
import StatusBadge from "./StatusBadge.jsx";

function formatCountdown(targetIso) {
  const diff = Math.max(0, Math.floor((new Date(targetIso).getTime() - Date.now()) / 1000));
  return `${String(Math.floor(diff / 60)).padStart(2, "0")}:${String(diff % 60).padStart(2, "0")}`;
}

export default function OrderRow({ order, onCancel }) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (order.status !== "reserved") return;
    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [order.status]);

  return (
    <tr className="border-b border-stone-100 last:border-0">
      <td className="px-4 py-3 text-sm font-medium text-ink-900">#{order.id}</td>
      <td className="px-4 py-3 text-sm text-stone-600">
        {order.items.map((it) => `${it.quantity}× ${it.product_name}`).join(", ")}
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-ink-900">${Number(order.total_amount).toFixed(2)}</td>
      <td className="px-4 py-3">
        <StatusBadge status={order.status} />
      </td>
      <td className="px-4 py-3 text-sm text-stone-500">
        {order.status === "reserved" && order.reserved_until ? formatCountdown(order.reserved_until) : "—"}
      </td>
      <td className="px-4 py-3 text-right">
        {order.status === "reserved" && (
          <button onClick={() => onCancel(order.id)} className="text-xs font-semibold text-red-600 hover:underline">
            Cancel
          </button>
        )}
      </td>
    </tr>
  );
}
