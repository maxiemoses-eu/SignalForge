import client from "./client";

export async function fetchProducts() {
  try {
    const res = await client.get("/catalog/products");
    return res.data;
  } catch (err) {
    throw new Error("Failed to load products");
  }
}
