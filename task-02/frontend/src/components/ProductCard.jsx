import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  const outOfStock = product.stock === 0;

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-image-wrap">
        <img src={product.image} alt={product.name} loading="lazy" />
        {outOfStock && <span className="badge badge-out">Out of stock</span>}
      </div>
      <div className="product-card-body">
        <p className="product-category">{product.category}</p>
        <h3>{product.name}</h3>
        <div className="product-card-footer">
          <span className="price">${product.price.toFixed(2)}</span>
          {!outOfStock && <span className="stock-hint">{product.stock} left</span>}
        </div>
      </div>
    </Link>
  );
}
