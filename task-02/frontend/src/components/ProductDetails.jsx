import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useCart } from "../context/CartContext.jsx";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api
      .getProduct(id)
      .then(setProduct)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="status-text status-error">{error}</p>;
  if (!product) return <p className="status-text">Loading…</p>;

  const outOfStock = product.stock === 0;

  function handleAdd() {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <section className="product-details">
      <button className="link-button" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <div className="product-details-grid">
        <img src={product.image} alt={product.name} className="product-details-image" />
        <div>
          <p className="product-category">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="product-description">{product.description}</p>
          <p className="price price-large">${product.price.toFixed(2)}</p>

          {outOfStock ? (
            <p className="status-text status-error">Out of stock</p>
          ) : (
            <>
              <p className="stock-hint">{product.stock} in stock</p>
              <div className="qty-row">
                <label htmlFor="qty">Quantity</label>
                <input
                  id="qty"
                  type="number"
                  min="1"
                  max={product.stock}
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.max(1, Math.min(product.stock, Number(e.target.value))))
                  }
                />
              </div>
              <button className="btn btn-primary" onClick={handleAdd}>
                {added ? "Added ✓" : "Add to cart"}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
