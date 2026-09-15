import { useEffect, useState } from "react";
import { api } from "../api.js";
import ProductCard from "./ProductCard.jsx";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      api
        .getProducts({
          search,
          category,
          maxPrice,
          inStock: inStockOnly ? "true" : "",
        })
        .then(setProducts)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 250); // small debounce so we don't fetch on every keystroke

    return () => clearTimeout(timer);
  }, [search, category, maxPrice, inStockOnly]);

  return (
    <section>
      <div className="hero">
        <h1>Find something you'll actually use.</h1>
        <p>Search and filter a small, honest catalog. No filler, no fake urgency banners.</p>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-input search-input"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="filter-input">
          <option value="All">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="filter-input price-input"
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
          />
          In stock only
        </label>
      </div>

      {loading && <p className="status-text">Loading products…</p>}
      {error && <p className="status-text status-error">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <p className="status-text">No products match your search.</p>
      )}

      <div className="product-grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
