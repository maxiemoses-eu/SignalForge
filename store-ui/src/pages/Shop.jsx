import { useEffect, useState } from "react";
import { fetchProducts } from "../api/catalog";
import { placeOrder } from "../api/order";
import ProductList from "../components/ProductList";
import Notification from "../components/Notification";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ type: "", message: "" });

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(err =>
        setNotice({ type: "error", message: err.message })
      )
      .finally(() => setLoading(false));
  }, []);

  const checkout = async () => {
    setNotice({});

    try {
      await placeOrder(cart);
      setCart([]);
      setNotice({ type: "success", message: "Order placed successfully" });
    } catch (err) {
      setNotice({ type: "error", message: err.message });
    }
  };

  return (
    <>
      <h1>SignalForge Shop</h1>

      <Notification {...notice} />

      <ProductList
        products={products}
        loading={loading}
        onAdd={p => setCart([...cart, p])}
      />

      <button disabled={!cart.length} onClick={checkout}>
        Checkout ({cart.length})
      </button>
    </>
  );
}
