const LABELS = {
  reserved: "Reserved",
  paid: "Paid",
  failed: "Failed",
  expired: "Expired",
  cancelled: "Cancelled",
};

const COLORS = {
  reserved: "bg-blue-50 text-blue-700 ring-blue-200",
  paid: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
  expired: "bg-slate-100 text-slate-600 ring-slate-200",
  cancelled: "bg-gray-100 text-gray-600 ring-gray-200",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${COLORS[status] || COLORS.expired}`}>
      {LABELS[status] || status}
    </span>
  );
}
