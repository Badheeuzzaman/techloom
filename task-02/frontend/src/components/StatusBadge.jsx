// Small colored label for order statuses, reused on the order
// history list and the order details page.

const STATUS_STYLES = {
  RESERVED: "status-reserved",
  PAID: "status-paid",
  FAILED: "status-failed",
  CANCELLED: "status-cancelled",
  EXPIRED: "status-expired",
  REFUNDED: "status-refunded",
};

export default function StatusBadge({ status }) {
  const className = STATUS_STYLES[status] || "status-default";
  return <span className={`status-badge ${className}`}>{status}</span>;
}
