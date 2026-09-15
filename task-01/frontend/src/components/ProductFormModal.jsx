import { useState } from "react";

export default function ProductFormModal({ product, onClose, onSave }) {
  const isEdit = Boolean(product?.id);
  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price || "");
  const [totalStock, setTotalStock] = useState(product?.total_stock ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim() || price === "" || totalStock === "") {
      setError("All fields are required.");
      return;
    }
    setSubmitting(true);
    try {
      await onSave({ name: name.trim(), price: Number(price), totalStock: Number(totalStock) });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink-900">{isEdit ? "Edit product" : "New product"}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600" aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              {isEdit ? "Total stock" : "Starting stock"}
            </label>
            <input
              type="number"
              min={isEdit ? product.reserved_stock : 0}
              step="1"
              value={totalStock}
              onChange={(e) => setTotalStock(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
            {isEdit && product.reserved_stock > 0 && (
              <p className="mt-1 text-xs text-stone-400">
                Can't go below {product.reserved_stock} — that much is currently reserved by pending orders.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink-700 hover:bg-stone-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-ink-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
            >
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
