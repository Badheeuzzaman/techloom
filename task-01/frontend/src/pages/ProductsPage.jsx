import { useEffect, useState, useCallback } from "react";
import { api } from "../api.js";
import ProductCard from "../components/ProductCard.jsx";
import ProductFormModal from "../components/ProductFormModal.jsx";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProduct, setEditingProduct] = useState(null); // null = closed, {} = new, {...} = editing
  const [refreshTick, setRefreshTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const { products } = await api.listProducts();
      setProducts(products);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Poll periodically so reservations made/released elsewhere (or by the
    // background sweeper) are reflected without a manual refresh.
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load, refreshTick]);

  async function handleSave(data) {
    if (editingProduct?.id) {
      await api.updateProduct(editingProduct.id, data);
    } else {
      await api.createProduct(data);
    }
    setEditingProduct(null);
    setRefreshTick((t) => t + 1);
    await load();
  }

  async function handleDelete(product) {
    if (!confirm(`Delete "${product.name}"?`)) return;
    try {
      await api.deleteProduct(product.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Inventory</h1>
          <p className="text-sm text-stone-500">Stock levels update in real time as orders are reserved, paid, or released.</p>
        </div>
        <button
          onClick={() => setEditingProduct({})}
          className="rounded-lg bg-ink-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          + New product
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {loading ? (
        <p className="text-sm text-stone-400">Loading products…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onEdit={setEditingProduct} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {editingProduct !== null && (
        <ProductFormModal product={editingProduct} onClose={() => setEditingProduct(null)} onSave={handleSave} />
      )}
    </div>
  );
}
