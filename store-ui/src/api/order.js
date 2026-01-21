import client from "./client";

export async function placeOrder(items) {
  if (!items.length) {
    throw new Error("Cart is empty");
  }

  try {
    const res = await client.post("/orders", { items });
    return res.data;
  } catch {
    throw new Error("Checkout failed");
  }
}
