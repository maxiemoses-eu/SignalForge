export default function ProductList({ products, loading, onAdd }) {
  if (loading) {
    return <p>Loading products…</p>;
  }

  if (!products.length) {
    return <p>No products available</p>;
  }

  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>
          <strong>{p.name}</strong> — ${p.price}
          <button onClick={() => onAdd(p)}>Add</button>
        </li>
      ))}
    </ul>
  );
}
