// Everything now goes to port 8080 (the Gateway)
const GATEWAY_URL = "http://localhost:8080/api"; 

export const PRODUCTS_URL = `${GATEWAY_URL}/products`;
export const ORDERS_URL = `${GATEWAY_URL}/orders`;