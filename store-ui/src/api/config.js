// store-ui/src/api/config.js

// In K8s, this will be your Ingress URL. Locally, it's the gateway port.
const GATEWAY_BASE_URL = process.env.REACT_APP_GATEWAY_URL || "http://localhost:8080";

export const API_ENDPOINTS = {
    PRODUCTS: `${GATEWAY_BASE_URL}/api/products`,
    ORDERS: `${GATEWAY_BASE_URL}/api/orders`,
    PAYMENTS: `${GATEWAY_BASE_URL}/api/payments`
};