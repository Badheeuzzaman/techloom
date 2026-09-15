import { useCart } from "../CartContext.jsx";

export default function ProductCard({ product, onEdit, onDelete }) {
  const { addItem } = useCart();
  const isLow = product.available_stock > 0 && product.available_stock <= 3;
  const isOut = product.available_stock === 0;

  return (
    <div className="flex flex-col rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink-900">{product.name}</h3>
        <div className="flex shrink-0 gap-1">
          <button onClick={() => onEdit(product)} className="text-stone-400 hover:text-ink-900" aria-label="Edit product">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
          <button onClick={() => onDelete(product)} className="text-stone-400 hover:text-red-600" aria-label="Delete product">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
            </svg>
          </button>
        </div>
      </div>

      <p className="mt-1 text-lg font-bold text-ink-900">${Number(product.price).toFixed(2)}</p>

      <div className="mt-2 flex items-center gap-1.5 text-xs">
        <span className={`h-1.5 w-1.5 rounded-full ${isOut ? "bg-red-500" : isLow ? "bg-blue-500" : "bg-slate-400"}`} />
        <span className={isOut ? "text-red-600" : isLow ? "text-blue-700" : "text-stone-500"}>
          {isOut ? "Out of stock" : `${product.available_stock} available`}
        </span>
        {product.reserved_stock > 0 && (
          <span className="text-stone-400">· {product.reserved_stock} reserved</span>
        )}
      </div>

      <button
        onClick={() => addItem(product)}
        disabled={isOut}
        className="mt-3 rounded-lg bg-ink-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
      >
        {isOut ? "Unavailable" : "Add to cart"}
      </button>
    </div>
  );
}
